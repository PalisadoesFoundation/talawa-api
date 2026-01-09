/**
 * Proxy wrapper for CacheService that automatically tracks cache operation performance,
 * including hits, misses, and timing for all cache operations.
 */

import type { CacheService } from "~/src/services/caching/CacheService";
import type { PerformanceTracker } from "./performanceTracker";

/**
 * Getter function type for accessing the performance tracker at runtime.
 * This allows the proxy to access request.perf without storing a direct reference.
 */
type PerfGetter = () => PerformanceTracker | undefined;

/**
 * Wraps a CacheService with automatic performance tracking.
 * All cache operations are automatically timed, and hits/misses are tracked.
 *
 * @param cache - The original CacheService to wrap
 * @param getPerf - Function that returns the current request's performance tracker
 * @returns A proxied CacheService with automatic tracking, or the original cache if perf is not available
 *
 * @example
 * ```typescript
 * const wrappedCache = wrapCacheWithMetrics(
 *   fastify.cache,
 *   () => request.perf
 * );
 * ```
 */
export function wrapCacheWithMetrics(
	cache: CacheService,
	getPerf: PerfGetter,
): CacheService {
	const perf = getPerf();

	// If no performance tracker, return original cache (zero overhead)
	if (!perf) {
		return cache;
	}

	// Return a new object that implements CacheService interface
	return {
		async get<T>(key: string): Promise<T | null> {
			const perf = getPerf();
			if (!perf) {
				return cache.get<T>(key);
			}

			// Track timing and hit/miss
			const result = await perf.time("cache:get", async () => {
				return await cache.get<T>(key);
			});

			// Track hit or miss based on result
			if (result !== null) {
				perf.trackCacheHit();
			} else {
				perf.trackCacheMiss();
			}

			return result;
		},

		async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
			const perf = getPerf();
			if (!perf) {
				return cache.set(key, value, ttlSeconds);
			}

			return perf.time("cache:set", async () => {
				return await cache.set(key, value, ttlSeconds);
			});
		},

		async del(keys: string | string[]): Promise<void> {
			const perf = getPerf();
			if (!perf) {
				return cache.del(keys);
			}

			return perf.time("cache:del", async () => {
				return await cache.del(keys);
			});
		},

		async clearByPattern(pattern: string): Promise<void> {
			const perf = getPerf();
			if (!perf) {
				return cache.clearByPattern(pattern);
			}

			return perf.time("cache:clearByPattern", async () => {
				return await cache.clearByPattern(pattern);
			});
		},

		async mget<T>(keys: string[]): Promise<(T | null)[]> {
			const perf = getPerf();
			if (!perf) {
				return cache.mget<T>(keys);
			}

			// Track timing
			const results = await perf.time("cache:mget", async () => {
				return await cache.mget<T>(keys);
			});

			// Track hits and misses for each key
			for (const result of results) {
				if (result !== null) {
					perf.trackCacheHit();
				} else {
					perf.trackCacheMiss();
				}
			}

			return results;
		},

		async mset<T>(
			entries: Array<{ key: string; value: T; ttlSeconds: number }>,
		): Promise<void> {
			const perf = getPerf();
			if (!perf) {
				return cache.mset(entries);
			}

			return perf.time("cache:mset", async () => {
				return await cache.mset(entries);
			});
		},
	};
}
