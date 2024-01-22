import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { Fund } from "../../models";

/**
 * This query will fetch the donation as a transaction from database.
 * @param _parent -
 * @param args - An object that contains `id` of the fund campaign.
 * @returns A `fundCampaign` object.
 */

export const getFundById: QueryResolvers["getFundById"] = async (
  _parent,
  args
) => {
  return await Fund.findById(args.id).lean();
};
