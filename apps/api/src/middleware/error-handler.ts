import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../utils/app-error";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
    res.status(401).json({
      error: "Authentication failed.",
      code: "AUTH_INVALID",
    });
    return;
  }

  console.error("[Unhandled Error]", error);
  res.status(500).json({
    error: "Internal server error.",
    code: "INTERNAL_ERROR",
  });
}