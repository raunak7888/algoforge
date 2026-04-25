import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { Role } from "@algoforge/db";
import { env } from "../config/env";
import { AppError } from "./app-error";

type BaseTokenPayload = {
  sub: string;
  sessionId: string;
};

export type AccessTokenPayload = BaseTokenPayload & {
  role: Role;
  type: "access";
};

export type RefreshTokenPayload = BaseTokenPayload & {
  type: "refresh";
};

function verifyToken<T extends JwtPayload>(token: string, secret: string): T {
  const payload = jwt.verify(token, secret, {
    issuer: env.authIssuer,
    audience: env.authAudience,
  });

  if (typeof payload === "string") {
    throw AppError.unauthorized("Invalid token payload.");
  }

  return payload as T;
}

function buildSignOptions(expiresIn: SignOptions["expiresIn"]): SignOptions {
  return {
    expiresIn,
    issuer: env.authIssuer,
    audience: env.authAudience,
  };
}

export function signAccessToken(payload: BaseTokenPayload & { role: Role }): string {
  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    env.jwtAccessSecret,
    buildSignOptions(`${env.accessTokenTtlMinutes}m`),
  );
}

export function signRefreshToken(payload: BaseTokenPayload): string {
  return jwt.sign(
    {
      ...payload,
      type: "refresh",
    },
    env.jwtRefreshSecret,
    buildSignOptions(`${env.refreshTokenTtlDays}d`),
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = verifyToken<AccessTokenPayload>(token, env.jwtAccessSecret);

  if (payload.type !== "access" || !payload.sub || !payload.sessionId) {
    throw AppError.unauthorized("Invalid access token.");
  }

  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = verifyToken<RefreshTokenPayload>(token, env.jwtRefreshSecret);

  if (payload.type !== "refresh" || !payload.sub || !payload.sessionId) {
    throw AppError.unauthorized("Invalid refresh token.");
  }

  return payload;
}
