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
 * Uses a Proxy to call getPerf() at call-time, enabling dynamic metrics and preserving all cache properties.
 *
 * @param cache - The original CacheService to wrap
 * @param getPerf - Function that returns the current request's performance tracker
 * @returns A proxied CacheService with automatic tracking that always wraps the cache
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
	// Always return a Proxy that calls getPerf() at call-time
	// This allows metrics to be enabled/disabled dynamically and preserves all cache properties
	return new Proxy(cache, {
		get(target, prop, receiver) {
			const original = Reflect.get(target, prop, receiver);

			// If it's a function (method), wrap it with metrics tracking
			if (typeof original === "function") {
				return function (this: unknown, ...args: unknown[]) {
					const perf = getPerf();
					if (!perf) {
						// No perf tracker, call original method directly on target
						return original.apply(target, args);
					}

					// Track based on method name
					const methodName = String(prop);
					const operationName = `cache:${methodName}`;

					// Special handling for get and mget to track hits/misses
					if (methodName === "get") {
						return perf.time(operationName, async () => {
							const result = await original.apply(target, args);
							// Track hit or miss based on result
							// Treat both null and undefined as misses
							if (result != null) {
								perf.trackCacheHit();
							} else {
								perf.trackCacheMiss();
							}
							return result;
						});
					}

					if (methodName === "mget") {
						return perf.time(operationName, async () => {
							const results = await original.apply(target, args);
							// Track hits and misses for each key
							// Treat both null and undefined as misses
							for (const result of results) {
								if (result != null) {
									perf.trackCacheHit();
								} else {
									perf.trackCacheMiss();
								}
							}
							return results;
						});
					}

					// For other methods (set, del, clearByPattern, mset), just track timing
					return perf.time(operationName, async () => {
						return await original.apply(target, args);
					});
				};
			}

			// For non-function properties, return as-is
			return original;
		},
	}) as CacheService;
}
