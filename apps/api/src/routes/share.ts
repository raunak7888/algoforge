import { Router } from "express";
import { analysisController } from "../controllers/analysis.controller";

const router = Router();

router.get("/:shareId", analysisController.getPublicAnalysis);

export default router;