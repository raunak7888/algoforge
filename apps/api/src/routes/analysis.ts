import { Router } from "express";
import { analysisController } from "../controllers/analysis.controller";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

router.get("/", requireAuth, analysisController.listAnalyses);
router.post("/", requireAuth, requireCsrf, analysisController.createAnalysis);

export default router;
