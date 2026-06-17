import { Request, Response } from "express";
import { explanationService } from "../services/explanation.service";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";

class ExplanationController {
  explain = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.body as { query?: unknown };
    if (typeof query !== "string" || !query.trim()) {
      throw AppError.badRequest("Field 'query' is required and must be a non-empty string.");
    }
    const result = await explanationService.explain(query.trim());
    res.json(result);
  });
}

export const explanationController = new ExplanationController();