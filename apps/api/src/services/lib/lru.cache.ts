/**
 * L1 — In-process LRU cache.
 *
 * Fast, zero-latency reads. Bounded to 1 000 entries so it never grows
 * unboundedly. Each entry carries its own TTL (set at write time).
 * When the cache is full the least-recently-used entry is evicted first.
 */
import { LRUCache } from "lru-cache";
import { env } from "../../config/env";

const DEFAULT_TTL_MS = env.redis.ttlSeconds * 1000;

// Store serialised JSON strings to keep the in-memory footprint predictable
const store = new LRUCache<string, string>({
  max: 1_000,
  ttl: DEFAULT_TTL_MS,
  allowStale: false,
});

export const lruCache = {
  get(key: string): string | null {
    return store.get(key) ?? null;
  },

  set(key: string, value: string, ttlMs = DEFAULT_TTL_MS): void {
    store.set(key, value, { ttl: ttlMs });
  },

  del(key: string): void {
    store.delete(key);
  },
};