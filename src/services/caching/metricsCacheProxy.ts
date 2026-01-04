import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import type { CacheService } from "./CacheService";

/**
 * Wraps a CacheService with performance tracking.
 * Tracks cache hits and misses for monitoring purposes.
 *
 * @param cache - The underlying cache service to wrap
 * @param perf - Performance tracker instance
 * @returns A cache service proxy that tracks performance metrics
 *
 * @example
 * ```typescript
 * const trackedCache = metricsCacheProxy(app.cache, req.perf);
 * // Use trackedCache in GraphQL context
 * ```
 */
export function metricsCacheProxy(
	cache: CacheService,
	perf: PerformanceTracker,
): CacheService {
	return {
		async get<T>(key: string): Promise<T | null> {
			const value = await cache.get<T>(key);
			if (value !== null) {
				perf.trackCacheHit();
			} else {
				perf.trackCacheMiss();
			}
			return value;
		},

		async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
			return cache.set(key, value, ttlSeconds);
		},

		async del(keys: string | string[]): Promise<void> {
			return cache.del(keys);
		},

		async clearByPattern(pattern: string): Promise<void> {
			return cache.clearByPattern(pattern);
		},

		async mget<T>(keys: string[]): Promise<(T | null)[]> {
			const results = await cache.mget<T>(keys);
			// Track hits and misses for batch operations
			let hits = 0;
			let misses = 0;
			for (const result of results) {
				if (result !== null) {
					hits++;
				} else {
					misses++;
				}
			}
			// Track each hit and miss individually
			for (let i = 0; i < hits; i++) {
				perf.trackCacheHit();
			}
			for (let i = 0; i < misses; i++) {
				perf.trackCacheMiss();
			}
			return results;
		},

		async mset<T>(
			entries: Array<{ key: string; value: T; ttlSeconds: number }>,
		): Promise<void> {
			return cache.mset(entries);
		},
	};
}
