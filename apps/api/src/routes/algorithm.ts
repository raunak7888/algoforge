import { Router } from "express";
import { Role } from "@algoforge/db";
import { algorithmController } from "../controllers/algorithm.controller";
import { requireAuth, requireRoles } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { validateIdParam, validateSlugParam } from "../validation/algorithm";

const router = Router();

router.get("/", algorithmController.list);
router.get("/slug/:slug", validateSlugParam, algorithmController.getBySlug);
router.get("/id/:id/visualize", validateIdParam, algorithmController.getVisualize);
router.get("/id/:id", validateIdParam, algorithmController.getById);

router.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  algorithmController.create,
);

router.patch(
  "/id/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  validateIdParam,
  algorithmController.update,
);

router.delete(
  "/id/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  validateIdParam,
  algorithmController.delete,
);

export default router;