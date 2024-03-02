import {
  FUNDRAISING_CAMPAIGN_ALREADY_ADDED,
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MADE_PLEDGE_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { FundraisingCampaign, User } from "../../models";
import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../models/FundraisingCampaignPledge";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This function adds  campaign pledge to campaign.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * 2. If the pledge exists
 * 3. If the campaign exists
 * @returns Updated pledge

 */

export const addPledgeToFundraisingCampaign: MutationResolvers["addPledgeToFundraisingCampaign"] =
  async (
    _parent,
    args,
    context,
  ): Promise<InterfaceFundraisingCampaignPledges> => {
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const pledge = await FundraisingCampaignPledge.findOne({
      _id: args.pledgeId,
    }).lean();

    // Checks whether pledge exists.
    if (!pledge) {
      throw new errors.NotFoundError(
        requestContext.translate(
          FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.MESSAGE,
        ),
        FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.PARAM,
      );
    }
    const campaign = await FundraisingCampaign.findOne({
      _id: args.campaignId,
    }).lean();

    // Checks whether campaign exists.
    if (!campaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE),
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.PARAM,
      );
    }
    // Checks whether the user has made the pledge.
    const pledgeUserIds = pledge.users.map((id) => id?.toString());
    if (!pledgeUserIds.includes(context.userId)) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_MADE_PLEDGE_ERROR.MESSAGE),
        USER_NOT_MADE_PLEDGE_ERROR.CODE,
        USER_NOT_MADE_PLEDGE_ERROR.PARAM,
      );
    }
    // Checks whether the campaign is already added to the pledge.
    const pledgeCampaignIds = pledge.campaigns.map((id) => id?.toString());
    if (pledgeCampaignIds.includes(args.campaignId)) {
      throw new errors.ConflictError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_ALREADY_ADDED.MESSAGE),
        FUNDRAISING_CAMPAIGN_ALREADY_ADDED.CODE,
        FUNDRAISING_CAMPAIGN_ALREADY_ADDED.PARAM,
      );
    }
    // Add the campaign to the pledge
    const updatedPledge = await FundraisingCampaignPledge.findOneAndUpdate(
      {
        _id: args.pledgeId,
      },
      {
        $push: { campaigns: args.campaignId },
      },
      { new: true },
    );

    // Add the pledge to the campaign
    await FundraisingCampaign.updateOne(
      {
        _id: args.campaignId,
      },
      {
        $push: { pledges: args.pledgeId },
      },
    );
    return updatedPledge as InterfaceFundraisingCampaignPledges;
  };
