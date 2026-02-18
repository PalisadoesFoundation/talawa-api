import type { FastifyBaseLogger } from "fastify";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

/**
 * Creates a cache proxy that wraps a cache implementation with performance tracking capabilities.
 *
 * This function instruments cache operations (`get`, `mget`, `set`, `del`) to track cache hits
 * and misses using a performance monitoring object.
 */

export function metricsCacheProxy<
	TCache extends {
		get: (key: string) => Promise<unknown>;
		mget?: (keys: string[]) => Promise<unknown[]>;
		set: (key: string, value: unknown, ttl: number) => Promise<unknown>;
		del: (keys: string | string[]) => Promise<unknown>;
		clearByPattern?: (pattern: string) => Promise<unknown>;
	},
>(
	cache: TCache,
	perf: {
		trackCacheHit: () => void;
		trackCacheMiss: () => void;
	},
	logger?: FastifyBaseLogger,
) {
	return {
		/**
		 * Get a single value from cache.
		 * - Normalizes undefined → null
		 * - Tracks hit/miss correctly
		 */
		async get<T>(key: string): Promise<T | null> {
			const value = await cache.get(key);

			if (value == null) {
				perf.trackCacheMiss();
				return null;
			} else {
				perf.trackCacheHit();
			}
			return value as T;
		},

		/**
		 * Get multiple values from cache.
		 * - Works with or without native mget
		 * - Normalizes undefined → null per element
		 * - Tracks hits/misses in a single pass
		 */
		async mget<T>(keys: string[]): Promise<(T | null)[]> {
			const raw = await (cache.mget
				? cache.mget(keys)
				: Promise.all(keys.map((k) => cache.get(k))));

			return raw.map((value) => {
				if (value == null) {
					perf.trackCacheMiss();
					return null;
				} else {
					perf.trackCacheHit();
				}
				return value as T;
			});
		},

		/**
		 * Set a value in cache.
		 */
		async set<T>(key: string, value: T, ttl: number) {
			return cache.set(key, value, ttl);
		},

		/**
		 * Delete one or more keys from cache.
		 */
		async del(keys: string | string[]) {
			return cache.del(keys);
		},

		/**
		 * Clear all keys matching a pattern. Forwarded without metrics.
		 *
		 * @param pattern - Glob-style pattern used to match keys to clear.
		 * @returns Promise that resolves when matching keys have been cleared.
		 */
		async clearByPattern(pattern: string): Promise<void> {
			if (!cache.clearByPattern) {
				logger?.warn(
					{
						msg: "cache clearByPattern unsupported",
						method: "clearByPattern",
						pattern,
					},
					"clearByPattern is not supported by the underlying cache implementation",
				);
				throw new TalawaRestError({
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: `clearByPattern("${pattern}") failed: method not supported by the underlying cache implementation`,
				});
			}
			await cache.clearByPattern(pattern);
		},
	};
}
