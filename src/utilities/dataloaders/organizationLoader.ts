import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "./withMetrics";

/**
 * Type representing an organization row from the database.
 */
export type OrganizationRow = typeof organizationsTable.$inferSelect;

/**
 * Creates a DataLoader for batching organization lookups by ID.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param perf - The performance tracker for monitoring batch operations.
 * @returns A DataLoader that batches and caches organization lookups within a single request.
 *
 * @example
 * ```typescript
 * const organizationLoader = createOrganizationLoader(drizzleClient, ctx.perf);
 * const organization = await organizationLoader.load(organizationId);
 * ```
 */
export function createOrganizationLoader(
	db: DrizzleClient,
	perf: PerformanceTracker,
) {
	const batchFn = async (ids: readonly string[]) => {
		const rows = await db
			.select()
			.from(organizationsTable)
			.where(inArray(organizationsTable.id, ids as string[]));

		const map = new Map<string, OrganizationRow>(
			rows.map((r: OrganizationRow) => [r.id, r]),
		);

		return ids.map((id) => map.get(id) ?? null);
	};

	const wrappedBatch = wrapBatchWithMetrics(
		"organizations.byId",
		perf,
		batchFn,
	);

	return new DataLoader<string, OrganizationRow | null>(wrappedBatch, {
		// Coalesce loads triggered within the same event loop tick
		batchScheduleFn: (cb: () => void) => setTimeout(cb, 0),
	});
}
