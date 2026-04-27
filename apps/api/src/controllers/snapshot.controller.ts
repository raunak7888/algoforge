import { Request, Response } from "express";
import { snapshotService } from "../services/snapshot.service";
import { asyncHandler } from "../utils/async-handler";
import { ensureString } from "../validation/common";
import { parseCreateSnapshot } from "../validation/snapshot";

class SnapshotController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const input = parseCreateSnapshot(req.body);
    const snapshot = await snapshotService.createSnapshot(input);
    res.status(201).json(snapshot);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params.id, "Snapshot ID is required.");
    const snapshot = await snapshotService.getSnapshotById(id);
    res.json(snapshot);
  });

  listByAlgorithm = asyncHandler(async (req: Request, res: Response) => {
    const algorithmId = ensureString(
      req.params.algorithmId,
      "Algorithm ID is required."
    );
    const snapshots = await snapshotService.listSnapshotsByAlgorithm(
      algorithmId
    );
    res.json(snapshots);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params.id, "Snapshot ID is required.");
    await snapshotService.deleteSnapshot(id);
    res.status(204).send();
  });
}

export const snapshotController = new SnapshotController();