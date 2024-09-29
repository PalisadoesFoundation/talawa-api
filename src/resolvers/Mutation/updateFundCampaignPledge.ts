import { Types } from "mongoose";
import {
  FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../models/FundraisingCampaignPledge";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { validateDate } from "../../utilities/dateValidator";

/**
 * This function enables to update a fundraising campaign pledge.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the FundraisingCampaignPledge exists.
 * 3. If the user has made the pledge.
 * 4. If the start date is valid.
 * 5. If the end date is valid.
 * @returns Updated campaign pledge.
 */

export const updateFundraisingCampaignPledge: MutationResolvers["updateFundraisingCampaignPledge"] =
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

    const startDate: Date | undefined = args.data.startDate;
    const endDate: Date | undefined = args.data.endDate;
    validateDate(startDate, endDate);

    if (args.data.users && args.data.users.length > 0) {
      const users = await User.find({ _id: { $in: args.data.users } }).lean();
      if (users.length !== args.data.users.length) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
          USER_NOT_FOUND_ERROR.CODE,
          USER_NOT_FOUND_ERROR.PARAM,
        );
      }

      // Identify all users who were previously part of the pledge and were removed
      const usersRemoved = pledge.users.filter(
        (userId) => userId && !args.data.users?.includes(userId.toString()),
      );

      // Update AppUserProfile for every user who was removed from the pledge
      for (const userId of usersRemoved) {
        const updatedUserProfile = await AppUserProfile.findOneAndUpdate(
          { userId },
          { $pull: { pledges: args.id } },
          { new: true },
        );

        // Remove campaign from appUserProfile if there is no pledge left for that campaign.
        const pledges =
          updatedUserProfile?.pledges as InterfaceFundraisingCampaignPledges[];

        const campaignId = pledge.campaign?.toString();
        const otherPledges = pledges.filter(
          (p) => p.campaign?.toString() === campaignId,
        );

        if (otherPledges.length === 0) {
          await AppUserProfile.findOneAndUpdate(
            { userId },
            { $pull: { campaigns: campaignId } },
            { new: true },
          );
        }
      }

      // Identify all users who are newly added to the pledge
      const usersAdded = args.data.users.filter(
        (userId) =>
          userId && !pledge.users.includes(new Types.ObjectId(userId)),
      );

      // Update AppUserProfile for every user who is newly added to the pledge
      await AppUserProfile.updateMany(
        {
          userId: { $in: usersAdded },
        },
        {
          $addToSet: { pledges: pledge._id, campaigns: pledge.campaign },
        },
      );
    }

    const updatedPledge = await FundraisingCampaignPledge.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $set: args.data,
      },
      {
        new: true,
      },
    );
    return updatedPledge as InterfaceFundraisingCampaignPledges;
  };
