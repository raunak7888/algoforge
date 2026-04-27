import { Router } from "express";
// import { Role } from "@algoforge/db";
import { authController } from "../controllers/auth.controller";
import { requireAuth, requireRoles } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

router.get("/google/start", authController.startGoogleAuth);
router.get("/google/callback", authController.handleGoogleCallback);
router.get("/me", authController.getMe);
router.get("/session", requireAuth, authController.getSession);
router.post("/refresh", requireCsrf, authController.refreshSession);
router.post("/logout", requireCsrf, authController.logout);
router.post("/logout-all", requireAuth, requireCsrf, authController.logoutAll);
// router.get("/admin/users", requireAuth, requireRoles(Role.ADMIN), authController.listUsers);

export default router;
