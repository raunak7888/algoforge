//# filename: apps/api/src/services/algorithm.service.ts

import { Prisma, Difficulty } from "@algoforge/db";
import {
  AlgorithmListItemSchema,
  AlgorithmDetailSchema,
  AlgorithmExecutionSchema,
  ForgeCodeSchema,
  GuardRangesSchema,
  InputSchema,
  type CreateAlgorithm,
  type UpdateAlgorithm,
  type AlgorithmListItem,
  type AlgorithmDetail,
  type AlgorithmExecution,
} from "@algoforge/forge";
import { algorithmRepository, type AlgorithmDetailRow } from "../repositories/algorithm.repository";
import { AppError } from "../utils/app-error";

export type AlgorithmQuery = {
  categoryId?: string;
  difficulty?: string;
  isPublished?: boolean;
  search?: string;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Selects the best matching display code given a language preference.
 * Falls back to JavaScript, then the first available entry.
 */
function pickDisplayCode(
  displayCodes: { language: string; code: string }[],
  requestedLang?: string,
): { language: string; code: string } | null {
  if (!displayCodes.length) return null;
  const preferred = requestedLang ?? "javascript";
  return (
    displayCodes.find((dc) => dc.language === preferred) ??
    displayCodes.find((dc) => dc.language === "javascript") ??
    displayCodes[0]
  );
}

function toAlgorithmDetail(
  row: NonNullable<AlgorithmDetailRow>,
  requestedLang?: string,
): AlgorithmDetail {
  return AlgorithmDetailSchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    difficulty: row.difficulty,
    complexity:
      row.timeBest || row.timeAverage || row.timeWorst || row.spaceComplexity
        ? {
            timeBest: row.timeBest,
            timeAverage: row.timeAverage,
            timeWorst: row.timeWorst,
            space: row.spaceComplexity,
          }
        : null,
    displayCode: pickDisplayCode(row.displayCodes, requestedLang),
    tags: row.tags.map((t: { tag: { id: string; label: string } }) => t.tag),
    forge: row.forge
      ? {
          forgeCode: row.forge.forgeCode,
          inputSchema: row.forge.inputSchema,
          guardRanges: row.forge.guardRanges,
          version: row.forge.version,
        }
      : null,
  });
}

