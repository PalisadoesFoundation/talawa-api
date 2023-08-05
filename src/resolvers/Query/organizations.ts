import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { InterfaceOrganization, Organization } from "../../models";
import { errors } from "../../libraries";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { getSort } from "./helperFunctions/getSort";
import { OrganizationCache } from "../../services/redis";
/**
 * If a 'id' is specified, this query will return an organisation;
 * otherwise, it will return all organisations with a size of limit 100.
 * @param _parent-
 * @param args - An object containing `orderBy` and `id` of the Organization.
 * @returns The organization if valid `id` is provided else return organizations with size limit 100.
 * @remarks `id` in the args is optional.
 */
export const organizations: QueryResolvers["organizations"] = async (
  _parent,
  args
) => {
  const sort = getSort(args.orderBy);
  let organizationFound;
  if (args.id) {

    console.time('redis')
    const organizationFoundInCache = await OrganizationCache.get(`organization:${args.id}`);
    console.timeEnd('redis')

    if (organizationFoundInCache) {
      return JSON.parse(organizationFoundInCache)
    }

    console.time('db qeury')

    organizationFound = await Organization.find({
      _id: args.id,
    })
      .sort(sort)
      .lean();

      console.timeEnd('db qeury')

    if (!organizationFound[0]) {
      throw new errors.NotFoundError(
        ORGANIZATION_NOT_FOUND_ERROR.DESC,
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }



    

    return organizationFound;
  } else {
    organizationFound = await Organization.find().sort(sort).limit(100).lean();
  }

  cacheOrganizations(organizationFound)

  return organizationFound;
};


// Function to store organizations in the cache using pipelining
async function cacheOrganizations(organizations:InterfaceOrganization[]) {
  const pipeline = OrganizationCache.pipeline();

  organizations.forEach(org => {
    const key = `organization:${org.id}`;
    pipeline.hset(key, 'id', JSON.stringify(org));
  });

  // Execute the pipeline
  await pipeline.exec();

  console.log('Organizations cached successfully.');
}

