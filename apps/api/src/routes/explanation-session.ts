import { Router } from "express";
import { explanationSessionController } from "../controllers/explanation-session.controller";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { aiRateLimiter } from "../middleware/rate-limit";

const router = Router();

// ── Authenticated session CRUD ────────────────────────────────────────────────

router.get(  "/",           requireAuth,                         explanationSessionController.list);
router.post( "/",           requireAuth, requireCsrf,            explanationSessionController.create);
router.get(  "/:id",        requireAuth,                         explanationSessionController.getById);
router.delete("/:id",       requireAuth, requireCsrf,            explanationSessionController.delete);

// Sending a message triggers AI — apply the AI rate limiter
router.post( "/:id/messages", requireAuth, requireCsrf, aiRateLimiter(), explanationSessionController.sendMessage);

// Share (makes session public, returns a share URL)
router.post( "/:id/share",  requireAuth, requireCsrf,            explanationSessionController.share);

export default router;