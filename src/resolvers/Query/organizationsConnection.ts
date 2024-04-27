import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceOrganization } from "../../models";
import { Organization } from "../../models";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

/**
 * This query will retrieve from the database a list of
 * organisation under the specified limit for the specified page in the pagination.
 * @param _parent-
 * @param args - An object holds the data required to execute the query.
 * `args.first` specifies the number of members to retrieve, and `args.after` specifies
 * the unique identification for each item in the returned list.
 * @returns An object containing the list of organization and pagination information.
 * @remarks Connection in graphQL means pagination,
 * learn more about Connection {@link https://relay.dev/graphql/connections.htm | here}.
 */
export const organizationsConnection: QueryResolvers["organizationsConnection"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceOrganization>(args.where);
    const sort = getSort(args.orderBy);

    const organizations = await Organization.find(where)
      .sort(sort)
      .limit(args.first ?? 0)
      .skip(args.skip ?? 0)
      .lean();

    return organizations;
  };
