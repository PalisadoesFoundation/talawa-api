import type { FundraisingCampaignResolvers } from "../../types/generatedGraphQLTypes";
import { pledges } from "./campaignPledges";

export const FundraisingCampaign: FundraisingCampaignResolvers = {
  pledges,
};
