//# filename: apps/api/src/middleware/admin-secret.ts

import { NextFunction, Request, Response } from "express";
import { Role } from "@algoforge/db";
import { env } from "../config/env";
import { authService } from "../services/auth.service";
import { AppError } from "../utils/app-error";
import { getToken } from "./auth";

/**
 * Grants access if EITHER:
 *   1. X-Admin-Secret header matches ADMIN_UPGRADE_SECRET env var (non-empty).
 *   2. The request carries a valid JWT for an ADMIN user.
 *
 * Role is NEVER read from the request body. The secret must come from the
 * environment; a blank env var disables secret-based access entirely.
 */
export async function requireAdminAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Path 1 — env secret
    const headerSecret = req.get("X-Admin-Secret");
    if (
      headerSecret &&
      env.adminUpgradeSecret.length > 0 &&
      headerSecret === env.adminUpgradeSecret
    ) {
      req.adminViaSecret = true;
      return next();
    }

    // Path 2 — authenticated admin JWT
    const accessToken = getToken(req);
    if (!accessToken) {
      return next(AppError.unauthorized("Authentication required."));
    }

    const auth = await authService.authenticateAccessToken(accessToken);

    if (auth.user.role !== Role.ADMIN) {
      return next(AppError.forbidden("Insufficient permissions."));
    }

    req.auth = auth;
    next();
  } catch (error) {
    next(error);
  }
}