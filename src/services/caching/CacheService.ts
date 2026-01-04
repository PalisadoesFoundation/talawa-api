/**
 * Abstract interface for cache operations.
 * Implementations should handle serialization/deserialization and graceful degradation.
 */
export interface CacheService {
	/**
	 * Retrieve a cached value by key.
	 * @param key - The cache key to retrieve.
	 * @returns The cached value or null if not found/expired.
	 */
	get<T>(key: string): Promise<T | null>;

	/**
	 * Store a value in the cache with a TTL.
	 * @param key - The cache key.
	 * @param value - The value to cache (will be JSON serialized).
	 * @param ttlSeconds - Time-to-live in seconds.
	 */
	set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

	/**
	 * Delete one or more keys from the cache.
	 * @param keys - Single key or array of keys to delete.
	 */
	del(keys: string | string[]): Promise<void>;

	/**
	 * Delete all keys matching a glob pattern.
	 * Uses SCAN internally to avoid blocking Redis.
	 * @param pattern - Glob pattern (e.g., "talawa:v1:user:list:*").
	 */
	clearByPattern(pattern: string): Promise<void>;

	/**
	 * Batch get multiple keys.
	 * @param keys - Array of cache keys.
	 * @returns Array of values in the same order as keys (null for missing).
	 */
	mget<T>(keys: string[]): Promise<(T | null)[]>;

	/**
	 * Batch set multiple key-value pairs with TTLs.
	 * @param entries - Array of `{ key, value, ttlSeconds }` objects.
	 */
	mset<T>(
		entries: Array<{ key: string; value: T; ttlSeconds: number }>,
	): Promise<void>;
}
