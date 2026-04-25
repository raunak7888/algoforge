import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import type { AIGenerateRequest, AIGenerateResponse, AIProvider } from "./ai-provider";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;

  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
    },
  ) {
    if (!config.apiKey) {
      throw AppError.internal("Missing Gemini API key.");
    }

    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    try {
      const prompt = request.messages.map((message) => message.content).join("\n\n");
      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const text = response.text?.trim();

      if (!text) {
        throw AppError.badGateway("Empty response from AI provider.");
      }

      const message = {
        role: "assistant" as const,
        content: text,
      };

      return {
        model: this.config.model,
        message,
        history: [...request.messages, message],
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (!env.isProduction) {
        console.error("[AI][gemini]", error);
      }

      throw AppError.badGateway("AI provider request failed.");
    }
  }
}
