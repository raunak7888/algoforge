import { Request, Response } from "express";
import { analysisService } from "../services/analysis.service";
import { asyncHandler } from "../utils/async-handler";
import { parseAnalysisInput } from "../validation/analysis";

class AnalysisController {
  createAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const input = parseAnalysisInput(req.body);
    const analysis = await analysisService.createAnalysis(req.auth!.user.id, input);

    res.status(201).json(analysis);
  });

  listAnalyses = asyncHandler(async (req: Request, res: Response) => {
    const analyses = await analysisService.listUserAnalyses(req.auth!.user.id);
    res.json({ analyses });
  });
}

export const analysisController = new AnalysisController();
