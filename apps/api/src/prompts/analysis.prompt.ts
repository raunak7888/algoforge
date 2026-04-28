import type { AnalysisLanguage } from "@algoforge/analysis";

const LANGUAGE_LABELS: Record<AnalysisLanguage, string> = {
  javascript: "JavaScript",
  python: "Python",
};

export function buildAnalysisPrompt(input: {
  code: string;
  language: AnalysisLanguage;
}): string {
  const languageLabel = LANGUAGE_LABELS[input.language];

  return `
You are a strict JSON generator.

Return ONLY valid JSON. No markdown, no explanation, no extra text.

Schema:
{
  "summary": string,
  "complexity": {
    "time": { "best": string, "average": string, "worst": string },
    "space": string
  },
  "breakdown": {
    "approach": string,
    "steps": string[]
  },
  "bottlenecks": [
    { "issue": string, "impact": string, "location": string }
  ],
  "antiPatterns": string[],
  "improvements": [
    { "suggestion": string, "expectedImpact": string }
  ],
  "optimizedCode": string,
  "comparison": {
    "originalVsOptimized": string,
    "improvementSummary": string
  },
  "edgeCases": string[],
  "readabilityScore": number,
  "tags": string[]
}

Rules:
- All fields required
- Use [] if empty
- Keep optimizedCode in ${languageLabel}
- No extra keys

Code:
${input.code}
`;
}