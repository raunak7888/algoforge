import { Request, Response, NextFunction } from "express";
import {
  CreateAlgorithmSchema,
  UpdateAlgorithmSchema,
  type CreateAlgorithm,
  type UpdateAlgorithm,
} from "@algoforge/forge";
import { AppError } from "../utils/app-error";
import type { AlgorithmQuery } from "../types/algorithm.types";

export function parseCreateAlgorithm(value: unknown): CreateAlgorithm {
  const result = CreateAlgorithmSchema.safeParse(value);
  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid algorithm data.",
    );
  }
  return result.data;
}

export function parseUpdateAlgorithm(value: unknown): UpdateAlgorithm {
  const result = UpdateAlgorithmSchema.safeParse(value);
  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid algorithm data.",
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

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CUID_REGEX = /^c[a-z0-9]{24}$/;
const SLUG_REGEX = /^[a-z0-9-]+$/;

export function validateIdParam(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const id = req.params.id;

  if (!id || (!UUID_REGEX.test(id) && !CUID_REGEX.test(id))) {
    return next(
      AppError.badRequest(
        "Invalid algorithm ID format. Expected UUID or cuid.",
      ),
    );
  }

  next();
}

export function validateSlugParam(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const slug = req.params.slug;

  if (!slug || !SLUG_REGEX.test(slug)) {
    return next(
      AppError.badRequest(
        "Invalid slug format. Expected kebab-case string.",
      ),
    );
  }

  next();
}