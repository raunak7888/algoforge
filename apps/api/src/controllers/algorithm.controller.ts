import { Request, Response } from "express";
import { algorithmService } from "../services/algorithm/index";
import { asyncHandler } from "../utils/async-handler";
import { ensureString } from "../validation/common";
import {
  parseCreateAlgorithm,
  parseUpdateAlgorithm,
  parseAlgorithmQuery,
} from "../validation/algorithm";

class AlgorithmController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const query      = parseAlgorithmQuery(req.query);
    const algorithms = await algorithmService.listAlgorithms(query);
    res.json(algorithms);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id        = ensureString(req.params.id, "Algorithm ID is required.");
    const lang      = typeof req.query.lang === "string" ? req.query.lang : undefined;
    const algorithm = await algorithmService.getAlgorithmById(id, lang);
    res.json(algorithm);
  });

  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const slug      = ensureString(req.params.slug, "Algorithm slug is required.");
    const lang      = typeof req.query.lang === "string" ? req.query.lang : undefined;
    const algorithm = await algorithmService.getAlgorithmBySlug(slug, lang);
    res.json(algorithm);
  });

  getVisualize = asyncHandler(async (req: Request, res: Response) => {
    const id        = ensureString(req.params.id, "Algorithm ID is required.");
    const execution = await algorithmService.getAlgorithmExecution(id);
    res.json(execution);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const input   = parseCreateAlgorithm(req.body);
    const created = await algorithmService.createAlgorithm(input);
    res.status(201).json(created);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id      = ensureString(req.params.id, "Algorithm ID is required.");
    const input   = parseUpdateAlgorithm(req.body);
    const updated = await algorithmService.updateAlgorithm(id, input);
    res.status(200).json(updated);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params.id, "Algorithm ID is required.");
    await algorithmService.deleteAlgorithm(id);
    res.status(204).send();
  });
}

export const algorithmController = new AlgorithmController();