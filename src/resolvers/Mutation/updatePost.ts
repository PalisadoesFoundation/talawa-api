import { Types } from "mongoose";
import {
  LENGTH_VALIDATION_ERROR,
  PLEASE_PROVIDE_TITLE,
  POST_NEEDS_TO_BE_PINNED,
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { isValidString } from "../../libraries/validators/validateString";
import type {
  InterfaceAppUserProfile,
  InterfacePost,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Post, User } from "../../models";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";

/**
 * Updates a post with new details, including handling image and video URL uploads and validating input fields.
 *
 * This function updates an existing post based on the provided input. It retrieves and validates the current user and their app profile, checks if the user has the necessary permissions, handles media file uploads, and performs input validation before updating the post in the database. The function returns the updated post after applying changes.
 *
 * @param _parent - This parameter represents the parent resolver in the GraphQL schema and is not used in this function.
 * @param args - The arguments passed to the GraphQL mutation, including the post's `id` and data to update, such as `title`, `text`, `imageUrl`, and `videoUrl`.
 * @param context - Provides contextual information, including the current user's ID. This is used to authenticate and authorize the request.
 *
 * @returns The updated post with all its fields.
 */
export const updatePost: MutationResolvers["updatePost"] = async (
  _parent,
  args,
  context,
) => {
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

  let post: InterfacePost | null;

  const postFoundInCache = await findPostsInCache([args.id]);

  post = postFoundInCache[0];

  if (postFoundInCache[0] === null) {
    post = await Post.findOne({
      _id: args.id,
    }).lean();
    if (post !== null) {
      await cachePosts([post]);
    }
  }

  // Check if the post exists
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the user has the right to update the post
  const currentUserIsPostCreator = post.creatorId.equals(context.userId);
  const isSuperAdmin = currentUserAppProfile.isSuperAdmin;
  const isAdminOfPostOrganization = currentUserAppProfile?.adminFor.some(
    (orgID) =>
      orgID && new Types.ObjectId(orgID?.toString()).equals(post?.organization),
  );

  // checks if current user is an creator of the post with _id === args.id
  if (
    !currentUserIsPostCreator &&
    !isAdminOfPostOrganization &&
    !isSuperAdmin
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Handle image and video URL uploads
  if (args.data?.imageUrl && args.data?.imageUrl !== null) {
    args.data.imageUrl = await uploadEncodedImage(
      args.data.imageUrl,
      post.imageUrl,
    );
  }

  if (args.data?.videoUrl && args.data?.videoUrl !== null) {
    args.data.videoUrl = await uploadEncodedVideo(
      args.data.videoUrl,
      post.videoUrl,
    );
  }

  // Validate title and pinned status
  if (args.data?.title && !post.pinned) {
    throw new errors.InputValidationError(
      requestContext.translate(POST_NEEDS_TO_BE_PINNED.MESSAGE),
      POST_NEEDS_TO_BE_PINNED.CODE,
    );
  } else if (!args.data?.title && post.pinned) {
    throw new errors.InputValidationError(
      requestContext.translate(PLEASE_PROVIDE_TITLE.MESSAGE),
      PLEASE_PROVIDE_TITLE.CODE,
    );
  }

  // Validate input lengths
  const validationResultTitle = isValidString(args.data?.title ?? "", 256);
  const validationResultText = isValidString(args.data?.text ?? "", 500);
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

  // Update the post in the database
  const updatedPost = await Post.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as Record<string, unknown>),
    },
    {
      new: true,
    },
  ).lean();

  if (updatedPost !== null) {
    await cachePosts([updatedPost]);
  }

  return updatedPost as InterfacePost;
};
