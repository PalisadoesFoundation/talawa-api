import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { FundCampaign } from "../../models";

/**
 * This query will fetch the donation as a transaction from database.
 * @param _parent -
 * @param args - An object that contains `id` of the fund campaign.
 * @returns A `fundCampaign` object.
 */

export const getFundCampaignById: QueryResolvers["getFundCampaignById"] =
  async (_parent, args) => {
    return await FundCampaign.findById(args.id).lean();
  };
