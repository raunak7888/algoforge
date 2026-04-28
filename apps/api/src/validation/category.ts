import {
  CreateCategorySchema,
  UpdateCategorySchema,
  type CreateCategory,
  type UpdateCategory,
} from "@algoforge/forge";
import { AppError } from "../utils/app-error";

export function parseCreateCategory(value: unknown): CreateCategory {
  const result = CreateCategorySchema.safeParse(value);
  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid category data.",
    );
  }
  return result.data;
}

export function parseUpdateCategory(value: unknown): UpdateCategory {
  const result = UpdateCategorySchema.safeParse(value);
  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid category data.",
    );
  }
  return result.data;
}