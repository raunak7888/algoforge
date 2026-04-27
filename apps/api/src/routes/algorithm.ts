import { Router } from "express";
import { Role } from "@algoforge/db";
import { algorithmController } from "../controllers/algorithm.controller";
import { requireAuth, requireRoles } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

router.get("/", algorithmController.list);
router.get("/:id", algorithmController.getById);
router.get("/slug/:slug", algorithmController.getBySlug);
router.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  algorithmController.create
);
router.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  algorithmController.update
);
router.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  algorithmController.delete
);

export default router;