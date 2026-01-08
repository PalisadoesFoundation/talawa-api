import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	type CacheService,
	getTTL,
	wrapWithCache,
} from "~/src/services/caching";

/**
 * Type representing a user row from the database.
 */
export type UserRow = typeof usersTable.$inferSelect;

/**
 * Creates a DataLoader for batching user lookups by ID.
 * When a cache service is provided, wraps the batch function with cache-first logic.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @returns A DataLoader that batches and caches user lookups within a single request.
 *
 * @example
 * ```typescript
 * const userLoader = createUserLoader(drizzleClient, cacheService);
 * const user = await userLoader.load(userId);
 * ```
 */
export function createUserLoader(
	db: DrizzleClient,
	cache: CacheService | null,
) {
	const batchFn = async (
		ids: readonly string[],
	): Promise<(UserRow | null)[]> => {
		const rows = await db
			.select()
			.from(usersTable)
			.where(inArray(usersTable.id, ids as string[]));

		const map = new Map<string, UserRow>(rows.map((r: UserRow) => [r.id, r]));

		return ids.map((id) => map.get(id) ?? null);
	};

	const wrappedBatch = cache
		? wrapWithCache(batchFn, {
				cache,
				entity: "user",
				keyFn: (id) => id,
				ttlSeconds: getTTL("user"),
			})
		: batchFn;

	return new DataLoader<string, UserRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
