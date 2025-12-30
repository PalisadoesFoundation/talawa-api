import crypto from "node:crypto";
import { CacheNamespace } from "./cacheConfig";

/**
 * Characters that are unsafe in Redis keys and patterns.
 * These could break namespacing or pattern matching.
 */
const UNSAFE_KEY_CHARS = /[:*?[\]]/g;

/**
 * Sanitize a value for use in a Redis cache key.
 * Replaces unsafe characters with underscores.
 *
 * @param value - The value to sanitize.
 * @returns Sanitized string safe for cache key use.
 */
function sanitizeKeyPart(value: string | number): string {
	return String(value).replace(UNSAFE_KEY_CHARS, "_");
}

/**
 * Generate a cache key for a specific entity by ID.
 * Input values are sanitized to prevent key injection attacks.
 *
 * @param entity - The entity type (e.g., "user", "organization").
 * @param id - The entity ID.
 * @returns Cache key in format: `talawa:v1:${entity}:${id}`.
 *
 * @example
 * ```typescript
 * entityKey("user", "abc123") // "talawa:v1:user:abc123"
 * entityKey("user", "foo:bar") // "talawa:v1:user:foo_bar" (sanitized)
 * ```
 */
export function entityKey(entity: string, id: string | number): string {
	const safeEntity = sanitizeKeyPart(entity);
	const safeId = sanitizeKeyPart(id);
	return `${CacheNamespace}:${safeEntity}:${safeId}`;
}

/**
 * Deterministic JSON stringification for cache key generation.
 * Sorts object keys to ensure consistent output regardless of insertion order.
 *
 * **Note on undefined properties**: Properties with undefined values are
 * omitted by JSON.stringify (standard behavior). This means `{a:1,b:undefined}`
 * serializes identically to `{a:1}`. Callers should be aware of this potential
 * cache key collision if undefined properties are semantically significant.
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
 *
 * Uses SHA-1 hash for compact, deterministic keys. SHA-1 is chosen for
 * performance and compactness (40-char hex digest), not for cryptographic
 * security. The hash is derived from stableStringify output, which ensures
 * deterministic ordering of object properties. If stronger hashing is needed
 * for future security concerns, SHA-256 can be substituted.
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
	const safeEntity = sanitizeKeyPart(entity);
	const json = stableStringify(args);
	const hash = crypto.createHash("sha1").update(json).digest("hex");
	return `${CacheNamespace}:${safeEntity}:list:${hash}`;
}
