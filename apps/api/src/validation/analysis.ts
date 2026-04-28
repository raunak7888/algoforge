import {
  CreateAnalysisInputSchema,
  type CreateAnalysisInput,
} from "@algoforge/analysis";
import { AppError } from "../utils/app-error";

export type AnalysisInput = CreateAnalysisInput;

export type AnalysisHistoryQuery = {
  cursor: string | null;
  limit: number;
};

export type AnalysisCursor = {
  createdAt: string;
  id: string;
};

const DEFAULT_ANALYSIS_PAGE_SIZE = 10;
const MAX_ANALYSIS_PAGE_SIZE = 50;

export function parseAnalysisInput(value: unknown): AnalysisInput {
  const result = CreateAnalysisInputSchema.safeParse(value);

  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid analysis request.",
    );
  }

  return result.data;
}

export function parseAnalysisHistoryQuery(
  value: unknown,
): AnalysisHistoryQuery {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      cursor: null,
      limit: DEFAULT_ANALYSIS_PAGE_SIZE,
    };
  }

  const query = value as Record<string, unknown>;
  const cursorValue = query.cursor;
  const limitValue = query.limit;

  if (Array.isArray(cursorValue) || Array.isArray(limitValue)) {
    throw AppError.badRequest("Invalid analysis history query.");
  }

  let cursor: string | null = null;
  if (typeof cursorValue !== "undefined") {
    if (typeof cursorValue !== "string" || !cursorValue.trim()) {
      throw AppError.badRequest("Cursor must be a non-empty string.");
    }
    cursor = cursorValue.trim();
  }

  const rawLimit =
    typeof limitValue === "undefined"
      ? DEFAULT_ANALYSIS_PAGE_SIZE
      : Number(limitValue);

  if (!Number.isInteger(rawLimit)) {
    throw AppError.badRequest("Limit must be an integer.");
  }

  if (rawLimit < 1) {
    throw AppError.badRequest("Limit must be at least 1.");
  }

  if (rawLimit > MAX_ANALYSIS_PAGE_SIZE) {
    throw AppError.badRequest(`Limit cannot exceed ${MAX_ANALYSIS_PAGE_SIZE}.`);
  }

  return {
    cursor,
    limit: rawLimit,
  };
}

export function encodeAnalysisCursor(cursor: AnalysisCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeAnalysisCursor(cursor: string): AnalysisCursor {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const value = JSON.parse(decoded) as Partial<AnalysisCursor>;

    if (
      typeof value.createdAt !== "string" ||
      Number.isNaN(Date.parse(value.createdAt)) ||
      typeof value.id !== "string" ||
      !value.id.trim()
    ) {
      throw new Error("Malformed cursor.");
    }

    return {
      createdAt: value.createdAt,
      id: value.id.trim(),
    };
  } catch {
    throw AppError.badRequest("Invalid cursor.");
  }
}