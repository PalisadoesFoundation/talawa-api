/**
 * Cache namespace for key segregation.
 * Increment version (e.g., "talawa:v2") when cache shapes change.
 */
export const CacheNamespace = "talawa:v1";

/**
 * TTL configuration for different entity types (in seconds).
 */
export type EntityTTL = {
	user: number;
	organization: number;
	event: number;
	post: number;
};

/**
 * Default TTL values per entity type.
 */
export const defaultEntityTTL: EntityTTL = {
	user: 300, // 5 minutes
	organization: 300, // 5 minutes
	event: 120, // 2 minutes
	post: 60, // 1 minute
};

/**
 * Parse TTL overrides from environment variable if present.
 * Expected format: JSON object with entity keys and TTL values.
 * Example: '{"user": 600, "organization": 600}'
 *
 * Validates that each TTL is a finite positive number.
 * Invalid entries are logged and ignored.
 */
function parseEnvTTLOverrides(): Partial<EntityTTL> {
	const envValue = process.env.CACHE_ENTITY_TTLS;
	if (!envValue) {
		return {};
	}
	try {
		const parsed = JSON.parse(envValue) as Record<string, unknown>;
		const validated: Partial<EntityTTL> = {};

		for (const [key, value] of Object.entries(parsed)) {
			const numValue = Number(value);
			if (Number.isFinite(numValue) && numValue > 0) {
				validated[key as keyof EntityTTL] = numValue;
			} else {
				console.warn(
					`[CacheConfig] Invalid TTL for "${key}": ${JSON.stringify(value)} (must be a positive finite number)`,
				);
			}
		}

		return validated;
	} catch {
		console.warn(
			`[CacheConfig] Failed to parse CACHE_ENTITY_TTLS as JSON: ${envValue}`,
		);
		return {};
	}
}

const envOverrides = parseEnvTTLOverrides();

/**
 * Get the TTL for a specific entity type.
 * Respects environment variable overrides via CACHE_ENTITY_TTLS.
 *
 * @param entity - The entity type.
 * @returns TTL in seconds.
 */
export function getTTL(entity: keyof EntityTTL): number {
	return envOverrides[entity] ?? defaultEntityTTL[entity];
}
