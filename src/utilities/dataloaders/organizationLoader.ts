import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	type CacheService,
	getTTL,
	wrapWithCache,
} from "~/src/services/caching";

/**
 * Type representing an organization row from the database.
 */
export type OrganizationRow = typeof organizationsTable.$inferSelect;

/**
 * Creates a DataLoader for batching organization lookups by ID.
 * When a cache service is provided, wraps the batch function with cache-first logic.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @returns A DataLoader that batches and caches organization lookups within a single request.
 *
 * @example
 * ```typescript
 * const organizationLoader = createOrganizationLoader(drizzleClient, cacheService);
 * const organization = await organizationLoader.load(organizationId);
 * ```
 */
export function createOrganizationLoader(
	db: DrizzleClient,
	cache: CacheService | null,
) {
	const batchFn = async (
		ids: readonly string[],
	): Promise<(OrganizationRow | null)[]> => {
		const rows = await db
			.select()
			.from(organizationsTable)
			.where(inArray(organizationsTable.id, ids as string[]));

		const map = new Map<string, OrganizationRow>(
			rows.map((r: OrganizationRow) => [r.id, r]),
		);

		return ids.map((id) => map.get(id) ?? null);
	};

	const wrappedBatch = cache
		? wrapWithCache(batchFn, {
				cache,
				entity: "organization",
				keyFn: (id) => id,
				ttlSeconds: getTTL("organization"),
			})
		: batchFn;

	return new DataLoader<string, OrganizationRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
