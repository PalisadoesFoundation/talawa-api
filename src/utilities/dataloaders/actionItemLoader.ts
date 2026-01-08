import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	type CacheService,
	getTTL,
	wrapWithCache,
} from "~/src/services/caching";

/**
 * Type representing an action item row from the database.
 */
export type ActionItemRow = typeof actionItemsTable.$inferSelect;

/**
 * Creates a DataLoader for batching action item lookups by ID.
 * When a cache service is provided, wraps the batch function with cache-first logic.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @returns A DataLoader that batches and caches action item lookups within a single request.
 *
 * @example
 * ```typescript
 * const actionItemLoader = createActionItemLoader(drizzleClient, cacheService);
 * const actionItem = await actionItemLoader.load(actionItemId);
 * ```
 */
export function createActionItemLoader(
	db: DrizzleClient,
	cache: CacheService | null,
) {
	const batchFn = async (
		ids: readonly string[],
	): Promise<(ActionItemRow | null)[]> => {
		const rows = await db
			.select()
			.from(actionItemsTable)
			.where(inArray(actionItemsTable.id, ids as string[]));

		const map = new Map<string, ActionItemRow>(
			rows.map((r: ActionItemRow) => [r.id, r]),
		);

		return ids.map((id) => map.get(id) ?? null);
	};

	const wrappedBatch = cache
		? wrapWithCache(batchFn, {
				cache,
				entity: "actionItem",
				keyFn: (id) => id,
				ttlSeconds: getTTL("actionItem"),
			})
		: batchFn;

	return new DataLoader<string, ActionItemRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
