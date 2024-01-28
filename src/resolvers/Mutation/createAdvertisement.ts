import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";

export const createAdvertisement: MutationResolvers["createAdvertisement"] =
  async (_parent, args, _context) => {
    // Get the current user
    const currentUser = await User.findOne({
      _id: _context.userId,
    }).lean();

    // Checks whether currentUser exists.
    if (!currentUser) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM
      );
    }

    let uploadMediaFile = null;

    if (args.input.mediaFile) {
      const dataUrlPrefix = "data:";
      if (args.input.mediaFile.startsWith(dataUrlPrefix + "image/")) {
        uploadMediaFile = await uploadEncodedImage(args.input.mediaFile, null);
        console.log(uploadMediaFile, "Media File");
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
      creatorId: _context.userId,
      organization: args.input.organizationId,
    });
    // Returns createdAd.
    return {
      ...createdAdvertisement.toObject(),
      mediaUrl: uploadMediaFile
        ? `${_context.apiRootUrl}${uploadMediaFile}`
        : null,
    };
  };
