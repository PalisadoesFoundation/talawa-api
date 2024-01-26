import type { FundCampaignResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";
import { parentFundId } from "./fund";
import { pledgeId } from "./pledge";

export const FundCampaign: FundCampaignResolvers = {
  creator,
  parentFundId,
  pledgeId,
};
