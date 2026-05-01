import { env } from "../../config/env";
import type { AIProvider } from "./ai-provider";
import { GeminiProvider } from "./gemini.provider";
import { OpenRouterProvider } from "./openrouter.provider";

let _instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!_instance) {
    _instance = build();
  }
  return _instance;
}

function build(): AIProvider {
  switch (env.ai.provider) {
    case "openrouter":
      if (!env.openRouter.apiKeys.length) {
        throw new Error("OPENROUTER_API_KEYS must be set when AI_PROVIDER=openrouter.");
      }
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