import type { InterfaceFund } from "../../models";
import { Fund } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";
/**
 * Retrieves funds associated with a specific organization based on the provided query parameters.
 *
 * This function performs the following steps:
 * 1. Builds a query filter (`where`) and sorting parameters based on the provided arguments.
 * 2. Queries the database for funds associated with the specified organization ID and matching the filter criteria.
 * 3. Sorts the results based on the provided sorting order.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, including the organization ID (`organizationId`), filter criteria (`where`), and sorting order (`orderBy`).
 *
 * @returns A list of funds associated with the specified organization, matching the filter and sorting criteria.
 */

export const fundsByOrganization: QueryResolvers["fundsByOrganization"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceFund>(args.where);
    const sort = getSort(args.orderBy);

    const funds = await Fund.find({
      organizationId: args.organizationId,
      ...where,
    }).sort(sort);

    return funds;
  };
