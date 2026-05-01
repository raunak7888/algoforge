import { Router } from "express";
import { analysisController } from "../controllers/analysis.controller";
import { explanationSessionController } from "../controllers/explanation-session.controller";

const router = Router();

// Public analysis share
router.get("/analysis/:shareId", analysisController.getPublicAnalysis);

// Legacy route kept for backward compatibility
router.get("/:shareId", analysisController.getPublicAnalysis);

// Public explanation session share
router.get("/explain/:shareId", explanationSessionController.getPublic);

export default router;