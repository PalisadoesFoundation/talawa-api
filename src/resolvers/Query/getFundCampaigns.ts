import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { FundCampaign } from "../../models";

/**
 * This query will fetch the fund camapaign.
 * @param _parent-
 * @param args -
 * @returns A `fundCampaign` object.
 */

export const getFundCampaigns: QueryResolvers["getFundCampaigns"] =
  async () => {
    return await FundCampaign.find().lean();
  };
