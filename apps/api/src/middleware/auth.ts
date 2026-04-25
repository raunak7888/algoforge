import { NextFunction, Request, Response } from "express";
import { Role } from "@algoforge/db";
import { authCookies } from "../config/env";
import { authService } from "../services/auth.service";
import { AppError } from "../utils/app-error";
import { getCookie } from "../utils/cookies";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accessToken = getCookie(req, authCookies.accessToken);

    if (!accessToken) {
      return next(AppError.unauthorized("Authentication required."));
    }

    req.auth = await authService.authenticateAccessToken(accessToken);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      return next(AppError.unauthorized("Authentication required."));
    }

    if (!roles.includes(req.auth.user.role)) {
      return next(AppError.forbidden("Insufficient permissions."));
    }

    next();
  };
}
