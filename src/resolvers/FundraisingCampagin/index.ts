import type { FundraisingCampaignResolvers } from "../../types/generatedGraphQLTypes";
import { pledges } from "./campaignPledges";
import { fundId } from "./parentFund";

export const FundraisingCampaign: FundraisingCampaignResolvers = {
  pledges,
  fundId,
};
