//# filename: apps/api/src/controllers/admin.controller.ts

import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { asyncHandler } from "../utils/async-handler";
import { AppError } from "../utils/app-error";

class AdminController {
  /**
   * POST /api/admin/upgrade-user
   * Body: { userId: string }
   * Role is always hardcoded server-side. Never read from body.
   */
  upgradeUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body as { userId?: unknown };
    if (typeof userId !== "string" || !userId.trim()) {
      throw AppError.badRequest("userId is required.");
    }
    const result = await adminService.upgradeToAdmin(userId.trim());
    res.json({
      changed: result.changed,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
    });
  });

  /**
   * POST /api/admin/downgrade-user
   * Body: { userId: string }
   */
  downgradeUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body as { userId?: unknown };
    if (typeof userId !== "string" || !userId.trim()) {
      throw AppError.badRequest("userId is required.");
    }
    const result = await adminService.downgradeToUser(userId.trim());
    res.json({
      changed: result.changed,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
    });
  });

  listUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await adminService.listAllUsers();
    res.json({ users });
  });
}

export const adminController = new AdminController();