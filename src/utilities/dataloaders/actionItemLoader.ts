import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";

/**
 * Type representing an action item row from the database.
 */
export type ActionItemRow = typeof actionItemsTable.$inferSelect;

/**
 * Creates a DataLoader for batching action item lookups by ID.
 *
 * @param db - The Drizzle client instance for database operations.
 * @returns A DataLoader that batches and caches action item lookups within a single request.
 *
 * @example
 * ```typescript
 * const actionItemLoader = createActionItemLoader(drizzleClient);
 * const actionItem = await actionItemLoader.load(actionItemId);
 * ```
 */
export function createActionItemLoader(db: DrizzleClient) {
	return new DataLoader<string, ActionItemRow | null>(
		async (ids) => {
			const rows = await db
				.select()
				.from(actionItemsTable)
				.where(inArray(actionItemsTable.id, ids as string[]));

			const map = new Map<string, ActionItemRow>(
				rows.map((r: ActionItemRow) => [r.id, r]),
			);

			return ids.map((id) => map.get(id) ?? null);
		},
		{
			// Coalesce loads triggered within the same event loop tick
			batchScheduleFn: (cb) => setTimeout(cb, 0),
		},
	);
}
