import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../models/FundraisingCampaignPledge";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This query will fetch the fundraisingCampaignPledge as a transaction from database.
 * @param _parent-
 * @param args - An object that contains `id` of the fund.
 * @returns A `fundraisingCampaignPledge` object.
 */ //@ts-expect-error - type error
export const getFundraisingCampaignPledgeById: QueryResolvers["getFundraisingCampaignPledgeById"] =
  async (_parent, args) => {
    const pledge = await FundraisingCampaignPledge.findOne({
      _id: args.id,
    }).lean();

    return pledge ?? ({} as InterfaceFundraisingCampaignPledges);
  };
