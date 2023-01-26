import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Donation } from "../../models";

/**
 * @name getPlugins a GraphQL Query
 * @description returns list of donations as a transactions from database
 */
export const getDonations: QueryResolvers["getDonations"] = async () => {
  return await Donation.find().lean();
};
