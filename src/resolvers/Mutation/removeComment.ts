import { Types } from "mongoose";
import {
  COMMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceComment,
  InterfaceUser,
} from "../../models";
import { AppUserProfile, Comment, Post, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { deleteCommentFromCache } from "../../services/CommentCache/deleteCommentFromCache";
import { findCommentsInCache } from "../../services/CommentCache/findCommentsInCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function enables to remove a comment.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the comment exists.
 * 3. If the user is the creator of the organization.
 * 4. If the user has appUserProfile
 * @returns Deleted comment.
 */

export const removeComment: MutationResolvers["removeComment"] = async (
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
  // Checks whether currentUser with _id === context.userId exists.
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
  let comment: InterfaceComment;

  const commentsFoundInCache = await findCommentsInCache([args.id]);

  if (commentsFoundInCache[0] == null) {
    comment = (await Comment.findOne({
      _id: args.id,
    })
      .populate("postId")
      .lean()) as InterfaceComment;
  } else {
    comment = commentsFoundInCache[0];
  }

  // Checks whether comment exists.
  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM,
    );
  }

  const isCurrentUserAdminOfOrganization = currentUserAppProfile.adminFor.some(
    (organization) =>
      organization &&
      new Types.ObjectId(organization.toString()).equals(
        comment.postId.organization,
      ),
  );

  // Checks whether currentUser with _id === context.userId has the authorization to delete the comment
  if (
    !currentUserAppProfile.isSuperAdmin &&
    !isCurrentUserAdminOfOrganization &&
    comment.creatorId.toString() !== context.userId
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Reduce the commentCount by 1 of the post with _id === commentPost.postId

  const updatedPost = await Post.findOneAndUpdate(
    {
      _id: comment.postId._id,
    },
    {
      $inc: {
        commentCount: -1,
      },
    },
    {
      new: true,
    },
  ).lean();

  if (updatedPost !== null) {
    await cachePosts([updatedPost]);
  }

  // Deletes the comment
  await Comment.deleteOne({
    _id: comment._id,
  });

  await deleteCommentFromCache(comment);

  // Replace the populated postId in comment object with just the id
  comment.postId = comment.postId._id;

  return comment;
};
