import type { FastifyInstance } from "fastify";
import type { AppLogger } from "./logging/logger";

/**
 * Implements a leaky bucket rate limiter.
 *
 * @param fastify - The Fastify instance.
 * @param key - The key to identify the bucket in Redis.
 * @param capacity - The maximum capacity of the bucket.
 * @param refillRate - The rate at which tokens are added to the bucket.
 * @param cost - The cost in tokens for each request.
 * @param logger - The logger instance.
 * @returns - A promise that resolves to a boolean indicating if the request is allowed.
 */
async function leakyBucket(
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

export default leakyBucket;
