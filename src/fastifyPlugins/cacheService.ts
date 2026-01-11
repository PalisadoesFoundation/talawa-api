import fastifyPlugin from "fastify-plugin";
import type { CacheService } from "~/src/services/caching";
import { RedisCacheService } from "~/src/services/caching";

declare module "fastify" {
	interface FastifyInstance {
		/**
		 * Redis-backed cache service for caching entities and query results.
		 */
		cache: CacheService;
	}
}

/**
 * Fastify plugin that registers a Redis-backed CacheService on the FastifyInstance.
 * Uses the Redis client already registered by @fastify/redis.
 *
 * @example
 * ```typescript
 * // In a resolver
 * const org = await ctx.cache.get(`talawa:v1:organization:${id}`);
 * ```
 */
export const cacheService = fastifyPlugin(
	async (fastify) => {
		// Acquire Redis client from @fastify/redis plugin
		const redis = fastify.redis;

		if (!redis) {
			fastify.log.warn(
				"Redis instance not found; cache will noop via pass-through adapter.",
			);
			// Create a noop cache service for graceful degradation
			const noopCache: CacheService = {
				get: async () => null,
				set: async () => {},
				del: async () => {},
				clearByPattern: async () => {},
				mget: async (keys) => keys.map(() => null),
				mset: async () => {},
			};
			fastify.decorate("cache", noopCache);
			return;
		}

		const cache = new RedisCacheService(redis as never, fastify.log);
		fastify.decorate("cache", cache);

		fastify.log.info({ msg: "CacheService registered" });
	},
	{
		name: "cacheService",
		// Depend on the Redis plugin explicitly to make load order resilient.
		// Still guard against a missing client to allow graceful degradation in tests
		// or partial startup scenarios.
		dependencies: ["@fastify/redis"],
	},
);

export default cacheService;
