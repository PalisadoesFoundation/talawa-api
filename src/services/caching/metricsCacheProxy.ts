import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import type { CacheService } from "./CacheService";

/**
 * Creates a cache service proxy that wraps an existing cache service
 * with request-scoped performance tracking.
 *
 * This allows the global cache service (without perf tracking) to be
 * instrumented per-request by wrapping it with a performance tracker
 * from the request context.
 *
 * @param cache - The underlying cache service to wrap
 * @param perf - The performance tracker for this request
 * @returns A proxied cache service that tracks performance metrics
 *
 * @example
 * ```typescript
 * // In GraphQL context creation
 * const cache = metricsCacheProxy(fastify.cache, request.perf);
 * ```
 */
export function metricsCacheProxy(
	cache: CacheService,
	perf: PerformanceTracker,
): CacheService {
	return {
		async get<T>(key: string): Promise<T | null> {
			const end = perf.start("cache:get");
			try {
				const result = await cache.get<T>(key);
				if (result !== null) {
					perf.trackCacheHit();
				} else {
					perf.trackCacheMiss();
				}
				return result;
			} finally {
				end();
			}
		},

		async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
			return perf.time("cache:set", async () =>
				cache.set(key, value, ttlSeconds),
			);
		},

		async del(keys: string | string[]): Promise<void> {
			return perf.time("cache:del", async () => cache.del(keys));
		},

		async clearByPattern(pattern: string): Promise<void> {
			return perf.time("cache:clearByPattern", async () =>
				cache.clearByPattern(pattern),
			);
		},

		async mget<T>(keys: string[]): Promise<(T | null)[]> {
			const end = perf.start("cache:mget");
			try {
				const results = await cache.mget<T>(keys);
				// Track individual hits/misses
				for (const result of results) {
					if (result !== null) {
						perf.trackCacheHit();
					} else {
						perf.trackCacheMiss();
					}
				}
				return results;
			} finally {
				end();
			}
		},

		async mset<T>(
			entries: Array<{ key: string; value: T; ttlSeconds: number }>,
		): Promise<void> {
			return perf.time("cache:mset", async () => cache.mset(entries));
		},
	};
}
