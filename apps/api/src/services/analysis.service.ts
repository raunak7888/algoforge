import {
  AnalysisHistoryItemSchema,
  AnalysisRecordSchema,
  SharedAnalysisSchema,
  type AnalysisHistoryResponse,
  type CreateAnalysisInput,
} from "@algoforge/analysis";
import { prisma, Prisma } from "@algoforge/db";
import { aiService } from "./ai.service";
import {
  decodeAnalysisCursor,
  encodeAnalysisCursor,
  type AnalysisHistoryQuery,
} from "../validation/analysis";
import { AppError } from "../utils/app-error";
import { env } from "../config/env";

function extractComplexityString(value: Prisma.JsonValue | null): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const time = obj["time"];
    if (time !== null && typeof time === "object" && !Array.isArray(time)) {
      const worst = (time as Record<string, unknown>)["worst"];
      if (typeof worst === "string") return worst;
    }
  }
  return null;
}

function serializeAnalysisRecord(analysis: {
  id: string;
  language: string;
  result: Prisma.JsonValue;
  createdAt: Date;
}) {
  return AnalysisRecordSchema.parse({
    id: analysis.id,
    language: analysis.language,
    result: analysis.result,
    createdAt: analysis.createdAt.toISOString(),
  });
}

function serializeHistoryItem(analysis: {
  id: string;
  language: string;
  complexity: Prisma.JsonValue | null;
  suggestion: string | null;
  createdAt: Date;
}) {
  return AnalysisHistoryItemSchema.parse({
    id: analysis.id,
    language: analysis.language,
    complexity: extractComplexityString(analysis.complexity),
    suggestion: analysis.suggestion,
    createdAt: analysis.createdAt.toISOString(),
  });
}

class AnalysisService {
  async createAnalysis(userId: string, input: CreateAnalysisInput) {
    const analysisResult = await aiService.analyzeCode(input);

    const analysis = await prisma.analysis.create({
      data: {
        userId,
        code: input.code,
        language: input.language,
        complexity: analysisResult.complexity.time.worst,
        suggestion: analysisResult.improvements[0]?.suggestion ?? null,
        result: analysisResult as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        language: true,
        result: true,
        createdAt: true,
      },
    });

    return serializeAnalysisRecord(analysis);
  }

  async listUserAnalyses(
    userId: string,
    query: AnalysisHistoryQuery,
  ): Promise<AnalysisHistoryResponse> {
    const cursor = query.cursor ? decodeAnalysisCursor(query.cursor) : null;
    const take = query.limit + 1;

    const analyses = await prisma.analysis.findMany({
      where: {
        userId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                {
                  createdAt: { equals: new Date(cursor.createdAt) },
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: {
        id: true,
        language: true,
        complexity: true,
        suggestion: true,
        createdAt: true,
      },
    });

    const hasMore = analyses.length > query.limit;
    const page = hasMore ? analyses.slice(0, query.limit) : analyses;
    const lastItem = page.at(-1);

    return {
      data: page.map(serializeHistoryItem),
      meta: {
        nextCursor:
          hasMore && lastItem
            ? encodeAnalysisCursor({
                createdAt: lastItem.createdAt.toISOString(),
                id: lastItem.id,
              })
            : null,
        hasMore,
      },
    };
  }

  async getUserAnalysisById(userId: string, analysisId: string) {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
      select: {
        id: true,
        language: true,
        result: true,
        createdAt: true,
      },
    });

    if (!analysis) {
      throw AppError.notFound("Analysis not found.");
    }

    return serializeAnalysisRecord(analysis);
  }

  async shareAnalysis(userId: string, analysisId: string) {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
    });

    if (!analysis) {
      throw AppError.notFound("Analysis not found.");
    }

    if (analysis.shareId && analysis.isPublic) {
      return { shareUrl: `${env.webAppUrl}/share/${analysis.shareId}` };
    }

    const { nanoid } = await import("nanoid");
    const shareId = nanoid(10);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        shareId,
        isPublic: true,
      },
    });

    return { shareUrl: `${env.webAppUrl}/share/${shareId}` };
  }

  async getPublicAnalysis(shareId: string) {
    const analysis = await prisma.analysis.findUnique({
      where: { shareId, isPublic: true },
      select: {
        id: true,
        code: true,
        language: true,
        result: true,
        createdAt: true,
        isPublic: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (!analysis) {
      throw AppError.notFound("Analysis not found or not public.");
    }

    return SharedAnalysisSchema.parse({
      id: analysis.id,
      code: analysis.code,
      language: analysis.language,
      result: analysis.result,
      createdAt: analysis.createdAt.toISOString(),
      creator: analysis.user
        ? {
            id: analysis.user.id,
            name: analysis.user.name,
            username: analysis.user.username ?? analysis.user.name,
            avatarUrl: analysis.user.image,
          }
        : undefined,
    });
  }
}

export const analysisService = new AnalysisService();