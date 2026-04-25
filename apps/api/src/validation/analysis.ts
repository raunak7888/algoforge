import { CreateAnalysisInputSchema, type CreateAnalysisInput } from "@algoforge/analysis";
import { AppError } from "../utils/app-error";

export type AnalysisInput = CreateAnalysisInput;

export function parseAnalysisInput(value: unknown): AnalysisInput {
  const result = CreateAnalysisInputSchema.safeParse(value);

  if (!result.success) {
    throw AppError.badRequest(result.error.issues[0]?.message ?? "Invalid analysis request.");
  }

  return result.data;
}
