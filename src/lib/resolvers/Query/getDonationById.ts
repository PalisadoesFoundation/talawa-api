import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Donation } from "../../models";

/**
 * @name getDonationsById a GraphQL Query
 * @description returns donation as a transaction that matches the provided Id property from database
 */
export const getDonationById: QueryResolvers["getDonationById"] = async (
  _parent,
  args
) => {
  const donation = await Donation.findOne({
    _id: args.id,
  }).lean();

  return donation!;
};
