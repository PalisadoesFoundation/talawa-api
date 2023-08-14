import { ObjectId } from "mongoose";
import OrganizationCache from "./OrganizationCache";
import type { InterfaceOrganization } from "../../models";

export async function findOrganizationsInCache(
  ids: string[]
): Promise<(InterfaceOrganization | null)[]> {
  const keys: string[] = ids.map((id) => {
    return `organization:${id}`;
  });

  const organizationFoundInCache = await OrganizationCache.mget(keys);

  const organizations = organizationFoundInCache.map((org) => {
    if (org === null) {
      return null;
    }
    return JSON.parse(org);
  });

  return organizations;
}
