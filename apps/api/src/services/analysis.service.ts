import { AnalysisRecordSchema, type CreateAnalysisInput } from "@algoforge/analysis";
import { prisma } from "@algoforge/db";
import { aiService } from "./ai.service";

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

    return AnalysisRecordSchema.parse({
      id: analysis.id,
      language: analysis.language,
      result: analysis.result,
      createdAt: analysis.createdAt.toISOString(),
    });
  }

  async listUserAnalyses(userId: string) {
    const analyses = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        language: true,
        result: true,
        createdAt: true,
      },
    });

    return analyses.map((analysis) =>
      AnalysisRecordSchema.parse({
        id: analysis.id,
        language: analysis.language,
        result: analysis.result,
        createdAt: analysis.createdAt.toISOString(),
      }),
    );
  }
}

export const analysisService = new AnalysisService();
