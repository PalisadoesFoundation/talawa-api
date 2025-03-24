/**
 * Resolver for querying organizations.
 * @returns Array of organization objects
 */
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Organization } from "../../models";
import { errors } from "../../libraries";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { getSort } from "./helperFunctions/getSort";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";

export const organizations: QueryResolvers["organizations"] = async (_parent, args) => {
  const sort = getSort(args.orderBy);
  if (args.id) {
    const cached = await findOrganizationsInCache([args.id]);
    if (!cached.includes(null)) return cached;
    const org = await Organization.find({ _id: args.id })
      .sort(sort)
      .select("name description image _id")
      .lean();
    await cacheOrganizations(org);
    if (!org[0]) throw new errors.NotFoundError(ORGANIZATION_NOT_FOUND_ERROR.DESC, ORGANIZATION_NOT_FOUND_ERROR.CODE, ORGANIZATION_NOT_FOUND_ERROR.PARAM);
    return org;
  }
  const filter = args.filter || "";
  const orgs = await Organization.find({ name: { $regex: filter, $options: "i" } })
    .sort(sort)
    .select("name description image _id")
    .lean();
    await cacheOrganizations(orgs);
    return orgs;
};