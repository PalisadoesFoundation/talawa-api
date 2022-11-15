import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Donation } from "../../models";

/**
 * This query fetch the donation as a transaction for an organization from database.
 * @param _parent 
 * @param args - An object that contains `orgId` of the Organization.
 * @returns A `donation` object.
 */
export const getDonationByOrgId: QueryResolvers["getDonationByOrgId"] = async (
  _parent,
  args
) => {
  return await Donation.find({
    orgId: args.orgId,
  }).lean();
};
