import {
  AnalysisHistoryItemSchema,
  AnalysisRecordSchema,
  type AnalysisHistoryResponse,
  type CreateAnalysisInput,
} from "@algoforge/analysis";
import { prisma } from "@algoforge/db";
import { aiService } from "./ai.service";
import {
  decodeAnalysisCursor,
  encodeAnalysisCursor,
  type AnalysisHistoryQuery,
} from "../validation/analysis";
import { AppError } from "../utils/app-error";
import { env } from "../config/env";

function serializeAnalysisRecord(analysis: {
  id: string;
  language: string;
  result: unknown;
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
  complexity: string | null;
  suggestion: string | null;
  createdAt: Date;
}) {
  return AnalysisHistoryItemSchema.parse({
    id: analysis.id,
    language: analysis.language,
    complexity: analysis.complexity,
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
        timeEstimate: analysisResult.complexity.time.average,
        result: analysisResult,
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
                  createdAt: new Date(cursor.createdAt),
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
        nextCursor: hasMore && lastItem
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

    const record = analysis as any;
    if (record.shareId && record.isPublic) {
      return { shareUrl: `${env.webAppUrl}/share/${record.shareId}` };
    }

    const { nanoid } = await import("nanoid");
    const shareId = nanoid(10);

    await (prisma.analysis.update as any)({
      where: { id: analysisId },
      data: {
        shareId,
        isPublic: true,
      },
    });

    return { shareUrl: `${env.webAppUrl}/share/${shareId}` };
  }

  async getPublicAnalysis(shareId: string) {
    const analysis = await (prisma.analysis.findUnique as any)({
      where: { shareId } as any,
      select: {
        code: true,
        language: true,
        result: true,
        createdAt: true,
        isPublic: true,
      },
    });

    if (!analysis) {
      throw AppError.notFound("Analysis not found.");
    }

    if (!(analysis as any).isPublic) {
      throw AppError.forbidden("This analysis is not public.");
    }

    return {
      code: analysis.code,
      language: analysis.language,
      result: analysis.result,
      createdAt: analysis.createdAt.toISOString(),
    };
  }
}

export const analysisService = new AnalysisService();
