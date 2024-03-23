import {
  COMMUNITY_NOT_FOUND_ERROR,
  DEFAULT_COMMUNITY,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, Community, User } from "../../models";
import type { InterfaceAppUserProfile } from "../../models";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
import { deletePreviousImage } from "../../utilities/encodedImageStorage/deletePreviousImage";

export const resetCommunity: MutationResolvers["resetCommunity"] = async (
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

  const community = await Community.findById(args.id);
  if (!community)
    throw new errors.NotFoundError(
      requestContext.translate(COMMUNITY_NOT_FOUND_ERROR.MESSAGE),
      COMMUNITY_NOT_FOUND_ERROR.CODE,
      COMMUNITY_NOT_FOUND_ERROR.PARAM,
    );

  //delete the previous community logo
  if (community.logoUrl) await deletePreviousImage(community.logoUrl as string);

  const defaultCommunity = {
    name: DEFAULT_COMMUNITY.name,
    logoUrl: "",
    description: DEFAULT_COMMUNITY.description,
    websiteLink: "",
    socialMediaUrls: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedIn: "",
      gitHub: "",
      youTube: "",
      slack: "",
      reddit: "",
    },
  };

  const updatedCommunity = await Community.findByIdAndUpdate(
    args.id,
    defaultCommunity,
    { new: true },
  );

  return Boolean(updatedCommunity);
};