function validateForgeSchemas(forge: {
  forgeCode: unknown;
  guardRanges: unknown;
  inputSchema: unknown;
}): void {
  try {
    ForgeCodeSchema.parse(forge.forgeCode);
    GuardRangesSchema.parse(forge.guardRanges);
    InputSchema.parse(forge.inputSchema);
  } catch (error) {
    throw AppError.badRequest(
      "Invalid forge configuration: " +
        (error instanceof Error ? error.message : "Unknown error"),
    );
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class AlgorithmService {
  async listAlgorithms(query: AlgorithmQuery): Promise<AlgorithmListItem[]> {
    const where: Prisma.AlgorithmWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.difficulty
        ? { difficulty: query.difficulty as Difficulty }
        : {}),
      ...(query.isPublished !== undefined
        ? { isPublished: query.isPublished }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                tags: {
                  some: {
                    tag: {
                      label: {
                        contains: query.search,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const rows = await algorithmRepository.findMany(where);

    return rows.map((r) =>
      AlgorithmListItemSchema.parse({
        id: r.id,
        slug: r.slug,
        name: r.name,
        categoryId: r.categoryId,
        difficulty: r.difficulty,
        complexity:
          r.timeBest || r.timeAverage || r.timeWorst || r.spaceComplexity
            ? {
                timeBest: r.timeBest,
                timeAverage: r.timeAverage,
                timeWorst: r.timeWorst,
                space: r.spaceComplexity,
              }
            : null,
      }),
    );
  }

  async getAlgorithmById(id: string, lang?: string): Promise<AlgorithmDetail> {
    const row = await algorithmRepository.findById(id);
    if (!row) throw AppError.notFound("Algorithm not found.");
    return toAlgorithmDetail(row, lang);
  }

  async getAlgorithmBySlug(slug: string, lang?: string): Promise<AlgorithmDetail> {
    const row = await algorithmRepository.findBySlug(slug);
    if (!row) throw AppError.notFound("Algorithm not found.");
    return toAlgorithmDetail(row, lang);
  }

  async getAlgorithmExecution(id: string): Promise<AlgorithmExecution> {
    const algorithm = await algorithmRepository.findByIdWithForge(id);

    if (!algorithm) throw AppError.notFound("Algorithm not found.");

    if (!algorithm.forge) {
      if (algorithm.isPublished) {
        console.error(
          `[Data Integrity] Published algorithm ${algorithm.id} missing forge data.`,
        );
      }
      return AlgorithmExecutionSchema.parse({
        status: "INCOMPLETE_ALGORITHM",
        message: "Algorithm has no visualization data",
      });
    }

    validateForgeSchemas(algorithm.forge);

    return AlgorithmExecutionSchema.parse({
      algorithmId: algorithm.id,
      name: algorithm.name,
      forge: {
        forgeCode: algorithm.forge.forgeCode,
        inputSchema: algorithm.forge.inputSchema,
        guardRanges: algorithm.forge.guardRanges,
        version: algorithm.forge.version,
      },
    });
  }

  async createAlgorithm(input: CreateAlgorithm): Promise<AlgorithmDetail> {
    const existing = await algorithmRepository.findBySlugExists(input.slug);
    if (existing) {
      throw AppError.badRequest("Algorithm with this slug already exists.");
    }

    // Schemas are already cross-validated by Zod superRefine in the package.
    // Run a secondary deep-parse to catch any internal schema inconsistencies.
    validateForgeSchemas(input.forge);

    const row = await algorithmRepository.create({
      slug: input.slug,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      difficulty: input.difficulty,
      isPublished: input.isPublished ?? false,
      timeBest: input.complexity.time.best,
      timeAverage: input.complexity.time.average,
      timeWorst: input.complexity.time.worst,
      spaceComplexity: input.complexity.space,
      displayCodes: input.displayCodes,
      forge: {
        forgeCode: input.forge.forgeCode as unknown as Prisma.InputJsonValue,
        inputSchema: input.forge.inputSchema as unknown as Prisma.InputJsonValue,
        guardRanges: input.forge.guardRanges as unknown as Prisma.InputJsonValue,
      },
      tags: input.tags,
    });

    return toAlgorithmDetail(row);
  }

  async updateAlgorithm(id: string, input: UpdateAlgorithm): Promise<AlgorithmDetail> {
    const existing = await algorithmRepository.findById(id);
    if (!existing) throw AppError.notFound("Algorithm not found.");

    if (input.forge) {
      // Merge update with existing forge data, then validate the combined result.
      const mergedForge = {
        forgeCode: input.forge.forgeCode ?? existing.forge?.forgeCode,
        guardRanges: input.forge.guardRanges ?? existing.forge?.guardRanges,
        inputSchema: input.forge.inputSchema ?? existing.forge?.inputSchema,
      };
      if (mergedForge.forgeCode && mergedForge.guardRanges && mergedForge.inputSchema) {
        validateForgeSchemas(mergedForge);
      }
    }

    const updateData: any = {};

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.categoryId !== undefined)
      updateData.category = { connect: { id: input.categoryId } };
    if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
    if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;

    if (input.complexity) {
      if (input.complexity.time?.best !== undefined)
        updateData.timeBest = input.complexity.time.best;
      if (input.complexity.time?.average !== undefined)
        updateData.timeAverage = input.complexity.time.average;
      if (input.complexity.time?.worst !== undefined)
        updateData.timeWorst = input.complexity.time.worst;
      if (input.complexity.space !== undefined)
        updateData.spaceComplexity = input.complexity.space;
    }

    if (input.forge) {
      updateData.forge = {
        upsert: {
          create: {
            forgeCode: (input.forge.forgeCode ??
              existing.forge?.forgeCode ??
              {}) as unknown as Prisma.InputJsonValue,
            inputSchema: (input.forge.inputSchema ??
              existing.forge?.inputSchema ??
              {}) as unknown as Prisma.InputJsonValue,
            guardRanges: (input.forge.guardRanges ??
              existing.forge?.guardRanges ??
              {}) as unknown as Prisma.InputJsonValue,
          },
          update: {
            ...(input.forge.forgeCode
              ? { forgeCode: input.forge.forgeCode as unknown as Prisma.InputJsonValue }
              : {}),
            ...(input.forge.inputSchema
              ? { inputSchema: input.forge.inputSchema as unknown as Prisma.InputJsonValue }
              : {}),
            ...(input.forge.guardRanges
              ? { guardRanges: input.forge.guardRanges as unknown as Prisma.InputJsonValue }
              : {}),
          },
        },
      };
    }

    const row = await algorithmRepository.update(id, {
      ...updateData,
      ...(input.displayCodes ? { displayCodes: input.displayCodes } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    });

    return toAlgorithmDetail(row);
  }

  async deleteAlgorithm(id: string): Promise<void> {
    const existing = await algorithmRepository.findById(id);
    if (!existing) throw AppError.notFound("Algorithm not found.");
    await algorithmRepository.delete(id);
  }
}

export const algorithmService = new AlgorithmService();