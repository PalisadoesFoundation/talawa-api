import { Types } from "mongoose";
import {
  FUNDRAISING_CAMPAIGN_ALREADY_EXISTS,
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import {
  AppUserProfile,
  Fund,
  FundraisingCampaign,
  User,
  type InterfaceAppUserProfile,
  type InterfaceFundraisingCampaign,
  type InterfaceUser,
} from "../../models";

import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { validateDate } from "../../utilities/dateValidator";

/**
 * This function enables to update a fundraising campaign.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the FundraisingCampaign exists.
 * 3. If the user is authorized to update the fundraising campaign.
 * 4. If the fundraising campaign already exists with the same name.
 * 5. If the start date is valid.
 * 6. If the end date is valid.
 * @returns Updated campaign.
 */

export const updateFundraisingCampaign: MutationResolvers["updateFundraisingCampaign"] =
  async (_parent, args, context): Promise<InterfaceFundraisingCampaign> => {
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

    //Checks if the current user exists
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    let currentUserAppProfile: InterfaceAppUserProfile | null;
    const appUserProfileFoundInCache = await findAppUserProfileCache([
      currentUser.appUserProfileId?.toString(),
    ]);
    currentUserAppProfile = appUserProfileFoundInCache[0];
    if (currentUserAppProfile === null) {
      currentUserAppProfile = await AppUserProfile.findOne({
        userId: currentUser._id,
      }).lean();
      if (currentUserAppProfile !== null) {
        await cacheAppUserProfile([currentUserAppProfile]);
      }
    }
    if (!currentUserAppProfile) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    const campaigin = await FundraisingCampaign.findById({
      _id: args.id,
    });

    //Checks if the fundraising campaign exists
    if (!campaigin) {
      throw new errors.NotFoundError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE),
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.PARAM,
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

    validateDate(startDate, endDate);
    const fund = await Fund.findOne({
      _id: campaigin.fundId?.toString(),
    });

    //Checks if the fund exists
    if (!fund) {
      throw new errors.NotFoundError(
        requestContext.translate(FUND_NOT_FOUND_ERROR.MESSAGE),
        FUND_NOT_FOUND_ERROR.CODE,
        FUND_NOT_FOUND_ERROR.PARAM,
      );
    }

    const currentOrg = await Fund.findById(fund._id)
      .select("organizationId")
      .lean();

    const currentOrgId = currentOrg?.organizationId?.toString();

    const currentUserIsOrgAdmin = currentUserAppProfile.adminFor.some(
      (organizationId) =>
        new Types.ObjectId(organizationId?.toString()).equals(currentOrgId),
    );

    //Checks if the user is authorized to update the fundraising campaign
    if (!(currentUserIsOrgAdmin || currentUserAppProfile.isSuperAdmin)) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }

    //Checks if the name is provided, checks if the fundraising campaign already exists with the same name
    if (args.data.name) {
      const exisitingCampaign = await FundraisingCampaign.findOne({
        name: args.data.name,
      });

      if (exisitingCampaign) {
        throw new errors.ConflictError(
          requestContext.translate(FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.MESSAGE),
          FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.CODE,
          FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.PARAM,
        );
      }
    }

    //Updates the fundraising campaign with the provided data
    const updatedCampaign = await FundraisingCampaign.findOneAndUpdate(
      {
        _id: args.id.toString(),
      },
      {
        $set: args.data,
      },
      {
        new: true,
      },
    ).lean();

    return updatedCampaign as InterfaceFundraisingCampaign;
  };
