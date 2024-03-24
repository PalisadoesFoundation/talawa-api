import { Types } from "mongoose";
import {
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfacePost } from "../../models";
import { AppUserProfile, Organization, Post, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { deletePostFromCache } from "../../services/PostCache/deletePostFromCache";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { deletePreviousImage as deleteImage } from "../../utilities/encodedImageStorage/deletePreviousImage";
import { deletePreviousVideo as deleteVideo } from "../../utilities/encodedVideoStorage/deletePreviousVideo";
/**
 * This function enables to remove a post.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the post exists
 * 3. If the user is the creator of the post.
 * 4. If the user to be removed is a member of the organization.
 * 5. If the user has appUserProfile.
 * @returns Deleted Post.
 */
export const removePost: MutationResolvers["removePost"] = async (
  _parent,
  args,
  context,
) => {
  // Get the currentUser with _id === context.userId exists.
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Get the currentUser with _id === context.userId exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: currentUser._id,
  }).lean();
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

  // Checks whether post exists.
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks whether currentUser is allowed to delete the post or not.
  const isCreator = post.creatorId.equals(context.userId);
  const isSuperAdmin = currentUserAppProfile.isSuperAdmin;
  const isAdminOfPostOrganization = currentUserAppProfile?.adminFor.some(
    (orgID) =>
      orgID && new Types.ObjectId(orgID?.toString()).equals(post?.organization),
  );

  if (!isCreator && !isSuperAdmin && !isAdminOfPostOrganization) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Deletes the post.
  const deletedPost = await Post.findOneAndDelete({
    _id: args.id,
  });

  await deletePostFromCache(args.id);

  //deletes the image in post
  if (deletedPost?.imageUrl) {
    await deleteImage(deletedPost?.imageUrl);
  }

  //deletes the video in post
  if (deletedPost?.videoUrl) {
    await deleteVideo(deletedPost?.videoUrl);
  }

  // Removes the post from the organization, doesn't fail if the post wasn't pinned
  const updatedOrganization = await Organization.findOneAndUpdate(
    {
      _id: post.organization,
    },
    {
      $pull: {
        pinnedPosts: args.id,
      },
    },
    {
      new: true,
    },
  ).lean();

  if (updatedOrganization !== null) {
    await cacheOrganizations([updatedOrganization]);
  }

  // Returns deleted post.
  return post;
};
