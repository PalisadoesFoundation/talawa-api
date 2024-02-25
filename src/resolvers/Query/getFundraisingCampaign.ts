import {
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This query will fetch the fundraisingCampaign as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the campaign.
 * @returns A `fundraisingCampaign` object.
 */
export const getFundraisingCampaignById: QueryResolvers["getFundraisingCampaignById"] =
  async (_parent, args) => {
    const campaign = await FundraisingCampaign.findOne({
      _id: args.id,
    }).lean();

    return campaign ?? ({} as InterfaceFundraisingCampaign);
  };
