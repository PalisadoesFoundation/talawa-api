import OrganizationCache from "../redisCache";
import type { InterfaceOrganization } from "../../models";

export async function deleteOrganizationFromCache(
  organization: InterfaceOrganization
): Promise<void> {
  const key = `organization:${organization._id}`;

  await OrganizationCache.del(key);
}
