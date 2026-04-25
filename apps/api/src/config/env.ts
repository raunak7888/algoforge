import dotenv from "dotenv";

// 1. Initialize dotenv at the top-level
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  // Fixed logic: ensures it is an integer and greater than 0
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer.`);
  }

  return parsed;
}

const port = parseInteger("PORT", 4000);
const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const apiBaseUrl = process.env.API_BASE_URL ?? `http://localhost:${port}`;

export const env = {
  nodeEnv,
  isProduction,
  port,
  apiBaseUrl,
  webAppUrl: process.env.WEB_APP_URL ?? "http://localhost:3000",
  cookieDomain: process.env.COOKIE_DOMAIN,
  googleClientId: requireEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
  accessTokenTtlMinutes: parseInteger("ACCESS_TOKEN_TTL_MINUTES", 15),
  refreshTokenTtlDays: parseInteger("REFRESH_TOKEN_TTL_DAYS", 30),
  authIssuer: process.env.AUTH_ISSUER ?? "algoforge-api",
  authAudience: process.env.AUTH_AUDIENCE ?? "algoforge-web",
};

export const authCookies = {
  accessToken: "af_access",
  refreshToken: "af_refresh",
  csrfToken: "af_csrf",
  oauthState: "af_oauth_state",
} as const;

export const googleOAuthConfig = {
  redirectUri: `${apiBaseUrl}/api/auth/google/callback`,
  scopes: ["openid", "email", "profile"],
};