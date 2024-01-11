import {
  COMMUNITY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { Community, User } from "../../models";
import type { InterfaceCommunity } from "../../models/Community";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { superAdminCheck } from "../../utilities";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";

export const updateCommunity: MutationResolvers["updateCommunity"] = async (
  _parent,
  args,
  context
) => {
  const user = await User.findById(context.userId);
  if (!user)
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );

  superAdminCheck(user);

  const community = await Community.findById(args.id);
  if (!community)
    throw new errors.NotFoundError(
      requestContext.translate(COMMUNITY_NOT_FOUND_ERROR.MESSAGE),
      COMMUNITY_NOT_FOUND_ERROR.CODE,
      COMMUNITY_NOT_FOUND_ERROR.PARAM
    );

  const updateObj: Partial<InterfaceCommunity> = {
    name: args.data?.name || community.name,
    description: args.data?.description || community.description,
    websiteLink: args.data?.websiteLink || community.websiteLink,
    socialMediaUrls: {
      facebook:
        args.data?.socialMediaUrls?.facebook ||
        community.socialMediaUrls.facebook,
      twitter:
        args.data?.socialMediaUrls?.twitter ||
        community.socialMediaUrls.twitter,
      linkedIn:
        args.data?.socialMediaUrls?.linkedIn ||
        community.socialMediaUrls.linkedIn,
      gitHub:
        args.data?.socialMediaUrls?.gitHub || community.socialMediaUrls.gitHub,
      youTube:
        args.data?.socialMediaUrls?.youTube ||
        community.socialMediaUrls.youTube,
      slack:
        args.data?.socialMediaUrls?.slack || community.socialMediaUrls.slack,
      reddit:
        args.data?.socialMediaUrls?.reddit || community.socialMediaUrls.reddit,
    },
  };

  if (args.file) {
    const uploadImageFileName = await uploadEncodedImage(
      args.file,
      community.image
    );
    updateObj.image = uploadImageFileName;
  }

  const updatedCommunity = await Community.findOneAndUpdate(
    { _id: args.id },
    { $set: updateObj },
    { new: true }
  );

  return updatedCommunity!;
};
