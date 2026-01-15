import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	type CacheService,
	getTTL,
	wrapWithCache,
} from "~/src/services/caching";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "~/src/utilities/metrics/withMetrics";
import { wrapBatchWithTracing } from "./wrapBatchWithTracing";

/**
 * Type representing a user row from the database.
 */
export type UserRow = typeof usersTable.$inferSelect;

/**
 * Creates a DataLoader for batching user lookups by ID.
 * When a cache service is provided, wraps the batch function with cache-first logic.
 * When a performance tracker is provided, wraps the batch function with performance metrics.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @param perf - Optional performance tracker for monitoring database operation durations.
 * @returns A DataLoader that batches and caches user lookups within a single request.
 *
 * @example
 * ```typescript
 * const userLoader = createUserLoader(drizzleClient, cacheService, perfTracker);
 * const user = await userLoader.load(userId);
 * ```
 */
export function createUserLoader(
	db: DrizzleClient,
	cache: CacheService | null,
	perf?: PerformanceTracker,
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

	// Apply cache wrapping first (if cache is provided)
	const cacheWrappedBatch = cache
		? wrapWithCache(batchFn, {
				cache,
				entity: "user",
				keyFn: (id) => id,
				ttlSeconds: getTTL("user"),
			})
		: batchFn;

	// Apply metrics wrapping after cache wrapping to measure total batch execution time
	// Since wrapBatchWithMetrics("users.byId", perf, cacheWrappedBatch) wraps cacheWrappedBatch,
	// metrics include cache layer time (cache hits/misses) rather than only DB time.
	// The ordering (cache first, then metrics) causes metrics to measure the full execution path.
	const metricsWrappedBatch = perf
		? wrapBatchWithMetrics("users.byId", perf, cacheWrappedBatch)
		: cacheWrappedBatch;

	// Apply tracing wrapper last to create spans for each batch operation
	const wrappedBatch = wrapBatchWithTracing("users", metricsWrappedBatch);

	return new DataLoader<string, UserRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
