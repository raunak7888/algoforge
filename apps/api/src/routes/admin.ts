//# filename: apps/api/src/routes/admin.ts

import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAdminAccess } from "../middleware/admin-secret";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

// All admin management routes require admin access (JWT admin OR env secret).
// CSRF is also required to protect against cross-site requests.
// Role is never accepted from any request body — it is hardcoded per endpoint.

router.get("/users", requireAdminAccess, adminController.listUsers);

router.post(
  "/upgrade-user",
  requireAdminAccess,
  requireCsrf,
  adminController.upgradeUser,
);

router.post(
  "/downgrade-user",
  requireAdminAccess,
  requireCsrf,
  adminController.downgradeUser,
);

export default router;