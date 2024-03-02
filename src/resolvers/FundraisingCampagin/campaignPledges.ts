import { FundraisingCampaignPledge } from "../../models/FundraisingCampaignPledge";
import type { FundraisingCampaignResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This resolver function will fetch and return the pledges assoicated with the campaign from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all pledges associated with the campaign.
 */
export const pledges: FundraisingCampaignResolvers["pledges"] = async (
  parent,
) => {
  return await FundraisingCampaignPledge.find({
    campaignId: parent._id,
  }).lean();
};
