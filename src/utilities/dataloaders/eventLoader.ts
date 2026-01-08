import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	type CacheService,
	getTTL,
	wrapWithCache,
} from "~/src/services/caching";

/**
 * Type representing an event row from the database.
 */
export type EventRow = typeof eventsTable.$inferSelect;

/**
 * Creates a DataLoader for batching event lookups by ID.
 * When a cache service is provided, wraps the batch function with cache-first logic.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @returns A DataLoader that batches and caches event lookups within a single request.
 *
 * @example
 * ```typescript
 * const eventLoader = createEventLoader(drizzleClient, cacheService);
 * const event = await eventLoader.load(eventId);
 * ```
 */
export function createEventLoader(
	db: DrizzleClient,
	cache: CacheService | null,
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

	const wrappedBatch = cache
		? wrapWithCache(batchFn, {
				cache,
				entity: "event",
				keyFn: (id) => id,
				ttlSeconds: getTTL("event"),
			})
		: batchFn;

	return new DataLoader<string, EventRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb) => setTimeout(cb, 0),
	});
}
