/**
 * Creates a cache proxy that wraps a cache implementation with performance tracking capabilities.
 *
 * This function instruments cache operations (`get`, `mget`, `set`, `del`) to track cache hits
 * and misses using a performance monitoring object.
 *
 * @param cache - Cache implementation providing `get`, `set`, `del`, and optional `mget`
 * @param perf - Performance tracker with `trackCacheHit` and `trackCacheMiss` methods
 *
 * @returns A proxy object exposing the following async methods:
 * - `get(key)` – Retrieves a single value and tracks hit or miss
 * - `mget(keys)` – Retrieves multiple values and tracks hits and misses
 * - `set(key, value, ttl)` – Stores a value with TTL
 * - `del(keys)` – Deletes one or more keys
 *
 * @example
 * ```ts
 * const proxiedCache = metricsCacheProxy(redisCache, performanceTracker);
 * const value = await proxiedCache.get('myKey');
 * ```
 */
export function metricsCacheProxy<
	TCache extends {
		get: (key: string) => Promise<unknown>;
		mget?: (keys: string[]) => Promise<unknown[]>;
		set: (key: string, value: unknown, ttl: number) => Promise<unknown>;
		del: (keys: string | string[]) => Promise<unknown>;
	},
>(
	cache: TCache,
	perf: {
		trackCacheHit: () => void;
		trackCacheMiss: () => void;
	},
) {
	return {
		async get<T>(key: string): Promise<T | null> {
			const value = await cache.get(key);
			if (value === null || value === undefined) {
				perf.trackCacheMiss();
			} else {
				perf.trackCacheHit();
			}
			return value as T | null;
		},

		async mget<T>(keys: string[]): Promise<(T | null)[]> {
			const res = await (cache.mget
				? cache.mget(keys)
				: Promise.all(keys.map((k) => cache.get(k))));

			// Count hits (non-null values)
			let hits = 0;
			let misses = 0;

			for (const v of res) {
				if (v !== null && v !== undefined) {
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

			return res as (T | null)[];
		},

		async set<T>(key: string, value: T, ttl: number) {
			return cache.set(key, value, ttl);
		},

		async del(keys: string | string[]) {
			return cache.del(keys);
		},
	};
}
