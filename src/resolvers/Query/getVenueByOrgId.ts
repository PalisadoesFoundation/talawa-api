import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceVenue } from "../../models";
import { Venue } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";
import { getSort } from "./helperFunctions/getSort";
/**
 * Retrieves venues associated with a specific organization, with optional filtering and sorting.
 *
 * This function performs the following steps:
 * 1. Constructs the query filter using the `getWhere` helper function based on provided filter criteria.
 * 2. Determines the sorting order using the `getSort` helper function based on provided sort criteria.
 * 3. Queries the `Venue` collection in the database to find venues that match the specified organization ID and any additional filter criteria.
 * 4. Limits the number of results based on the `first` argument and skips results based on the `skip` argument.
 * 5. Sorts the results according to the specified sort criteria.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param args - The arguments provided by the GraphQL query, including:
 *   - `orgId`: The ID of the organization for which venues are being retrieved.
 *   - `where`: Optional filter criteria to apply to the venue query.
 *   - `orderBy`: Optional sorting criteria for the results.
 *   - `first`: Optional limit on the number of results to return.
 *   - `skip`: Optional number of results to skip for pagination.
 *
 * @returns A promise that resolves to an array of venues matching the query criteria.
 */

export const getVenueByOrgId: QueryResolvers["getVenueByOrgId"] = async (
  _parent,
  args,
) => {
  const where = getWhere<InterfaceVenue>(args.where);
  const sort = getSort(args.orderBy);

  return await Venue.find({
    organization: args.orgId,
    ...where,
  })
    .limit(args.first ?? 0)
    .skip(args.skip ?? 0)
    .sort(sort)
    .lean();
};
