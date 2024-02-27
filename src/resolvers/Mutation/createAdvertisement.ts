import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement, Organization, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";

export const createAdvertisement: MutationResolvers["createAdvertisement"] =
  async (_parent, args, context) => {
    // Get the current user
    const currentUser = await User.findOne({
      _id: context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const organization = await Organization.findOne({
      _id: args.input.organizationId,
    }).lean();

    // Checks whether organization with _id == args.data.organizationId exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM,
      );
    }

    let uploadMediaFile = null;

    if (args.input.mediaFile) {
      const dataUrlPrefix = "data:";
      if (args.input.mediaFile.startsWith(dataUrlPrefix + "image/")) {
        uploadMediaFile = await uploadEncodedImage(args.input.mediaFile, null);
      } else if (args.input.mediaFile.startsWith(dataUrlPrefix + "video/")) {
        uploadMediaFile = await uploadEncodedVideo(args.input.mediaFile, null);
      } else {
        throw new Error("Unsupported file type.");
      }
    }

    // Creates new Ad.
    const createdAdvertisement = await Advertisement.create({
      ...args.input,
      mediaUrl: uploadMediaFile,
      creatorId: context.userId,
      organizationId: args.input.organizationId,
    });
    // Returns createdAd.
    return {
      advertisement: {
        ...createdAdvertisement.toObject(),
        _id: createdAdvertisement._id.toString(),
        mediaUrl: `${context.apiRootUrl}${uploadMediaFile}`,
      },
    };
  };
