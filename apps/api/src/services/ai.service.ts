import {
  AnalysisResultSchema,
  type AnalysisLanguage,
  type AnalysisResult,
} from "@algoforge/analysis";
import { env } from "../config/env";
import { buildAnalysisPrompt } from "../prompts/analysis.prompt";
import { AppError } from "../utils/app-error";
import type { AIMessage, AIProvider } from "./providers/ai-provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { OpenRouterProvider } from "./providers/openrouter.provider";

type AnalyzeCodeInput = {
  code: string;
  language: AnalysisLanguage;
};

class AIService {
  constructor(private readonly provider: AIProvider) {}

  async analyzeCode(input: AnalyzeCodeInput): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(input);
    const messages: AIMessage[] = [
      {
        role: "user",
        content: prompt,
      },
    ];

    this.logInfo(`Using provider "${this.provider.name}" for analysis.`);

    try {
      const response = await this.withTimeout(
        this.provider.generate({ messages }),
        env.ai.timeoutMs,
      );
      const sanitizedResponse = sanitizeAiJson(response.message.content);
      const parsedResponse = JSON.parse(sanitizedResponse) as unknown;

      this.logInfo(
        `Provider "${this.provider.name}" succeeded with model "${response.model}".`,
      );

      return AnalysisResultSchema.parse(parsedResponse);
    } catch (error) {
      this.logError(`Provider "${this.provider.name}" failed.`, error);
      throw this.normalizeError(error);
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(AppError.badGateway("AI provider request timed out."));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof SyntaxError) {
      return AppError.badGateway("AI provider returned invalid JSON.");
    }

    if (
      error instanceof Error &&
      "issues" in error &&
      Array.isArray((error as { issues?: unknown[] }).issues)
    ) {
      return AppError.badGateway(
        "AI provider returned an invalid analysis payload.",
      );
    }

    return AppError.badGateway("AI analysis failed.");
  }

  private logInfo(message: string): void {
    if (!env.isProduction) {
      console.info(`[AI] ${message}`);
    }
  }

  private logError(message: string, error: unknown): void {
    if (!env.isProduction) {
      console.error(`[AI] ${message}`, error);
    }
  }
}

function sanitizeAiJson(value: string): string {
  const trimmed = value.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const startIndex = trimmed.indexOf("{");
  const endIndex = trimmed.lastIndexOf("}");

  if (startIndex >= 0 && endIndex > startIndex) {
    return trimmed.slice(startIndex, endIndex + 1).trim();
  }

  return trimmed;
}

function createProvider(): AIProvider {
  switch (env.ai.provider) {
    case "openrouter":
      return new OpenRouterProvider({
        apiKeys: env.openRouter.apiKeys,
        freeModels: env.openRouter.freeModels,
        baseUrl: env.openRouter.baseUrl,
        appName: env.openRouter.appName,
        siteUrl: env.openRouter.siteUrl,
      });
    case "gemini":
    default:
      return new GeminiProvider({
        apiKey: env.geminiApiKey,
        model: env.ai.model,
      });
  }
}

export const aiService = new AIService(createProvider());