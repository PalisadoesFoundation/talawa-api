import { count, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { createOrganizationLoader } from "~/src/utilities/dataloaders/organizationLoader";

/**
 * Warms the organization cache by loading top N organizations by member count.
 * @param server - The Fastify server instance.
 * @returns {Promise<void>} Resolves when the organization cache warming has completed.
 */
export async function warmOrganizations(
	server: FastifyInstance,
): Promise<void> {
	const warmupCount = server.envConfig.CACHE_WARMING_ORG_COUNT;

	if (!warmupCount || warmupCount <= 0) {
		return;
	}

	if (!server.cache) {
		return;
	}

	server.log.info({ warmupCount }, "Warming cache for top organizations...");

	try {
		const db = server.drizzleClient;

		// Query top N organizations by member count
		const popularOrgs = await db
			.select({
				id: organizationsTable.id,
			})
			.from(organizationsTable)
			.leftJoin(
				organizationMembershipsTable,
				eq(organizationsTable.id, organizationMembershipsTable.organizationId),
			)
			.groupBy(organizationsTable.id)
			.orderBy(desc(count(organizationMembershipsTable.memberId)))
			.limit(warmupCount);

		if (popularOrgs.length === 0) {
			server.log.info("No organizations found to warm.");
			return;
		}

		server.log.info(
			{ count: popularOrgs.length },
			"Found organizations to warm. Loading...",
		);

		// Create a temporary loader to populate the cache
		// We pass the server's cache instance (which is Redis-backed if configured)
		// We don't pass a performance tracker as this is a background warming task
		const loader = createOrganizationLoader(db, server.cache);

		const orgIds = popularOrgs.map((org) => org.id);

		// Load in batch to optimize DB queries
		const results = await loader.loadMany(orgIds);

		const failures = results
			.map((result, index) => {
				if (result instanceof Error) {
					return { id: orgIds[index], error: result.message };
				}
				return null;
			})
			.filter((item): item is { id: string; error: string } => item !== null);

		if (failures.length > 0) {
			server.log.warn(
				{ failures },
				"Organization cache warming completed with partial failures.",
			);
		} else {
			server.log.info("Organization cache warming completed.");
		}
	} catch (err) {
		server.log.error({ err }, "Failed to warm organization cache.");
	}
}
