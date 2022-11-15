import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Donation } from "../../models";

/**
 * This query will fetch the donation as a transaction from database.
 * @param _parent 
 * @param args - An object that contains `id` of the donation.
 * @returns A `donation` object.
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
