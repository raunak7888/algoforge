import { Router } from "express";
import { Role } from "@algoforge/db";
import { algorithmController } from "../controllers/algorithm.controller";
import { requireAuth, requireRoles } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";
import { validateIdParam, validateSlugParam } from "../validation/algorithm";

const router = Router();

router.get("/", algorithmController.list);

// Unambiguous strong routes
router.get("/slug/:slug", validateSlugParam, algorithmController.getBySlug);
router.get("/id/:id", validateIdParam, algorithmController.getById);
router.get("/id/:id/visualize", validateIdParam, algorithmController.getVisualize);

// DEPRECATED fallback for backward compatibility
router.get("/:id", validateIdParam, (req, res, next) => {
    console.warn(`[DEPRECATED] Route GET /api/algorithms/${req.params.id} is deprecated. Use GET /api/algorithms/id/${req.params.id} instead.`);
    next();
}, algorithmController.getById);
router.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  algorithmController.create
);
router.patch(
  "/id/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  validateIdParam,
  algorithmController.update
);
router.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  validateIdParam,
  (req, res, next) => {
    console.warn(`[DEPRECATED] Route PATCH /api/algorithms/${req.params.id} is deprecated. Use PATCH /api/algorithms/id/${req.params.id} instead.`);
    next();
  },
  algorithmController.update
);
router.delete(
  "/id/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  validateIdParam,
  algorithmController.delete
);
router.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  validateIdParam,
  (req, res, next) => {
    console.warn(`[DEPRECATED] Route DELETE /api/algorithms/${req.params.id} is deprecated. Use DELETE /api/algorithms/id/${req.params.id} instead.`);
    next();
  },
  algorithmController.delete
);

export default router;