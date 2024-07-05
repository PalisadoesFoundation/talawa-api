import {
  FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
<<<<<<< HEAD
  USER_NOT_MADE_PLEDGE_ERROR,
=======
>>>>>>> develop
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { FundraisingCampaign, User } from "../../models";
import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../models/FundraisingCampaignPledge";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables to remove fundraising campaign pledge .
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the fundraising campaign pledge exists.
 * 3. If the user has made the pledge.
 * @returns Deleted fundraising campaign pledge.
 */

export const removeFundraisingCampaignPledge: MutationResolvers["removeFundraisingCampaignPledge"] =
  async (
    _parent,
    args,
    context,
  ): Promise<InterfaceFundraisingCampaignPledges> => {
    let currentUser: InterfaceUser | null;
    const userFoundInCache = await findUserInCache([context.userId]);
    currentUser = userFoundInCache[0];
    if (currentUser === null) {
      currentUser = await User.findOne({
        _id: context.userId,
      }).lean();
      if (currentUser !== null) {
        await cacheUsers([currentUser]);
      }
    }

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }
    const pledge = await FundraisingCampaignPledge.findOne({
      _id: args.id,
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

<<<<<<< HEAD
    // Checks whether the user has made the pledge.
    const pledgeUserIds = pledge.users.map((id) => id?.toString());
    if (!pledgeUserIds.includes(context.userId)) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_MADE_PLEDGE_ERROR.MESSAGE),
        USER_NOT_MADE_PLEDGE_ERROR.CODE,
        USER_NOT_MADE_PLEDGE_ERROR.PARAM,
      );
    }

=======
>>>>>>> develop
    // Remove the pledge from the campaign.
    for (const campaignId of pledge.campaigns) {
      await FundraisingCampaign.updateOne(
        { _id: campaignId?.toString() },
        { $pull: { pledges: args.id } },
      );
    }
    // Remove the pledge.
    await FundraisingCampaignPledge.deleteOne({
      _id: args.id,
    });
    return pledge as InterfaceFundraisingCampaignPledges;
  };
