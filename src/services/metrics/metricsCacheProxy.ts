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
		 */
		async clearByPattern(pattern: string) {
			if (cache.clearByPattern) {
				return cache.clearByPattern(pattern);
			}
		},
	};
}
