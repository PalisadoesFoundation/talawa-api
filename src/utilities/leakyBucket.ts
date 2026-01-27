import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { AppLogger } from "./logging/logger";

// --- New Sliding Window Implementation (for REST) ---

export type LeakyBucketResult = {
	allowed: boolean;
	remaining: number;
	resetAt: number; // ms epoch
};

type RedisZ = {
	zremrangebyscore(
		key: string,
		min: string | number,
		max: string | number,
	): Promise<number>;
	zcard(key: string): Promise<number>;
	zadd(key: string, score: number, member: string): Promise<number>;
	zrange(
		key: string,
		start: number,
		stop: number,
		withScores?: "WITHSCORES",
	): Promise<string[]>;
	expire(key: string, seconds: number): Promise<number>;
};

/**
 * Implements a leaky bucket rate limiter using Redis ZSETs (sliding window).
 *
 * @param redis - The Redis client interface.
 * @param key - The key to identify the bucket in Redis.
 * @param max - The maximum number of requests allowed in the window.
 * @param windowMs - The time window in milliseconds.
 * @param logger - Optional logger instance.
 * @returns - A promise that resolves to the rate limit result.
 */
export async function leakyBucket(
	redis: RedisZ,
	key: string,
	max: number,
	windowMs: number,
	logger?: FastifyBaseLogger,
): Promise<LeakyBucketResult> {
	const now = Date.now();
	const cutoff = now - windowMs;

	try {
		await redis.zremrangebyscore(key, "-inf", cutoff);
		const count = await redis.zcard(key);

		if (count >= max) {
			const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
			const firstScore = oldest.length >= 2 ? Number(oldest[1]) : now;
			const resetAt = firstScore + windowMs;
			return { allowed: false, remaining: 0, resetAt };
		}

		// allow and record
		await redis.zadd(key, now, `${now}-${Math.random()}`);
		await redis.expire(key, Math.ceil(windowMs / 1000));
		const remaining = Math.max(0, max - (count + 1));
		const earliest = await redis.zrange(key, 0, 0, "WITHSCORES");
		const firstScore = earliest.length >= 2 ? Number(earliest[1]) : now;
		const resetAt = firstScore + windowMs;

		return { allowed: true, remaining, resetAt };
	} catch (err) {
		logger?.warn({ msg: "leakyBucket failure; allowing request", key, err });
		// Degrade open if Redis unavailable
		return { allowed: true, remaining: max, resetAt: now + windowMs };
	}
}

// --- Old Token Bucket Implementation (for GraphQL) ---

/**
 * Implements a leaky bucket rate limiter (Token Bucket algorithm).
 *
 * @param fastify - The Fastify instance.
 * @param key - The key to identify the bucket in Redis.
 * @param capacity - The maximum capacity of the bucket.
 * @param refillRate - The rate at which tokens are added to the bucket.
 * @param cost - The cost in tokens for each request.
 * @param logger - The logger instance.
 * @returns - A promise that resolves to a boolean indicating if the request is allowed.
 */
export async function complexityLeakyBucket(
	fastify: FastifyInstance,
	key: string,
	capacity: number,
	refillRate: number,
	cost: number,
	logger: AppLogger,
): Promise<boolean> {
	const redis = fastify.redis;
	const bucket = await redis.hgetall(key);
	let tokens: number;
	let lastUpdate: number;

	if (!bucket || Object.keys(bucket).length === 0) {
		// If bucket doesn't exist, initialize it
		tokens = capacity;
		lastUpdate = Date.now();

		// Store the initialized bucket in Redis
		await redis.hset(key, {
			tokens: tokens.toString(),
			lastUpdate: lastUpdate.toString(),
		});
	} else {
		// Parse existing bucket data
		tokens = bucket.tokens ? Number.parseInt(bucket.tokens, 10) : capacity;
		lastUpdate = bucket.lastUpdate
			? Number.parseInt(bucket.lastUpdate, 10)
			: Date.now();
	}
	logger.debug({ tokens, lastUpdate }, "Leaky bucket state");
	const now = Date.now();
	const elapsed = (now - lastUpdate) / 1000;
	// Refill tokens based on elapsed time and refill rate
	tokens = Math.min(capacity, tokens + elapsed * refillRate);

	// Check if user has enough tokens for this request
	if (tokens < cost) {
		return false; // Not enough tokens → reject request
	}

	tokens -= cost; // Deduct query cost

	// Update Redis with new token count and timestamp
	await redis.hset(key, {
		tokens: tokens.toString(),
		lastUpdate: now.toString(),
	});

	return true; // Request allowed
}

// Default export can point to one of them, or neither.
// Since existing code used default export for the complexity bucket,
// but we want to encourage the new one, I will export complexityLeakyBucket as default ONLY if I don't change imports.
// But I plan to change imports. So I will not export default to force explicit usage and avoid confusion.
