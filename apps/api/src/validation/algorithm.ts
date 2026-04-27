import {
  CreateAlgorithmSchema,
  UpdateAlgorithmSchema,
  type CreateAlgorithm,
  type UpdateAlgorithm,
} from "@algoforge/forge";
import { AppError } from "../utils/app-error";
import type { AlgorithmQuery } from "../services/algorithm.service";

export function parseCreateAlgorithm(value: unknown): CreateAlgorithm {
  const result = CreateAlgorithmSchema.safeParse(value);

  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid algorithm data."
    );
  }

  return result.data;
}

export function parseUpdateAlgorithm(value: unknown): UpdateAlgorithm {
  const result = UpdateAlgorithmSchema.safeParse(value);

  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid algorithm data."
    );
  }

  return result.data;
}

export function parseAlgorithmQuery(value: unknown): AlgorithmQuery {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const query = value as Record<string, unknown>;

  return {
    categoryId:
      typeof query.categoryId === "string" ? query.categoryId : undefined,
    difficulty:
      typeof query.difficulty === "string" ? query.difficulty : undefined,
    isPublished:
      query.isPublished === "true"
        ? true
        : query.isPublished === "false"
          ? false
          : undefined,
    search: typeof query.search === "string" ? query.search : undefined,
  };
}