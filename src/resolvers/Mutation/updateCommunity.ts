import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  PRELOGIN_IMAGERY_FIELD_EMPTY,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, Community, User } from "../../models";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";

/**
 * This function enables to upload Pre login imagery.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the user is super admin.
 * @returns Boolean.
 */

export const updateCommunity: MutationResolvers["updateCommunity"] = async (
  _parent,
  args,
  context,
) => {
  let user: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  user = userFoundInCache[0];
  if (user === null) {
    user = await User.findOne({
      _id: context.userId,
    }).lean();
    if (user !== null) {
      await cacheUsers([user]);
    }
  }

  if (!user)
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );

  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    user.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: user._id,
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
  superAdminCheck(currentUserAppProfile as InterfaceAppUserProfile);

  // args.data should have logo, name and websiteLink
  if (!args.data.name || !args.data.logo || !args.data.websiteLink) {
    throw new errors.InputValidationError(
      requestContext.translate(PRELOGIN_IMAGERY_FIELD_EMPTY.MESSAGE),
      PRELOGIN_IMAGERY_FIELD_EMPTY.CODE,
      PRELOGIN_IMAGERY_FIELD_EMPTY.PARAM,
    );
  }

  // If previous data exists then delete the previous data
  const data = await Community.findOne();
  if (data) {
    await Community.deleteOne({ _id: data._id });
  }

  await Community.create({
    name: args.data.name,
    websiteLink: args.data.websiteLink,
    logoUrl: args.data.logo,
    socialMediaUrls: {
      facebook: args.data.socialMediaUrls.facebook,
      instagram: args.data.socialMediaUrls.facebook,
      X: args.data.socialMediaUrls.X,
      linkedIn: args.data.socialMediaUrls.linkedIn,
      gitHub: args.data.socialMediaUrls.gitHub,
      youTube: args.data.socialMediaUrls.youTube,
      slack: args.data.socialMediaUrls.slack,
      reddit: args.data.socialMediaUrls.reddit,
    },
  });

  return true;
};
