"use client";

import {
  AnalysisHistoryResponseSchema,
  CreateAnalysisInputSchema,
  AnalysisRecordSchema,
  type AnalysisHistoryResponse,
  type CreateAnalysisInput,
  type AnalysisRecord,
} from "@algoforge/analysis";
import { apiFetch } from "./api";

const DEFAULT_PAGE_LIMIT = 10;

export class AnalysisApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function parseError(response: Response): Promise<never> {
  let message = "Request failed.";

  try {
    const payload = (await response.json()) as { error?: string };
    if (payload.error) {
      message = payload.error;
    }
  } catch {
    // Ignore JSON parsing issues and fall back to the default message.
  }

  throw new AnalysisApiError(message, response.status);
}

export async function fetchAnalysesPage(cursor: string | null): Promise<AnalysisHistoryResponse> {
  const params = new URLSearchParams({
    limit: String(DEFAULT_PAGE_LIMIT),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await apiFetch(`/api/analyses?${params.toString()}`);

  if (!response.ok) {
    return parseError(response);
  }

  return AnalysisHistoryResponseSchema.parse(await response.json());
}

export async function fetchAnalysisById(analysisId: string): Promise<AnalysisRecord> {
  const response = await apiFetch(`/api/analyses/${analysisId}`);

  if (!response.ok) {
    return parseError(response);
  }

  return AnalysisRecordSchema.parse(await response.json());
}

export async function createAnalysis(input: CreateAnalysisInput): Promise<AnalysisRecord> {
  const payload = CreateAnalysisInputSchema.parse(input);
  const response = await apiFetch("/api/analysis", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return parseError(response);
  }

  return AnalysisRecordSchema.parse(await response.json());
}

export async function shareAnalysis(analysisId: string): Promise<{ shareUrl: string }> {
  const response = await apiFetch(`/api/analysis/${analysisId}/share`, {
    method: "POST",
  });

  if (!response.ok) {
    return parseError(response);
  }

  return response.json() as Promise<{ shareUrl: string }>;
}

export async function fetchPublicAnalysis(shareId: string): Promise<any> {
  const response = await apiFetch(`/api/share/${shareId}`);

  if (!response.ok) {
    return parseError(response);
  }

  return response.json();
}

