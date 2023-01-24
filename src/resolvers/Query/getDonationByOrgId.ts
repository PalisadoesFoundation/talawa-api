import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";

/**
 * @name getDonationByOrgId a GraphQL Query
 * @description returns list of  donations as a transactions that matches the provided orgId property from database
 */
export const getDonationByOrgId: QueryResolvers["getDonationByOrgId"] = async (
  _parent,
  args
) => {
  return await Donation.find({
    orgId: args.orgId,
  }).lean();
};
