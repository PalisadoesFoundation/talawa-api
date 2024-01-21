import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { FundCampaign } from "../../models";

/**
 * This function enables to create a donation as transaction
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns Created FundCampaign
 */

export const createFundCampaign: MutationResolvers["createFundCampaign"] =
  async (_parent, args, context) => {
    // creates a new fund campaign
    const createdFundCampaign = await FundCampaign.create({
      name: args?.data?.name,
      currency: args?.data?.currency,
      goalAmount: args?.data?.goalAmount,
      startDate: args?.data?.startDate,
      endDate: args?.data?.endDate,
      creatorId: context?.userId,
    });

    return createdFundCampaign;
  };
