import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  PRELOGIN_IMAGERY_FIELD_EMPTY,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, Community, User } from "../../models";
import type { InterfaceAppUserProfile } from "../../models";
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
  const user = await User.findById(context.userId);
  if (!user)
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );

  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: user?._id,
  }).lean();
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
      twitter: args.data.socialMediaUrls.twitter,
      linkedIn: args.data.socialMediaUrls.linkedIn,
      gitHub: args.data.socialMediaUrls.gitHub,
      youTube: args.data.socialMediaUrls.youTube,
      slack: args.data.socialMediaUrls.slack,
      reddit: args.data.socialMediaUrls.reddit,
    },
  });

  return true;
};
