import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "./withMetrics";

/**
 * Type representing an action item row from the database.
 */
export type ActionItemRow = typeof actionItemsTable.$inferSelect;

/**
 * Creates a DataLoader for batching action item lookups by ID.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param perf - The performance tracker for monitoring batch operations.
 * @returns A DataLoader that batches and caches action item lookups within a single request.
 *
 * @example
 * ```typescript
 * const actionItemLoader = createActionItemLoader(drizzleClient, ctx.perf);
 * const actionItem = await actionItemLoader.load(actionItemId);
 * ```
 */
export function createActionItemLoader(
	db: DrizzleClient,
	perf: PerformanceTracker,
) {
	const batchFn = async (ids: readonly string[]) => {
		const rows = await db
			.select()
			.from(actionItemsTable)
			.where(inArray(actionItemsTable.id, ids as string[]));

		const map = new Map<string, ActionItemRow>(
			rows.map((r: ActionItemRow) => [r.id, r]),
		);

		return ids.map((id) => map.get(id) ?? null);
	};

	const wrappedBatch = wrapBatchWithMetrics("actionItems.byId", perf, batchFn);

	return new DataLoader<string, ActionItemRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb: () => void) => setTimeout(cb, 0),
	});
}
