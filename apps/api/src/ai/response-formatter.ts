import type { QueryScope } from "./query-processor";

export type ExplanationResponse = {
  query: string;
  intent: string;
  explanation: string;
  relevantFiles: string[];
  relevantRoutes: string[];
  cachedAt?: string;
};

export function formatExplanationResponse(
  rawExplanation: string,
  scope: QueryScope,
  relevantRoutes: string[],
  fromCache = false,
): ExplanationResponse {
  return {
    query: scope.rawQuery,
    intent: scope.intent,
    explanation: rawExplanation.trim(),
    relevantFiles: scope.targetSlugs.map((s) => `algorithms/${s}`),
    relevantRoutes,
    ...(fromCache ? { cachedAt: new Date().toISOString() } : {}),
  };
}