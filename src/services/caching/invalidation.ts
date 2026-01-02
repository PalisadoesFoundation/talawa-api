import type { CacheService } from "./CacheService";
import { CacheNamespace } from "./cacheConfig";

/**
 * Invalidate a specific entity from the cache.
 *
 * @param cache - The cache service instance.
 * @param entity - The entity type (e.g., "user", "organization").
 * @param id - The entity ID.
 *
 * @example
 * ```typescript
 * await invalidateEntity(ctx.cache, "organization", args.id);
 * ```
 */
export async function invalidateEntity(
	cache: CacheService,
	entity: string,
	id: string | number,
): Promise<void> {
	await cache.del(`${CacheNamespace}:${entity}:${id}`);
}

/**
 * Invalidate all list caches for a specific entity type.
 * Use this after mutations that affect list queries (create, delete, bulk update).
 *
 * @param cache - The cache service instance.
 * @param entity - The entity type.
 *
 * @example
 * ```typescript
 * await invalidateEntityLists(ctx.cache, "organization");
 * ```
 */
export async function invalidateEntityLists(
	cache: CacheService,
	entity: string,
): Promise<void> {
	const pattern = `${CacheNamespace}:${entity}:list:*`;
	await cache.clearByPattern(pattern);
}
