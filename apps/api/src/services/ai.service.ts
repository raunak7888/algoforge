import {
  AnalysisResultSchema,
  type AnalysisLanguage,
  type AnalysisResult,
} from "@algoforge/analysis";
import { env } from "../config/env";
import { buildAnalysisPrompt } from "../prompts/analysis.prompt";
import { AppError } from "../utils/app-error";
import { getAIProvider } from "./providers/provider-factory";
import type { AIMessage } from "./providers/ai-provider";

type AnalyzeCodeInput = {
  code: string;
  language: AnalysisLanguage;
};

class AIService {
  async analyzeCode(input: AnalyzeCodeInput): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(input);
    const raw = await this.generate(
      [{ role: "user", content: prompt }],
      "json",
    );
    const sanitized = sanitizeJson(raw);

    try {
      const parsed = JSON.parse(sanitized) as unknown;
      return AnalysisResultSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw AppError.badGateway("AI provider returned invalid JSON.");
      }
      throw AppError.badGateway("AI provider returned an invalid analysis payload.");
    }
  }

  async generateText(messages: AIMessage[]): Promise<string> {
    return this.generate(messages, "text");
  }

  private async generate(
    messages: AIMessage[],
    responseFormat: "json" | "text",
  ): Promise<string> {
    const provider = getAIProvider();

    try {
      const response = await withTimeout(
        provider.generate({ messages, responseFormat }),
        env.ai.timeoutMs,
      );
      return response.message.content;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.badGateway("AI request failed.");
    }
  }
}

function sanitizeJson(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1).trim();

  return trimmed;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(AppError.badGateway("AI provider request timed out.")),
      ms,
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export const aiService = new AIService();