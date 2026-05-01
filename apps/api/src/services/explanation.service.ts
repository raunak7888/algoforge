/**
 * One-shot explanation endpoint (stateless).
 * For persistent chat sessions use ExplanationSessionService.
 */
import { aiService } from "./ai.service";
import { buildCodebaseContext, serializeContext } from "../ai/context-builder";
import { processQuery, type QueryScope } from "../ai/query-processor";
import { buildExplanationPrompt } from "../prompts/explanation.prompt";
import { formatExplanationResponse, type ExplanationResponse } from "../ai/response-formatter";
import { AppError } from "../utils/app-error";
import { layeredCache } from "./lib/Layered.cache";

const EXPLAIN_CACHE_PREFIX = "ai:explain:";

class ExplanationService {
  async explain(query: string): Promise<ExplanationResponse> {
    if (query.trim().length < 5) {
      throw AppError.badRequest("Query must be at least 5 characters.");
    }

    const cacheKey = EXPLAIN_CACHE_PREFIX + query.trim().toLowerCase();

    // Check layered cache (L1 LRU → L2 Redis)
    const cached = await layeredCache.get<ExplanationResponse>(cacheKey);
    if (cached) {
      return { ...cached, cachedAt: new Date().toISOString() };
    }

    // Full AI pipeline
    const scope       = processQuery(query);
    const context     = await buildCodebaseContext(scope.targetSlugs);
    const contextText = serializeContext(context);
    const prompt      = buildExplanationPrompt(contextText, scope);
    const raw         = await aiService.generateText([{ role: "user", content: prompt }]);

    const result = formatExplanationResponse(raw, scope, scope.targetRoutes);
    await layeredCache.set(cacheKey, result);

    return result;
  }
}

export const explanationService = new ExplanationService();