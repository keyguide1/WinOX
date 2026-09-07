import { createClient, type RedisClientType } from "redis";
import { logger } from "@/lib/logger";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

export const rateLimitPolicies = {
  login: { limit: 5, windowMs: 60_000 },
  signup: { limit: 5, windowMs: 60_000 },
  passwordReset: { limit: 3, windowMs: 60_000 },
  tournamentJoin: { limit: 30, windowMs: 60_000 },
  matchmaking: { limit: 30, windowMs: 60_000 },
  resultSubmission: { limit: 30, windowMs: 60_000 },
  disputes: { limit: 10, windowMs: 60_000 },
  financial: { limit: 10, windowMs: 60_000 },
  webhook: { limit: 120, windowMs: 60_000 },
  admin: { limit: 60, windowMs: 60_000 },
} satisfies Record<string, RateLimitPolicy>;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export interface RateLimitStore {
  consume(key: string, policy: RateLimitPolicy, now?: number): Promise<RateLimitResult>;
}

type Bucket = { count: number; resetAt: number };

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  async consume(key: string, policy: RateLimitPolicy, now = Date.now()): Promise<RateLimitResult> {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      const next = { count: 1, resetAt: now + policy.windowMs };
      this.buckets.set(key, next);
      return { allowed: true, remaining: policy.limit - 1, resetAt: next.resetAt };
    }

    current.count += 1;
    return {
      allowed: current.count <= policy.limit,
      remaining: Math.max(0, policy.limit - current.count),
      resetAt: current.resetAt,
    };
  }
}

const incrementScript = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
return { count, ttl }
`;

type RedisClient = RedisClientType;

export class RedisRateLimitStore implements RateLimitStore {
  private readonly client: RedisClient;
  private connection?: Promise<RedisClient>;

  constructor(redisUrl: string) {
    this.client = createClient({ url: redisUrl });
    this.client.on("error", (error) => {
      logger.error("Rate limit Redis client error", { event: "rate_limit_redis_error", message: error.message });
    });
  }

  private async connectedClient() {
    if (!this.connection) {
      this.connection = this.client.connect().then(() => this.client);
    }
    return this.connection;
  }

  async consume(key: string, policy: RateLimitPolicy, now = Date.now()): Promise<RateLimitResult> {
    const client = await this.connectedClient();
    const [count, ttl] = (await client.sendCommand([
      "EVAL",
      incrementScript,
      "1",
      `winox:rate-limit:${key}`,
      String(policy.windowMs),
    ])) as [number, number];
    const resetAt = now + Math.max(0, ttl);
    return {
      allowed: count <= policy.limit,
      remaining: Math.max(0, policy.limit - count),
      resetAt,
    };
  }
}

const fallbackStore = new InMemoryRateLimitStore();
const redisStore = process.env.REDIS_URL ? new RedisRateLimitStore(process.env.REDIS_URL) : undefined;

export async function checkRateLimit(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): Promise<RateLimitResult> {
  if (!redisStore) {
    if (process.env.NODE_ENV === "production") {
      logger.error("Distributed rate limiting is not configured", { event: "rate_limit_configuration_error" });
      return { allowed: false, remaining: 0, resetAt: now + policy.windowMs };
    }
    return fallbackStore.consume(key, policy, now);
  }

  try {
    return await redisStore.consume(key, policy, now);
  } catch (error) {
    logger.error("Distributed rate limiting failed closed", {
      event: "rate_limit_store_error",
      message: error instanceof Error ? error.message : "Unknown Redis error",
    });
    return { allowed: false, remaining: 0, resetAt: now + policy.windowMs };
  }
}
