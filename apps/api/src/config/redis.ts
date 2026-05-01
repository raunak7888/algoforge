import Redis from "ioredis";
import { env } from "./env";

let _client: Redis | null = null;
let _healthy = false;

export function getRedisClient(): Redis {
  if (!_client) {
    _client = new Redis(env.redis.url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
    });

    _client.on("ready", () => {
      _healthy = true;
      if (!env.isProduction) console.info("[Redis] Ready.");
    });

    _client.on("error", (err: Error) => {
      _healthy = false;
      if (!env.isProduction) console.error("[Redis] Error:", err.message);
    });

    _client.on("close", () => {
      _healthy = false;
    });
  }

  return _client;
}

export function isRedisHealthy(): boolean {
  return _healthy;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.connect();
  } catch (err) {
    // ioredis throws if already connected — suppress that
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("already")) {
      throw err;
    }
  }
}

export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
    _healthy = false;
  }
}