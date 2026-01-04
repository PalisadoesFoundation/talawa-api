import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "~/src/utilities/metrics/withMetrics";

/**
 * Type representing a user row from the database.
 */
export type UserRow = typeof usersTable.$inferSelect;

/**
 * Creates a DataLoader for batching user lookups by ID.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param perf - Optional performance tracker for monitoring database operations.
 * @returns A DataLoader that batches and caches user lookups within a single request.
 *
 * @example
 * ```typescript
 * const userLoader = createUserLoader(drizzleClient, req.perf);
 * const user = await userLoader.load(userId);
 * ```
 */
export function createUserLoader(db: DrizzleClient, perf?: PerformanceTracker) {
	const batchFn = async (ids: readonly string[]) => {
		const rows = await db
			.select()
			.from(usersTable)
			.where(inArray(usersTable.id, ids as string[]));

		const map = new Map<string, UserRow>(rows.map((r: UserRow) => [r.id, r]));

		return ids.map((id) => map.get(id) ?? null);
	};

	const meteredBatch = perf
		? wrapBatchWithMetrics("users.byId", perf, batchFn)
		: batchFn;

	return new DataLoader<string, UserRow | null>(meteredBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
