import mongoose from "mongoose";
import {
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  PLEASE_PROVIDE_TITLE,
  POST_NEEDS_TO_BE_PINNED,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { isValidString } from "../../libraries/validators/validateString";
import type {
  InterfaceAppUserProfile,
  InterfaceOrganization,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Organization, Post, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";

/**
 * Creates a new post and associates it with an organization.
 *
 * This function performs the following actions:
 * 1. Verifies the existence of the current user and retrieves their details and application profile.
 * 2. Checks if the specified organization exists and retrieves its details.
 * 3. Validates that the user is a member of the organization or is a super admin.
 * 4. Handles file uploads for images and videos, if provided.
 * 5. Validates the post title and ensures it meets the criteria for pinning.
 * 6. Checks user permissions to pin the post if required.
 * 7. Creates the post and updates the organization with the pinned post if applicable.
 * 8. Caches the newly created post and organization.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.organizationId`: The ID of the organization where the post will be created.
 *   - `data.title`: The title of the post (optional but required if the post is pinned).
 *   - `data.text`: The text content of the post.
 *   - `data.pinned`: A boolean indicating whether the post should be pinned.
 *   - `file`: An optional base64-encoded image or video file.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user creating the post.
 *   - `apiRootUrl`: The root URL of the API for constructing file URLs.
 *
 * @returns The created post object, including URLs for uploaded image and video files if provided.
 *
 * @see User - The User model used to interact with user data in the database.
 * @see AppUserProfile - The AppUserProfile model used to interact with user profile data in the database.
 * @see Organization - The Organization model used to interact with organization data in the database.
 * @see Post - The Post model used to interact with post data in the database.
 * @see uploadEncodedImage - A utility function for uploading encoded image files.
 * @see uploadEncodedVideo - A utility function for uploading encoded video files.
 */
export const createPost: MutationResolvers["createPost"] = async (
  _parent,
  args,
  context,
) => {
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

  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    args.data.organizationId,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: args.data.organizationId,
    }).lean();

    await cacheOrganizations([organization as InterfaceOrganization]);
  }

  // Checks whether organization with _id == args.data.organizationId exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const isSuperAdmin = currentUserAppProfile.isSuperAdmin;
  const currentUserIsOrganizationMember = organization.members.some(
    (memberId) =>
      new mongoose.Types.ObjectId(memberId?.toString()).equals(context.userId),
  );

  if (!currentUserIsOrganizationMember && !isSuperAdmin) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE),
      USER_NOT_MEMBER_FOR_ORGANIZATION.CODE,
      USER_NOT_MEMBER_FOR_ORGANIZATION.PARAM,
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

  // Check title and pinpost
  if (args.data?.title && !args.data.pinned) {
    throw new errors.InputValidationError(
      requestContext.translate(POST_NEEDS_TO_BE_PINNED.MESSAGE),
      POST_NEEDS_TO_BE_PINNED.CODE,
    );
  } else if (!args.data?.title && args.data.pinned) {
    throw new errors.InputValidationError(
      requestContext.translate(PLEASE_PROVIDE_TITLE.MESSAGE),
      PLEASE_PROVIDE_TITLE.CODE,
    );
  }

  // Checks if the received arguments are valid according to standard input norms
  if (args.data?.title && args.data?.text) {
    const validationResultTitle = isValidString(args.data?.title, 256);
    const validationResultText = isValidString(args.data?.text, 500);
    if (!validationResultTitle.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
        ),
        LENGTH_VALIDATION_ERROR.CODE,
      );
    }
    if (!validationResultText.isLessThanMaxLength) {
      throw new errors.InputValidationError(
        requestContext.translate(
          `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`,
        ),
        LENGTH_VALIDATION_ERROR.CODE,
      );
    }
  }

  if (args.data.pinned) {
    // Check if the user has privileges to pin the post
    const currentUserIsOrganizationAdmin = currentUserAppProfile.adminFor.some(
      (organizationId) =>
        new mongoose.Types.ObjectId(organizationId?.toString()).equals(
          args.data.organizationId,
        ),
    );

    if (
      !(currentUserAppProfile.isSuperAdmin || currentUserIsOrganizationAdmin)
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE),
        USER_NOT_AUTHORIZED_TO_PIN.CODE,
        USER_NOT_AUTHORIZED_TO_PIN.PARAM,
      );
    }
  }

  // Creates new post
  const createdPost = await Post.create({
    ...args.data,
    pinned: args.data.pinned ? true : false,
    creatorId: context.userId,
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
        $push: {
          pinnedPosts: createdPost._id,
        },
      },
      {
        new: true,
      },
    );

    await cacheOrganizations([updatedOrganizaiton as InterfaceOrganization]);
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
