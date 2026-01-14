import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	type CacheService,
	getTTL,
	wrapWithCache,
} from "~/src/services/caching";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "~/src/utilities/metrics/withMetrics";

/**
 * Type representing an action item row from the database.
 */
export type ActionItemRow = typeof actionItemsTable.$inferSelect;

/**
 * Creates a DataLoader for batching action item lookups by ID.
 * When a cache service is provided, wraps the batch function with cache-first logic.
 * When a performance tracker is provided, wraps the batch function with performance metrics.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @param perf - Optional performance tracker for monitoring database operation durations.
 * @returns A DataLoader that batches and caches action item lookups within a single request.
 *
 * @example
 * ```typescript
 * const actionItemLoader = createActionItemLoader(drizzleClient, cacheService, perfTracker);
 * const actionItem = await actionItemLoader.load(actionItemId);
 * ```
 */
export function createActionItemLoader(
	db: DrizzleClient,
	cache: CacheService | null,
	perf?: PerformanceTracker,
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

	// Apply cache wrapping first (if cache is provided)
	const cacheWrappedBatch = cache
		? wrapWithCache(batchFn, {
				cache,
				entity: "actionItem",
				keyFn: (id) => id,
				ttlSeconds: getTTL("actionItem"),
			})
		: batchFn;

	// Apply metrics wrapping after cache wrapping to measure total batch execution time
	// Since wrapBatchWithMetrics("actionItems.byId", perf, cacheWrappedBatch) wraps cacheWrappedBatch,
	// metrics include cache layer time (cache hits/misses) rather than only DB time.
	// The ordering (cache first, then metrics) causes metrics to measure the full execution path.
	const wrappedBatch = perf
		? wrapBatchWithMetrics("actionItems.byId", perf, cacheWrappedBatch)
		: cacheWrappedBatch;

	return new DataLoader<string, ActionItemRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
