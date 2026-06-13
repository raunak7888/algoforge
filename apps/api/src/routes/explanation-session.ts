import { Router } from "express";
import { explanationSessionController } from "../controllers/explanation-session.controller";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { aiRateLimiter } from "../middleware/rate-limit";

const router = Router();

router.get(  "/",             requireAuth,                              explanationSessionController.list);
router.post( "/",             requireAuth, requireCsrf,                 explanationSessionController.create);
router.get(  "/:id",          requireAuth,                              explanationSessionController.getById);
router.delete("/:id",         requireAuth, requireCsrf,                 explanationSessionController.delete);
router.post( "/:id/messages", requireAuth, requireCsrf, aiRateLimiter("session"), explanationSessionController.sendMessage);
router.post( "/:id/share",    requireAuth, requireCsrf,                 explanationSessionController.share);

export default router;