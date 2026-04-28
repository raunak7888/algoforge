import { prisma, Prisma, Difficulty } from "@algoforge/db";
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
import { AppError } from "../utils/app-error";

export type AlgorithmQuery = {
  categoryId?: string;
  difficulty?: string;
  isPublished?: boolean;
  search?: string;
};

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

    const algorithms = await prisma.algorithm.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        categoryId: true,
        difficulty: true,
        complexity: {
          select: {
            timeBest: true,
            timeAverage: true,
            timeWorst: true,
            space: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return algorithms.map((alg) => AlgorithmListItemSchema.parse(alg));
  }

  async getAlgorithmById(id: string): Promise<AlgorithmDetail> {
    const algorithm = await prisma.algorithm.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        difficulty: true,
        complexity: {
          select: {
            timeBest: true,
            timeAverage: true,
            timeWorst: true,
            space: true,
          },
        },
        displayCode: {
          select: {
            language: true,
            code: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                label: true,
              },
            },
          },
        },
      },
    });

    if (!algorithm) {
      throw AppError.notFound("Algorithm not found.");
    }

    return AlgorithmDetailSchema.parse({
      ...algorithm,
      tags: algorithm.tags.map((t) => t.tag),
    });
  }

  async getAlgorithmBySlug(slug: string): Promise<AlgorithmDetail> {
    const algorithm = await prisma.algorithm.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        difficulty: true,
        complexity: {
          select: {
            timeBest: true,
            timeAverage: true,
            timeWorst: true,
            space: true,
          },
        },
        displayCode: {
          select: {
            language: true,
            code: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                label: true,
              },
            },
          },
        },
      },
    });

    if (!algorithm) {
      throw AppError.notFound("Algorithm not found.");
    }

    return AlgorithmDetailSchema.parse({
      ...algorithm,
      tags: algorithm.tags.map((t) => t.tag),
    });
  }

  async getAlgorithmExecution(id: string): Promise<AlgorithmExecution> {
    const algorithm = await prisma.algorithm.findUnique({
      where: { id },
      include: {
        forge: true,
      },
    });

    if (!algorithm) {
      throw AppError.notFound("Algorithm not found.");
    }

    if (!algorithm.forge) {
      if (algorithm.isPublished) {
        console.error(
          `[Data Integrity Error] Published algorithm ${algorithm.id} is missing forge data.`,
        );
      }
      return AlgorithmExecutionSchema.parse({
        status: "INCOMPLETE_ALGORITHM",
        message: "Algorithm has no visualization data",
      });
    }

    try {
      ForgeCodeSchema.parse(algorithm.forge.forgeCode);
      GuardRangesSchema.parse(algorithm.forge.guardRanges);
      InputSchema.parse(algorithm.forge.inputSchema);
    } catch (error) {
      console.error(
        `[Data Integrity Error] Corrupted forge data for algorithm ${algorithm.id}:`,
        error instanceof Error ? error.message : "Unknown error",
      );
      throw AppError.internal("Invalid forge configuration stored in database");
    }

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
    const existing = await prisma.algorithm.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw AppError.badRequest("Algorithm with this slug already exists.");
    }

    try {
      ForgeCodeSchema.parse(input.forge.forgeCode);
      GuardRangesSchema.parse(input.forge.guardRanges);
      InputSchema.parse(input.forge.inputSchema);
    } catch (error: unknown) {
      throw AppError.badRequest(
        "Invalid forge configuration: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }

    const createdAlgorithm = await prisma.$transaction(async (tx) => {
      return tx.algorithm.create({
        data: {
          slug: input.slug,
          name: input.name,
          description: input.description,
          categoryId: input.categoryId,
          difficulty: input.difficulty,
          isPublished: input.isPublished ?? false,
          complexity: {
            create: {
              timeBest: input.complexity.time.best,
              timeAverage: input.complexity.time.average,
              timeWorst: input.complexity.time.worst,
              space: input.complexity.space,
            },
          },
          displayCode: {
            create: {
              language: input.displayCode.language,
              code: input.displayCode.code,
            },
          },
          forge: {
            create: {
              forgeCode:
                input.forge.forgeCode as unknown as Prisma.InputJsonValue,
              inputSchema:
                input.forge.inputSchema as unknown as Prisma.InputJsonValue,
              guardRanges:
                input.forge.guardRanges as unknown as Prisma.InputJsonValue,
            },
          },
          tags: {
            create: input.tags.map((tagLabel) => ({
              tag: {
                connectOrCreate: {
                  where: { label: tagLabel },
                  create: { label: tagLabel },
                },
              },
            })),
          },
        },
        include: {
          complexity: true,
          displayCode: true,
          forge: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return AlgorithmDetailSchema.parse({
      id: createdAlgorithm.id,
      slug: createdAlgorithm.slug,
      name: createdAlgorithm.name,
      description: createdAlgorithm.description,
      difficulty: createdAlgorithm.difficulty,
      complexity: createdAlgorithm.complexity
        ? {
            timeBest: createdAlgorithm.complexity.timeBest,
            timeAverage: createdAlgorithm.complexity.timeAverage,
            timeWorst: createdAlgorithm.complexity.timeWorst,
            space: createdAlgorithm.complexity.space,
          }
        : null,
      displayCode: createdAlgorithm.displayCode
        ? {
            language: createdAlgorithm.displayCode.language,
            code: createdAlgorithm.displayCode.code,
          }
        : null,
      tags: createdAlgorithm.tags.map((t) => t.tag),
    });
  }

  async updateAlgorithm(
    id: string,
    input: UpdateAlgorithm,
  ): Promise<AlgorithmDetail> {
    const existing = await prisma.algorithm.findUnique({
      where: { id },
      include: {
        complexity: true,
        displayCode: true,
        forge: true,
        tags: true,
      },
    });

    if (!existing) {
      throw AppError.notFound("Algorithm not found.");
    }

    if (input.forge) {
      try {
        if (input.forge.forgeCode) ForgeCodeSchema.parse(input.forge.forgeCode);
        if (input.forge.guardRanges)
          GuardRangesSchema.parse(input.forge.guardRanges);
        if (input.forge.inputSchema)
          InputSchema.parse(input.forge.inputSchema);
      } catch (error: unknown) {
        throw AppError.badRequest(
          "Invalid forge configuration: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
      }
    }

    const updatedAlgorithm = await prisma.$transaction(async (tx) => {
      const data: Prisma.AlgorithmUpdateInput = {};

      if (input.slug !== undefined) data.slug = input.slug;
      if (input.name !== undefined) data.name = input.name;
      if (input.description !== undefined) data.description = input.description;
      if (input.categoryId !== undefined)
        data.category = { connect: { id: input.categoryId } };
      if (input.difficulty !== undefined) data.difficulty = input.difficulty;
      if (input.isPublished !== undefined) data.isPublished = input.isPublished;

      if (input.complexity) {
        data.complexity = {
          upsert: {
            create: {
              timeBest:
                input.complexity.time?.best ??
                existing.complexity?.timeBest ??
                null,
              timeAverage:
                input.complexity.time?.average ??
                existing.complexity?.timeAverage ??
                null,
              timeWorst:
                input.complexity.time?.worst ??
                existing.complexity?.timeWorst ??
                null,
              space:
                input.complexity.space ?? existing.complexity?.space ?? null,
            },
            update: {
              ...(input.complexity.time?.best !== undefined
                ? { timeBest: input.complexity.time.best }
                : {}),
              ...(input.complexity.time?.average !== undefined
                ? { timeAverage: input.complexity.time.average }
                : {}),
              ...(input.complexity.time?.worst !== undefined
                ? { timeWorst: input.complexity.time.worst }
                : {}),
              ...(input.complexity.space !== undefined
                ? { space: input.complexity.space }
                : {}),
            },
          },
        };
      }

      if (input.displayCode) {
        data.displayCode = {
          upsert: {
            create: {
              language:
                input.displayCode.language ??
                existing.displayCode?.language ??
                "js",
              code:
                input.displayCode.code ?? existing.displayCode?.code ?? "",
            },
            update: {
              ...(input.displayCode.language !== undefined
                ? { language: input.displayCode.language }
                : {}),
              ...(input.displayCode.code !== undefined
                ? { code: input.displayCode.code }
                : {}),
            },
          },
        };
      }

      if (input.forge) {
        data.forge = {
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
                ? {
                    forgeCode:
                      input.forge.forgeCode as unknown as Prisma.InputJsonValue,
                  }
                : {}),
              ...(input.forge.inputSchema
                ? {
                    inputSchema:
                      input.forge.inputSchema as unknown as Prisma.InputJsonValue,
                  }
                : {}),
              ...(input.forge.guardRanges
                ? {
                    guardRanges:
                      input.forge.guardRanges as unknown as Prisma.InputJsonValue,
                  }
                : {}),
            },
          },
        };
      }

      if (input.tags) {
        data.tags = {
          deleteMany: {},
          create: input.tags.map((tagLabel) => ({
            tag: {
              connectOrCreate: {
                where: { label: tagLabel },
                create: { label: tagLabel },
              },
            },
          })),
        };
      }

      return tx.algorithm.update({
        where: { id },
        data,
        include: {
          complexity: true,
          displayCode: true,
          forge: true,
          tags: {
            include: { tag: true },
          },
        },
      });
    });

    return AlgorithmDetailSchema.parse({
      id: updatedAlgorithm.id,
      slug: updatedAlgorithm.slug,
      name: updatedAlgorithm.name,
      description: updatedAlgorithm.description,
      difficulty: updatedAlgorithm.difficulty,
      complexity: updatedAlgorithm.complexity
        ? {
            timeBest: updatedAlgorithm.complexity.timeBest,
            timeAverage: updatedAlgorithm.complexity.timeAverage,
            timeWorst: updatedAlgorithm.complexity.timeWorst,
            space: updatedAlgorithm.complexity.space,
          }
        : null,
      displayCode: updatedAlgorithm.displayCode
        ? {
            language: updatedAlgorithm.displayCode.language,
            code: updatedAlgorithm.displayCode.code,
          }
        : null,
      tags: updatedAlgorithm.tags.map((t) => t.tag),
      forge: updatedAlgorithm.forge
        ? {
            forgeCode: updatedAlgorithm.forge.forgeCode,
            inputSchema: updatedAlgorithm.forge.inputSchema,
            guardRanges: updatedAlgorithm.forge.guardRanges,
            version: updatedAlgorithm.forge.version,
          }
        : null,
    });
  }

  async deleteAlgorithm(id: string): Promise<void> {
    const existing = await prisma.algorithm.findUnique({ where: { id } });

    if (!existing) {
      throw AppError.notFound("Algorithm not found.");
    }

    await prisma.algorithm.delete({ where: { id } });
  }
}

export const algorithmService = new AlgorithmService();