/**
 * Backward-compatible cache wrapper used by analysis and explanation services.
 * Internally delegates to the layered (LRU + Redis) cache.
 * Keys are SHA-256 hashed so arbitrarily long inputs (e.g. source code) stay
 * within Redis key-length limits.
 */
import { createHash } from "crypto";
import { layeredCache } from "./lib/Layered.cache";
import { env } from "../config/env";

export type CacheNamespace = "ai" | "viz" | "algo";

function buildKey(namespace: CacheNamespace, raw: string): string {
  const hashed = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `${namespace}:${hashed}`;
}

export const cacheService = {
  async get<T>(namespace: CacheNamespace, input: string): Promise<T | null> {
    return layeredCache.get<T>(buildKey(namespace, input));
  },

  async set(
    namespace: CacheNamespace,
    input: string,
    value: unknown,
    ttlSeconds = env.redis.ttlSeconds,
  ): Promise<void> {
    await layeredCache.set(buildKey(namespace, input), value, ttlSeconds);
  },

  async del(namespace: CacheNamespace, input: string): Promise<void> {
    await layeredCache.del(buildKey(namespace, input));
  },
};