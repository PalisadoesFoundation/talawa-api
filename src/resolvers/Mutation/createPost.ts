import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { cachePosts } from "../../services/PostCache/cachePosts";
/**
 * This function enables to create a post.
 * @param _parent - parent of current request
 * @param args -  payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * @returns Created Post
 */
export const createPost: MutationResolvers["createPost"] = async (
  _parent,
  args,
  context
) => {
  // Get the current user
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.data.organizationId,
    }).lean();

    await cacheOrganizations([organization!]);
  }

  // Checks whether organization with _id == args.data.organizationId exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  let uploadImageFileName = null;
  let uploadVideoFileName = null;

  if (args.file) {
    const dataUrlPrefix = "data:";
    if (args.file.startsWith(dataUrlPrefix + "image/")) {
      uploadImageFileName = await uploadEncodedImage(args.file, null);
    } else if (args.file.startsWith(dataUrlPrefix + "video/")) {
      uploadVideoFileName = await uploadEncodedVideo(args.file, null);
    } else {
      throw new Error("Unsupported file type.");
    }
  }

  // Checks if the recieved arguments are valid according to standard input norms
  if (args.data?.title && args.data?.text) {
    const validationResultTitle = isValidString(args.data?.title, 256);
    const validationResultText = isValidString(args.data?.text, 500);
    if (!validationResultTitle.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`
        ),
        LENGTH_VALIDATION_ERROR.CODE
      );
    }
    if (!validationResultText.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`
        ),
        LENGTH_VALIDATION_ERROR.CODE
      );
    }
  }

  if (args.data.pinned) {
    // Check if the user has privileges to pin the post
    const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
      (organizationId) => organizationId.equals(args.data.organizationId)
    );
    if (currentUser?.userType) {
      if (
        !(currentUser?.userType === "SUPERADMIN") &&
        !currentUserIsOrganizationAdmin
      ) {
        throw new errors.UnauthorizedError(
          requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE),
          USER_NOT_AUTHORIZED_TO_PIN.CODE,
          USER_NOT_AUTHORIZED_TO_PIN.PARAM
        );
      }
    }
  }

  // Creates new post
  const createdPost = await Post.create({
    ...args.data,
    pinned: args.data.pinned ? true : false,
    createdBy: context.userId,
    organization: args.data.organizationId,
    imageUrl: uploadImageFileName,
    videoUrl: uploadVideoFileName,
  });

  if (createdPost !== null) {
    await cachePosts([createdPost]);
  }

  if (args.data.pinned) {
    // Add the post to pinnedPosts of the organization
    const updatedOrganizaiton = await Organization.findOneAndUpdate(
      { _id: args.data.organizationId },
      {
        $set: {
          updatedBy: context.userId,
        },
        $push: {
          pinnedPosts: createdPost._id,
        },
      },
      {
        new: true,
      }
    );

    await cacheOrganizations([updatedOrganizaiton!]);
  }

  // Returns createdPost.
  return {
    ...createdPost.toObject(),
    imageUrl: uploadImageFileName
      ? `${context.apiRootUrl}${uploadImageFileName}`
      : null,
    videoUrl: uploadVideoFileName
      ? `${context.apiRootUrl}${uploadVideoFileName}`
      : null,
  };
};
