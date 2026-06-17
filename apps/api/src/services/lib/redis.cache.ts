/**
 * L2 — Redis cache.
 *
 * Shared across all API instances and survives process restarts.
 * All errors are swallowed so a Redis outage never breaks a request.
 */
import { getRedisClient } from "../../config/redis";

export const redisCache = {
  async get(key: string): Promise<string | null> {
    try {
      return await getRedisClient().get(key);
    } catch {
      return null; // Redis down → treat as miss
    }
  },

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await getRedisClient().set(key, value, "EX", ttlSeconds);
    } catch {
      // Non-fatal: the request still succeeds without caching
    }
  },

  async del(key: string): Promise<void> {
    try {
      await getRedisClient().del(key);
    } catch {
      // Non-fatal
    }
  },

  /**
   * Returns the remaining TTL in seconds.
   *   >= 1  — seconds remaining
   *   -1    — key exists but has no expiry
   *   -2    — key does not exist
   */
  async getTtl(key: string): Promise<number> {
    try {
      return await getRedisClient().ttl(key);
    } catch {
      return -1; // Treat as no-expiry on error; L1 will use its own default
    }
  },
};