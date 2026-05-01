import { NextFunction, Request, Response } from "express";
import { getRedisClient } from "../config/redis";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip ?? "unknown";
}

/**
 * Atomic fixed-window counter via Lua script.
 * Guarantees INCR + EXPIRE happen as a single Redis operation.
 * Used for AI endpoint: N requests per hour per IP.
 */
const FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return current
`;

export function aiRateLimiter() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    const windowSeconds = 3600;
    const windowSlot = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `rl:ai:${ip}:${windowSlot}`;
    const limit = env.redis.aiRateLimitPerHour;

    try {
      const redis = getRedisClient();
      const count = await redis.eval(
        FIXED_WINDOW_SCRIPT,
        1,
        key,
        String(windowSeconds),
      ) as number;

      if (count > limit) {
        const ttl = await redis.ttl(key);
        next(
          AppError.tooManyRequests(
            `AI rate limit exceeded. Limit: ${limit}/hour. Retry in ${ttl}s.`,
          ),
        );
        return;
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      // Redis failure → fail open (do not block the request)
      next();
    }
  };
}

/**
 * Atomic sliding-window counter via Lua script.
 * Removes stale entries and checks count in a single atomic operation.
 * Used for general endpoints: N requests per minute per IP.
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local cutoff = now - windowMs
redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs)
return redis.call('ZCARD', key)
`;

export function generalRateLimiter() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    const windowMs = 60_000;
    const limit = env.redis.defaultRateLimitPerMinute;
    const key = `rl:general:${ip}`;
    const now = Date.now();
    // Unique member: timestamp + counter avoids member collisions under high concurrency
    const member = `${now}:${process.hrtime.bigint().toString()}`;

    try {
      const redis = getRedisClient();
      const count = await redis.eval(
        SLIDING_WINDOW_SCRIPT,
        1,
        key,
        String(now),
        String(windowMs),
        String(limit),
        member,
      ) as number;

      if (count > limit) {
        next(
          AppError.tooManyRequests(
            `Rate limit exceeded. Limit: ${limit} requests/minute.`,
          ),
        );
        return;
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      // Redis failure → fail open
      next();
    }
  };
}