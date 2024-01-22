import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { FundCampaign } from "../../models";

export const campaigns: FundResolvers["campaigns"] = async (parent) => {
  return await FundCampaign.find({
    id: {
      $in: parent.campaigns,
    },
  });
};
