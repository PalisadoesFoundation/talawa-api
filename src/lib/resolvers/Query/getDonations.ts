import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Donation } from "../../models";

/**
 * This query will fetch the list of donations as a transactions from the database.
 * @return An object containing the list of donations.
 */
export const getDonations: QueryResolvers["getDonations"] = async () => {
  return await Donation.find().lean();
};
