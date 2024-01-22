import type { FundCampaignResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";
import { parentFundId } from "./fund";

export const FundCampaign: FundCampaignResolvers = {
  creator,
  parentFundId,
};
