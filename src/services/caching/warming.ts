import { count, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { createOrganizationLoader } from "~/src/utilities/dataloaders/organizationLoader";

/**
 * Warms the organization cache by loading top N organizations by member count.
 * @param server - The Fastify server instance.
 */
export async function warmOrganizations(
	server: FastifyInstance,
): Promise<void> {
	const warmupCount = server.envConfig.CACHE_WARMING_ORG_COUNT;

	if (!warmupCount || warmupCount <= 0) {
		return;
	}

	server.log.info(`Warming cache for top ${warmupCount} organizations...`);

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
			`Found ${popularOrgs.length} organizations to warm. Loading...`,
		);

		// Create a temporary loader to populate the cache
		// We pass the server's cache instance (which is Redis-backed if configured)
		// We don't pass a performance tracker as this is a background warming task
		const loader = createOrganizationLoader(db, server.cache);

		// Load sequentially to minimize DB spike
		for (const org of popularOrgs) {
			await loader.load(org.id);
		}

		server.log.info("Organization cache warming completed.");
	} catch (err) {
		server.log.error({ err }, "Failed to warm organization cache.");
	}
}
