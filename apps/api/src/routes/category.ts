import { Router } from "express";
import { Role } from "@algoforge/db";
import { categoryController } from "../controllers/category.controller";
import { requireAuth, requireRoles } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

router.get("/", categoryController.list);
router.get("/:id", categoryController.getById);
router.post(
  "/",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  categoryController.create,
);
router.patch(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  categoryController.update,
);
router.delete(
  "/:id",
  requireAuth,
  requireRoles(Role.ADMIN),
  requireCsrf,
  categoryController.delete,
);

export default router;