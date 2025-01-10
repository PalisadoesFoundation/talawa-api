import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { Advertisement, Organization, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";

/**
 * Mutation resolver function to create a new advertisement.
 *
 * This function performs the following actions:
 * 1. Verifies that the current user, identified by `context.userId`, exists.
 * 2. Ensures that the organization specified by `args.input.organizationId` exists.
 * 3. Uploads the media file if provided, determining its type (image or video).
 * 4. Creates a new advertisement with the provided details.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `input`: An object containing:
 *     - `organizationId`: The ID of the organization where the advertisement will be created.
 *     - `mediaFile`: The encoded media file (image or video) to be uploaded.
 *     - Other advertisement details.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *   - `apiRootUrl`: The root URL for the API to construct the media URL.
 *
 * @returns An object containing the created advertisement, including:
 *   - `advertisement`: The created advertisement details with the media URL.
 *
 */
export const createAdvertisement: MutationResolvers["createAdvertisement"] =
  async (_parent, args, context) => {
    // Get the current user
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
