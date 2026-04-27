import { Request, Response, NextFunction } from "express";
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
    console.log(result)
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

export function validateIdParam(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    // UUID format or cuid format (both typically alphanumeric with hyphens)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const cuidRegex = /^c[a-z0-9]{24}$/;
    
    if (!id || (!uuidRegex.test(id) && !cuidRegex.test(id))) {
        return next(AppError.badRequest("Invalid algorithm ID format. Expected UUID or cuid."));
    }
    next();
}

export function validateSlugParam(req: Request, res: Response, next: NextFunction) {
    const slug = req.params.slug;
    // Kebab case string
    const slugRegex = /^[a-z0-9-]+$/;
    
    if (!slug || !slugRegex.test(slug)) {
        return next(AppError.badRequest("Invalid slug format. Expected kebab-case string."));
    }
    next();
}
