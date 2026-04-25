import { NextFunction, Request, Response } from "express";
import { authCookies } from "../config/env";
import { AppError } from "../utils/app-error";
import { getCookie } from "../utils/cookies";

export function requireCsrf(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const csrfCookie = getCookie(req, authCookies.csrfToken);
  const csrfHeader = req.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(AppError.forbidden("CSRF validation failed."));
  }

  next();
}
