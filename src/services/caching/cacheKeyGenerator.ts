import crypto from "node:crypto";
import { CacheNamespace } from "./cacheConfig";

/**
 * Generate a cache key for a specific entity by ID.
 *
 * @param entity - The entity type (e.g., "user", "organization").
 * @param id - The entity ID.
 * @returns Cache key in format: `talawa:v1:${entity}:${id}`.
 *
 * @example
 * ```typescript
 * entityKey("user", "abc123") // "talawa:v1:user:abc123"
 * ```
 */
export function entityKey(entity: string, id: string | number): string {
	return `${CacheNamespace}:${entity}:${id}`;
}

/**
 * Deterministic JSON stringification for cache key generation.
 * Sorts object keys to ensure consistent output regardless of insertion order.
 *
 * @param obj - The object to stringify.
 * @returns Deterministic JSON string.
 */
export function stableStringify(obj: unknown): string {
	return JSON.stringify(obj, (_, value) => {
		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			return Object.keys(value as Record<string, unknown>)
				.sort()
				.reduce(
					(sorted, key) => {
						sorted[key] = (value as Record<string, unknown>)[key];
						return sorted;
					},
					{} as Record<string, unknown>,
				);
		}
		return value;
	});
}

/**
 * Generate a cache key for a list query with arguments.
 * Uses SHA1 hash of arguments for a compact, deterministic key.
 *
 * @param entity - The entity type.
 * @param args - Query arguments (filters, pagination, etc.).
 * @returns Cache key in format: `talawa:v1:${entity}:list:${hash}`.
 *
 * @example
 * ```typescript
 * listKey("organization", { limit: 10, offset: 0 }) // "talawa:v1:organization:list:a1b2c3..."
 * ```
 */
export function listKey(entity: string, args: unknown): string {
	const json = stableStringify(args);
	const hash = crypto.createHash("sha1").update(json).digest("hex");
	return `${CacheNamespace}:${entity}:list:${hash}`;
}
