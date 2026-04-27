import { Request, Response } from "express";
import { algorithmService } from "../services/algorithm.service";
import { asyncHandler } from "../utils/async-handler";
import { ensureString } from "../validation/common";
import {
    parseCreateAlgorithm,
    parseUpdateAlgorithm,
    parseAlgorithmQuery,
} from "../validation/algorithm";

class AlgorithmController {
    list = asyncHandler(async (req: Request, res: Response) => {
        const query = parseAlgorithmQuery(req.query);
        const algorithms = await algorithmService.listAlgorithms(query);
        res.json(algorithms);
    });

    getById = asyncHandler(async (req: Request, res: Response) => {
        const id = ensureString(req.params.id, "Algorithm ID is required.");
        const algorithm = await algorithmService.getAlgorithmById(id);
        res.json(algorithm);
    });

    getBySlug = asyncHandler(async (req: Request, res: Response) => {
        const slug = ensureString(
            req.params.slug,
            "Algorithm slug is required.",
        );
        const algorithm = await algorithmService.getAlgorithmBySlug(slug);
        res.json(algorithm);
    });

    getVisualize = asyncHandler(async (req: Request, res: Response) => {
        const id = ensureString(req.params.id, "Algorithm ID is required.");
        const execution = await algorithmService.getAlgorithmExecution(id);
        res.json(execution);
    });

    create = asyncHandler(async (req: Request, res: Response) => {
        const input = parseCreateAlgorithm(req.body);
        const createdAlgorithm = await algorithmService.createAlgorithm(input);
        res.status(201).json(createdAlgorithm);
    });

    update = asyncHandler(async (req: Request, res: Response) => {
        const id = ensureString(req.params.id, "Algorithm ID is required.");
        const input = parseUpdateAlgorithm(req.body);
        const updatedAlgorithm = await algorithmService.updateAlgorithm(id, input);
        res.status(200).json(updatedAlgorithm);
    });

    delete = asyncHandler(async (req: Request, res: Response) => {
        const id = ensureString(req.params.id, "Algorithm ID is required.");
        await algorithmService.deleteAlgorithm(id);
        res.status(204).send();
    });
}

export const algorithmController = new AlgorithmController();
