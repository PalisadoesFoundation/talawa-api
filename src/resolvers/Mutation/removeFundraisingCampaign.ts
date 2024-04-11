import { Types } from "mongoose";
import {
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceUser,
  InterfaceAppUserProfile,
  Fund,
  FundraisingCampaign,
  User,
  type InterfaceFundraisingCampaign,
  AppUserProfile
} from "../../models";

import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";

/**
 * This function enables to remove fundraising campaign .
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the fundraising campaign  exists.
 * 3. If the user is authorized.
 * 4. If the user is admin of the organization.
 * @returns Deleted fundraising campaign.
 */

export const removeFundraisingCampaign: MutationResolvers["removeFundraisingCampaign"] =
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

    // Checks whether currentUser exists.
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

    const campaign = await FundraisingCampaign.findOne({
      _id: args.id,
    }).lean();

    // Checks whether fundraising campaign exists.
    if (!campaign) {
      throw new errors.NotFoundError(
        requestContext.translate(FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE),
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.CODE,
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.PARAM,
      );
    }
    const fund = await Fund.findOne({
      _id: campaign.fundId?.toString(),
    }).lean();

    // Checks whether parent fund exists.
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

    // Checks whether the user is admin of the organization or not.
    if (!currentUserIsOrgAdmin || !currentUserAppProfile.isSuperAdmin) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM,
      );
    }
    // Deletes the fundraising campaign.
    await FundraisingCampaign.deleteOne({
      _id: args.id,
    });

    // Removes the campaign from the fund.
    await Fund.updateOne(
      {
        _id: fund._id,
      },
      {
        $pull: {
          campaigns: args.id,
        },
      },
    );

    // Returns the deleted fundraising campaign.
    return campaign as InterfaceFundraisingCampaign;
  };
