import { logger } from "../../libraries";
import type { InterfaceOrganization } from "../../models";
import OrganizationCache from "../redisCache";

/**
 * Stores organizations in Redis cache with a specified time-to-live (TTL).
 * @param organizations - Array of organizations to be cached.
 * @returns Promise<void>
 */
export async function cacheOrganizations(
  organizations: InterfaceOrganization[],
): Promise<void> {
  try {
    // Create a pipeline for efficient Redis operations
    const pipeline = OrganizationCache.pipeline();

    organizations.forEach((org) => {
      if (org !== null) {
        // Generate key for each organization based on its ID
        const key = `organization:${org._id}`;

        // Store organization data as JSON string in Redis
        pipeline.set(key, JSON.stringify(org));

        // Set TTL for each organization to 300 seconds (5 minutes)
        pipeline.expire(key, 300);
      }
    });

    // Execute the pipeline for batch Redis operations
    await pipeline.exec();
  } catch (error) {
    // Log any errors that occur during caching
    logger.info(error);
  }
}
