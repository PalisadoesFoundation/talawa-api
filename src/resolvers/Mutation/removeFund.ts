import { Types } from "mongoose";
import {
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import {
  AppUserProfile,
  Fund,
  User,
  type InterfaceAppUserProfile,
  type InterfaceFund,
  type InterfaceUser,
} from "../../models";

import type { InterfaceFundraisingCampaign } from "../../models/FundraisingCampaign";
import { FundraisingCampaign } from "../../models/FundraisingCampaign";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceFundraisingCampaignPledges } from "../../models/FundraisingCampaignPledge";
import { FundraisingCampaignPledge } from "../../models/FundraisingCampaignPledge";

/**
 * This function enables to remove fund .
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the fund  exists.
 * 3. If the user is authorized.
 * 4. If the user is admin of the organization.
 * @returns Deleted fund.
 */

export const removeFund: MutationResolvers["removeFund"] = async (
  parent,
  args,
  context,
): Promise<InterfaceFund> => {
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

  const fund = await Fund.findOne({
    _id: args.id,
  })
    .populate({
      path: "campaigns",
      populate: {
        path: "pledges",
      },
    })
    .lean();

  // Checks whether fund exists.
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

  //checks whether the user is admin of organization or not
  const currentUserIsOrgAdmin = currentUserAppProfile.adminFor.some(
    (organizationId) =>
      new Types.ObjectId(organizationId?.toString()).equals(currentOrgId),
  );

  const currentUserIsSuperAdmin = currentUserAppProfile.isSuperAdmin;

  // checks if the user is either super admin or admin of the organization
  if (!(currentUserIsOrgAdmin || currentUserIsSuperAdmin)) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const campaignsToDelete: Types.ObjectId[] = [];
  const pledgesToDelete: Types.ObjectId[] = [];

  for (const campaign of fund.campaigns as InterfaceFundraisingCampaign[]) {
    campaignsToDelete.push(campaign._id);
    for (const pledge of campaign.pledges as InterfaceFundraisingCampaignPledges[]) {
      pledgesToDelete.push(pledge._id);
      // Remove pledges & campaign from related user's AppUserProfile
      await AppUserProfile.updateMany(
        { userId: { $in: pledge.users } },
        { $pull: { pledges: pledge._id, campaigns: campaign._id } },
      );
    }
  }

  // Remove all pledges associated with the fund
  await FundraisingCampaignPledge.deleteMany({
    _id: { $in: pledgesToDelete },
  });

  // Remove all campaigns associated with the fund
  await FundraisingCampaign.deleteMany({
    _id: { $in: campaignsToDelete },
  });

  //deletes the fund
  await Fund.deleteOne({
    _id: args.id,
  });

  //returns the deleted fund
  return fund as InterfaceFund;
};
