import { Router } from "express";
import { snapshotController } from "../controllers/snapshot.controller";
import { requireAuth } from "../middleware/auth";
import { requireCsrf } from "../middleware/csrf";

const router = Router();

router.post("/", requireAuth, requireCsrf, snapshotController.create);
router.get("/:id", snapshotController.getById);
router.get("/algorithm/:algorithmId", snapshotController.listByAlgorithm);
router.delete("/:id", requireAuth, requireCsrf, snapshotController.delete);

export default router;