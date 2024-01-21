import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { FundCampaign, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";

/**
 * This function enables to create a donation as transaction
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns Created FundCampaign
 */

export const createFundCampaign: MutationResolvers["createFundCampaign"] =
  async (_parent, args, context) => {
    const currentUser = User.findById({
      _id: context?.userId,
    }).lean();

    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    // creates a new fund campaign
    const createdFundCampaign = await FundCampaign.create({
      name: args?.data?.name,
      currency: args?.data?.currency,
      goalAmount: args?.data?.goalAmount,
      startDate: args?.data?.startDate,
      endDate: args?.data?.endDate,
      creatorId: context.userId,
    });

    return createdFundCampaign;
  };
