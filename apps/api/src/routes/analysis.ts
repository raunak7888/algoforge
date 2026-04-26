import { Router } from "express";
import { analysisController } from "../controllers/analysis.controller";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

router.get("/", requireAuth, analysisController.listAnalyses);
router.get("/:id", requireAuth, analysisController.getAnalysisById);
router.post("/", requireAuth, requireCsrf, analysisController.createAnalysis);
router.post("/:id/share", requireAuth, requireCsrf, analysisController.shareAnalysis);

export default router;
