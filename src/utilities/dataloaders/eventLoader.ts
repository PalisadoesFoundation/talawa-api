import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	type CacheService,
	getTTL,
	wrapWithCache,
} from "~/src/services/caching";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "~/src/utilities/metrics/withMetrics";

/**
 * Type representing an event row from the database.
 */
export type EventRow = typeof eventsTable.$inferSelect;

/**
 * Creates a DataLoader for batching event lookups by ID.
 * When a cache service is provided, wraps the batch function with cache-first logic.
 * When a performance tracker is provided, wraps the batch function with performance metrics.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @param perf - Optional performance tracker for monitoring database operation durations.
 * @returns A DataLoader that batches and caches event lookups within a single request.
 *
 * @example
 * ```typescript
 * const eventLoader = createEventLoader(drizzleClient, cacheService, perfTracker);
 * const event = await eventLoader.load(eventId);
 * ```
 */
export function createEventLoader(
	db: DrizzleClient,
	cache: CacheService | null,
	perf?: PerformanceTracker,
) {
	const batchFn = async (
		ids: readonly string[],
	): Promise<(EventRow | null)[]> => {
		const rows = await db
			.select()
			.from(eventsTable)
			.where(inArray(eventsTable.id, ids as string[]));

		const map = new Map<string, EventRow>(rows.map((r: EventRow) => [r.id, r]));

		return ids.map((id) => map.get(id) ?? null);
	};

	// Apply cache wrapping first (if cache is provided)
	const cacheWrappedBatch = cache
		? wrapWithCache(batchFn, {
				cache,
				entity: "event",
				keyFn: (id) => id,
				ttlSeconds: getTTL("event"),
			})
		: batchFn;

	// Apply metrics wrapping after cache wrapping to measure actual DB time
	const wrappedBatch = perf
		? wrapBatchWithMetrics("events.byId", perf, cacheWrappedBatch)
		: cacheWrappedBatch;

	return new DataLoader<string, EventRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
