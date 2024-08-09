import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceDonation } from "../../models";
import { Donation } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";
/**
 * Retrieves a paginated list of donations associated with a specific organization from the database.
 *
 * This function performs the following steps:
 * 1. Constructs a query filter using the provided criteria and organization ID.
 * 2. Queries the database for donations that match the criteria and belong to the specified organization.
 * 3. Applies pagination by limiting and skipping the results based on the provided arguments.
 * 4. Returns the list of donations that match the query.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param args - The arguments provided by the GraphQL query, including:
 *   - `orgId`: The ID of the organization for which donations are being retrieved.
 *   - `where`: Optional filter criteria to apply to the donations.
 *   - `first`: The maximum number of donation records to return (for pagination).
 *   - `skip`: The number of donation records to skip (for pagination).
 *
 * @returns  A list of donations associated with the specified organization and matching the provided filter criteria.
 */

export const getDonationByOrgIdConnection: QueryResolvers["getDonationByOrgIdConnection"] =
  async (_parent, args) => {
    const where = getWhere<InterfaceDonation>(args.where);

    return await Donation.find({
      orgId: args.orgId,
      ...where,
    })
      .limit(args.first ?? 0)
      .skip(args.skip ?? 0)
      .lean();
  };
