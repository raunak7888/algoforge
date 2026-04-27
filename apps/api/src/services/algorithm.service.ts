import { prisma } from "@algoforge/db";
import {
  AlgorithmResponseSchema,
  type CreateAlgorithm,
  type UpdateAlgorithm,
  type AlgorithmResponse,
} from "@algoforge/forge";
import { AppError } from "../utils/app-error";

export type AlgorithmQuery = {
  categoryId?: string;
  difficulty?: string;
  isPublished?: boolean;
  search?: string;
};

function serializeAlgorithm(algorithm: {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  forgeCode: unknown;
  inputSchema: unknown;
  guardRanges: unknown;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  difficulty: string;
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AlgorithmResponse {
  return AlgorithmResponseSchema.parse({
    id: algorithm.id,
    slug: algorithm.slug,
    name: algorithm.name,
    description: algorithm.description,
    categoryId: algorithm.categoryId,
    forgeCode: algorithm.forgeCode,
    inputSchema: algorithm.inputSchema,
    guardRanges: algorithm.guardRanges,
    timeComplexity: algorithm.timeComplexity,
    spaceComplexity: algorithm.spaceComplexity,
    difficulty: algorithm.difficulty,
    tags: algorithm.tags,
    isPublished: algorithm.isPublished,
    createdAt: algorithm.createdAt.toISOString(),
    updatedAt: algorithm.updatedAt.toISOString(),
  });
}

class AlgorithmService {
  async listAlgorithms(query: AlgorithmQuery): Promise<AlgorithmResponse[]> {
    const where: any = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (typeof query.isPublished === "boolean") {
      where.isPublished = query.isPublished;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search } },
      ];
    }

    const algorithms = await prisma.algorithm.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return algorithms.map(serializeAlgorithm);
  }

  async getAlgorithmById(id: string): Promise<AlgorithmResponse> {
    const algorithm = await prisma.algorithm.findUnique({
      where: { id },
    });

    if (!algorithm) {
      throw AppError.notFound("Algorithm not found.");
    }

    return serializeAlgorithm(algorithm);
  }

  async getAlgorithmBySlug(slug: string): Promise<AlgorithmResponse> {
    const algorithm = await prisma.algorithm.findUnique({
      where: { slug },
    });

    if (!algorithm) {
      throw AppError.notFound("Algorithm not found.");
    }

    return serializeAlgorithm(algorithm);
  }

  async createAlgorithm(input: CreateAlgorithm): Promise<AlgorithmResponse> {
    const existing = await prisma.algorithm.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw AppError.badRequest("Algorithm with this slug already exists.");
    }

    const algorithm = await prisma.algorithm.create({
      data: input as any,
    });

    return serializeAlgorithm(algorithm);
  }

  async updateAlgorithm(
    id: string,
    input: UpdateAlgorithm
  ): Promise<AlgorithmResponse> {
    const algorithm = await prisma.algorithm.update({
      where: { id },
      data: input as any,
    });

    return serializeAlgorithm(algorithm);
  }

  async deleteAlgorithm(id: string): Promise<void> {
    await prisma.algorithm.delete({
      where: { id },
    });
  }
}

export const algorithmService = new AlgorithmService();
