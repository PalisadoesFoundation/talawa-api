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
import { User } from "../../models";
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
<<<<<<< HEAD
    // console.log(pledge);
    //check if user has made the pledge

    const pledgeUserIds = pledge.users.map((id) => id?.toString());
    if (!pledgeUserIds.includes(context.userId)) {
      throw new errors.ConflictError(
        requestContext.translate(USER_NOT_MADE_PLEDGE_ERROR.MESSAGE),
        USER_NOT_MADE_PLEDGE_ERROR.CODE,
        USER_NOT_MADE_PLEDGE_ERROR.PARAM,
      );
    }

    let startDate;
    let endDate;

    if (args.data.startDate) {
      startDate = args.data.startDate;
    }
    if (args.data.endDate) {
      endDate = args.data.endDate;
    }
    //validates StartDate and endDate
    validateDate(startDate, endDate);

    // Update the pledge
=======

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
    }

>>>>>>> develop
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
