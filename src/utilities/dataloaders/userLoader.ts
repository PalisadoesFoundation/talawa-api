import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "./withMetrics";

/**
 * Type representing a user row from the database.
 */
export type UserRow = typeof usersTable.$inferSelect;

/**
 * Creates a DataLoader for batching user lookups by ID.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param perf - The performance tracker for monitoring batch operations.
 * @returns A DataLoader that batches and caches user lookups within a single request.
 *
 * @example
 * ```typescript
 * const userLoader = createUserLoader(drizzleClient, ctx.perf);
 * const user = await userLoader.load(userId);
 * ```
 */
export function createUserLoader(db: DrizzleClient, perf: PerformanceTracker) {
	const batchFn = async (ids: readonly string[]) => {
		const rows = await db
			.select()
			.from(usersTable)
			.where(inArray(usersTable.id, ids as string[]));

		const map = new Map<string, UserRow>(rows.map((r: UserRow) => [r.id, r]));

		return ids.map((id) => map.get(id) ?? null);
	};

	const wrappedBatch = wrapBatchWithMetrics("users.byId", perf, batchFn);

	return new DataLoader<string, UserRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb: () => void) => setTimeout(cb, 0),
	});
}
