import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";

/**
 * Type representing a user row from the database.
 */
export type UserRow = typeof usersTable.$inferSelect;

/**
 * Creates a DataLoader for batching user lookups by ID.
 *
 * @param db - The Drizzle client instance for database operations.
 * @returns A DataLoader that batches and caches user lookups within a single request.
 *
 * @example
 * ```typescript
 * const userLoader = createUserLoader(drizzleClient);
 * const user = await userLoader.load(userId);
 * ```
 */
export function createUserLoader(db: DrizzleClient) {
	return new DataLoader<string, UserRow | null>(
		async (ids) => {
			const rows = await db
				.select()
				.from(usersTable)
				.where(inArray(usersTable.id, ids as string[]));

			const map = new Map<string, UserRow>(rows.map((r: UserRow) => [r.id, r]));

			return ids.map((id) => map.get(id) ?? null);
		},
		{
			// Coalesce loads triggered within the same event loop tick
			batchScheduleFn: (cb) => setTimeout(cb, 0),
		},
	);
}
