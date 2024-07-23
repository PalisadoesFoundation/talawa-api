import OrganizationCache from "../redisCache";
import type { InterfaceOrganization } from "../../models";

/**
 * Deletes the specified organization from Redis cache.
 *
 * @param organization - The InterfaceOrganization object representing the organization to delete.
 * @returns A promise resolving to void.
 */
export async function deleteOrganizationFromCache(
  organization: InterfaceOrganization,
): Promise<void> {
  // Generate the cache key for the organization based on its _id
  const key = `organization:${organization._id}`;

  // Delete the organization from Redis cache
  await OrganizationCache.del(key);
}
