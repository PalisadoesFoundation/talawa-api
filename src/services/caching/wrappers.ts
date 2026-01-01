import type { CacheService } from "./CacheService";
import { CacheNamespace } from "./cacheConfig";

/**
 * Options for wrapping a batch function with caching.
 */
export interface WrapWithCacheOptions<K, _V> {
	/**
	 * The cache service instance.
	 */
	cache: CacheService;
	/**
	 * Entity type for cache key generation.
	 */
	entity: string;
	/**
	 * Function to convert a key to its cache key suffix.
	 * @param key - The batch key.
	 * @returns String representation for the cache key.
	 */
	keyFn: (key: K) => string | number;
	/**
	 * TTL in seconds for cached values.
	 */
	ttlSeconds: number;
}

/**
 * Wraps a batch function with caching support.
 * Ideal for integrating with DataLoader to add a cache layer.
 *
 * @param batchFn - The original batch function that fetches data.
 * @param opts - Caching options.
 * @returns A wrapped batch function that checks cache first.
 *
 * @example
 * ```typescript
 * const cachedBatch = wrapWithCache(batchFn, {
 *   cache: ctx.cache,
 *   entity: "user",
 *   keyFn: (id) => id,
 *   ttlSeconds: 300,
 * });
 * return new DataLoader(cachedBatch);
 * ```
 */
export function wrapWithCache<K, V>(
	batchFn: (keys: readonly K[]) => Promise<(V | null)[]>,
	opts: WrapWithCacheOptions<K, V>,
): (keys: readonly K[]) => Promise<(V | null)[]> {
	const { cache, entity, keyFn, ttlSeconds } = opts;

	return async (keys: readonly K[]): Promise<(V | null)[]> => {
		// Generate cache keys for all input keys
		const cacheKeys = keys.map(
			(k) => `${CacheNamespace}:${entity}:${String(keyFn(k))}`,
		);

		// Try to get all values from cache
		const cached = await cache.mget<V>(cacheKeys);

		// Build result array and identify missing indices
		const results: (V | null)[] = new Array(keys.length).fill(null);
		const missIdx: number[] = [];

		cached.forEach((v, i) => {
			if (v !== null) {
				results[i] = v;
			} else {
				missIdx.push(i);
			}
		});

		// If all values were cached, return immediately
		if (!missIdx.length) {
			return results;
		}

		// Fetch missing values from the original batch function
		const missedKeys = missIdx.map((i) => keys[i]) as K[];
		const fetched = await batchFn(missedKeys);

		// Prepare entries for cache storage
		const toSet: Array<{ key: string; value: V }> = [];
		for (let j = 0; j < fetched.length; j++) {
			const v = fetched[j];
			const idx = missIdx[j];
			if (v !== null && v !== undefined && idx !== undefined) {
				const key = cacheKeys[idx];
				if (key !== undefined) {
					toSet.push({ key, value: v as V });
				}
			}
		}

		// Store fetched values in cache
		if (toSet.length) {
			await cache.mset(
				toSet.map((e) => ({ key: e.key, value: e.value, ttlSeconds })),
			);
		}

		// Fill in the missing results
		for (let j = 0; j < missIdx.length; j++) {
			const i = missIdx[j];
			const value = fetched[j];
			if (i !== undefined && value !== undefined) {
				results[i] = value;
			}
		}

		return results;
	};
}
