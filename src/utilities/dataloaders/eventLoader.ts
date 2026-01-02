import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "./withMetrics";

/**
 * Type representing an event row from the database.
 */
export type EventRow = typeof eventsTable.$inferSelect;

/**
 * Creates a DataLoader for batching event lookups by ID.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param perf - The performance tracker for monitoring batch operations.
 * @returns A DataLoader that batches and caches event lookups within a single request.
 *
 * @example
 * ```typescript
 * const eventLoader = createEventLoader(drizzleClient, ctx.perf);
 * const event = await eventLoader.load(eventId);
 * ```
 */
export function createEventLoader(
	db: DrizzleClient,
	perf: PerformanceTracker,
) {
	const batchFn = async (ids: readonly string[]) => {
		const rows = await db
			.select()
			.from(eventsTable)
			.where(inArray(eventsTable.id, ids as string[]));

		const map = new Map<string, EventRow>(
			rows.map((r: EventRow) => [r.id, r]),
		);

		return ids.map((id) => map.get(id) ?? null);
	};

	const wrappedBatch = wrapBatchWithMetrics("events.byId", perf, batchFn);

	return new DataLoader<string, EventRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb: () => void) => setTimeout(cb, 0),
	});
}
