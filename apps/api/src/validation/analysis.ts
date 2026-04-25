import { AppError } from "../utils/app-error";

const SUPPORTED_LANGUAGES = new Set([
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
  "go",
  "rust",
]);

export type AnalysisInput = {
  code: string;
  language: string;
};

export function parseAnalysisInput(value: unknown): AnalysisInput {
  if (!value || typeof value !== "object") {
    throw AppError.badRequest("Request body must be a JSON object.");
  }

  const body = value as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const language =
    typeof body.language === "string" ? body.language.trim().toLowerCase() : "";

  if (!code) {
    throw AppError.badRequest("Code must be a non-empty string.");
  }

  if (code.length > 20000) {
    throw AppError.badRequest("Code payload is too large.");
  }

  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw AppError.badRequest("Unsupported language.");
  }

  return { code, language };
}
