import { Router } from "express";
import { analysisController } from "../controllers/analysis.controller";
import { explanationSessionController } from "../controllers/explanation-session.controller";

const router = Router();

router.get("/analysis/:shareId", analysisController.getPublicAnalysis);
router.get("/explain/:shareId",  explanationSessionController.getPublic);

// Legacy wildcard MUST be last — it would otherwise intercept /explain/:shareId
router.get("/:shareId", analysisController.getPublicAnalysis);

export default router;