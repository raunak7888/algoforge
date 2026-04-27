import {
  CreateSnapshotSchema,
  type CreateSnapshot,
} from "@algoforge/forge";
import { AppError } from "../utils/app-error";

export function parseCreateSnapshot(value: unknown): CreateSnapshot {
  const result = CreateSnapshotSchema.safeParse(value);

  if (!result.success) {
    throw AppError.badRequest(
      result.error.issues[0]?.message ?? "Invalid snapshot data."
    );
  }

  return result.data;
}