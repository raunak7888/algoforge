import { prisma } from "@algoforge/db";
import { AnalysisInput } from "../validation/analysis";

function generateAnalysisResult(code: string, language: string) {
  const lineCount = code.split("\n").length;

  const complexityMap: Record<string, string> = {
    python: lineCount > 20 ? "O(n^2)" : "O(n log n)",
    javascript: lineCount > 20 ? "O(n^2)" : "O(n)",
    typescript: lineCount > 20 ? "O(n^2)" : "O(n)",
    java: lineCount > 30 ? "O(n^3)" : "O(n log n)",
    cpp: lineCount > 30 ? "O(n^2)" : "O(log n)",
    go: "O(n)",
    rust: "O(log n)",
  };

  const suggestionMap: Record<string, string> = {
    python: "Use list comprehensions when it improves readability and avoids repeated passes.",
    javascript: "Prefer explicit comparisons and avoid implicit coercion in hot paths.",
    typescript: "Keep strict typing enabled and eliminate any in algorithm-critical code.",
    java: "Avoid repeated string concatenation in loops and prefer StringBuilder.",
    cpp: "Prefer STL containers and algorithms over raw arrays where possible.",
    go: "Avoid unnecessary allocations inside loops and keep goroutine fan-out bounded.",
    rust: "Favor iterator adapters for traversal-heavy logic and avoid redundant clones.",
  };

  return {
    complexity: complexityMap[language] ?? "O(n)",
    suggestion:
      suggestionMap[language] ??
      "Review data structure choice and reduce unnecessary passes over the data.",
    timeEstimate: `${Math.max(1, lineCount * 2)}ms`,
    lineCount,
  };
}

class AnalysisService {
  async createAnalysis(userId: string, input: AnalysisInput) {
    const analysisResult = generateAnalysisResult(input.code, input.language);

    const analysis = await prisma.analysis.create({
      data: {
        userId,
        code: input.code,
        language: input.language,
        complexity: analysisResult.complexity,
        suggestion: analysisResult.suggestion,
        timeEstimate: analysisResult.timeEstimate,
        result: {
          lineCount: analysisResult.lineCount,
          complexity: analysisResult.complexity,
          timeEstimate: analysisResult.timeEstimate,
          timestamp: new Date().toISOString(),
        },
      },
      select: {
        id: true,
        language: true,
        complexity: true,
        suggestion: true,
        timeEstimate: true,
        result: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return {
      id: analysis.id,
      language: analysis.language,
      complexity: analysis.complexity ?? "O(n)",
      suggestion: analysis.suggestion ?? "",
      timeEstimate: analysis.timeEstimate ?? "",
      result: analysis.result,
      createdAt: analysis.createdAt,
      user: analysis.user,
    };
  }

  async listUserAnalyses(userId: string) {
    const analyses = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        language: true,
        complexity: true,
        suggestion: true,
        timeEstimate: true,
        result: true,
        createdAt: true,
      },
    });

    return analyses.map((analysis) => ({
      id: analysis.id,
      language: analysis.language,
      complexity: analysis.complexity ?? "O(n)",
      suggestion: analysis.suggestion ?? "",
      timeEstimate: analysis.timeEstimate ?? "",
      result: analysis.result,
      createdAt: analysis.createdAt,
    }));
  }
}

export const analysisService = new AnalysisService();
