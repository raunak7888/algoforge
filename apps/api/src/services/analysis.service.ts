//# filename: apps/api/src/services/analysis.service.ts

import {
  AnalysisHistoryItemSchema,
  AnalysisRecordSchema,
  SharedAnalysisSchema,
  type AnalysisHistoryResponse,
  type CreateAnalysisInput,
} from "@algoforge/analysis";
import { Prisma } from "@algoforge/db";
import { aiService } from "./ai.service";
import { analysisRepository } from "../repositories/analysis.repository";
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

class AnalysisService {
  async createAnalysis(userId: string, input: CreateAnalysisInput) {
    const analysisResult = await aiService.analyzeCode(input);

    const row = await analysisRepository.create({
      userId,
      code: input.code,
      language: input.language,
      complexity: analysisResult.complexity.time.worst,
      suggestion: analysisResult.improvements[0]?.suggestion ?? null,
      result: analysisResult as unknown as Prisma.InputJsonValue,
    });

    return AnalysisRecordSchema.parse({
      id: row.id,
      language: row.language,
      result: row.result,
      createdAt: row.createdAt.toISOString(),
    });
  }

  async listUserAnalyses(
    userId: string,
    query: AnalysisHistoryQuery,
  ): Promise<AnalysisHistoryResponse> {
    const cursor = query.cursor ? decodeAnalysisCursor(query.cursor) : null;
    const take = query.limit + 1;

    const rows = await analysisRepository.findManyByUser(userId, {
      cursorCreatedAt: cursor ? new Date(cursor.createdAt) : undefined,
      cursorId: cursor?.id,
      take,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const lastItem = page.at(-1);

    return {
      data: page.map((r) =>
        AnalysisHistoryItemSchema.parse({
          id: r.id,
          language: r.language,
          complexity: extractComplexityString(r.complexity as Prisma.JsonValue | null),
          suggestion: r.suggestion,
          createdAt: r.createdAt.toISOString(),
        }),
      ),
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
    const row = await analysisRepository.findOneByUser(userId, analysisId);
    if (!row) throw AppError.notFound("Analysis not found.");

    return AnalysisRecordSchema.parse({
      id: row.id,
      language: row.language,
      result: row.result,
      createdAt: row.createdAt.toISOString(),
    });
  }

  async shareAnalysis(userId: string, analysisId: string) {
    const analysis = await analysisRepository.findForShare(analysisId, userId);
    if (!analysis) throw AppError.notFound("Analysis not found.");

    if (analysis.shareId && analysis.isPublic) {
      return { shareUrl: `${env.webAppUrl}/share/${analysis.shareId}` };
    }

    const { nanoid } = await import("nanoid");
    const shareId = nanoid(10);
    await analysisRepository.setPublic(analysisId, shareId);

    return { shareUrl: `${env.webAppUrl}/share/${shareId}` };
  }

  async getPublicAnalysis(shareId: string) {
    const analysis = await analysisRepository.findPublicByShareId(shareId);
    if (!analysis) throw AppError.notFound("Analysis not found or not public.");

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