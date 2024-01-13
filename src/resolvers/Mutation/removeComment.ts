import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceComment } from "../../models";
import { User, Post, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_ERROR,
  COMMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import { findCommentsInCache } from "../../services/CommentCache/findCommentsInCache";
import { deleteCommentFromCache } from "../../services/CommentCache/deleteCommentFromCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { storeTransaction } from "../../utilities/storeTransaction";

/**
 * This function enables to remove a comment.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the comment exists.
 * 3. If the user is the creator of the organization.
 * @returns Deleted comment.
 */

export const removeComment: MutationResolvers["removeComment"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  let comment: InterfaceComment;

  const commentsFoundInCache = await findCommentsInCache([args.id]);

  if (commentsFoundInCache[0] == null) {
    comment = await Comment.findOne({
      _id: args.id,
    })
      .populate("postId")
      .lean();
  } else {
    comment = commentsFoundInCache[0];
  }

  // Checks whether comment exists.
  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_ERROR.MESSAGE),
      COMMENT_NOT_FOUND_ERROR.CODE,
      COMMENT_NOT_FOUND_ERROR.PARAM
    );
  }

  const isCurrentUserAdminOfOrganization = currentUser.adminFor.some(
    (organization) => organization.equals(comment.postId.organization)
  );

  // Checks whether currentUser with _id === context.userId has the authorization to delete the comment
  if (
    currentUser.userType !== "SUPERADMIN" &&
    !isCurrentUserAdminOfOrganization &&
    comment.creatorId.toString() !== context.userId
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Reduce the commentCount by 1 of the post with _id === commentPost.postId

  const updatedPost = await Post.findOneAndUpdate(
    {
      _id: comment!.postId._id,
    },
    {
      $inc: {
        commentCount: -1,
      },
    },
    {
      new: true,
    }
  ).lean();
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "Post",
    `Post:${comment!.postId._id} updated commentCount`
  );

  if (updatedPost !== null) {
    await cachePosts([updatedPost]);
  }

  // Deletes the comment
  await Comment.deleteOne({
    _id: comment._id,
  });
  await storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.DELETE,
    "Comment",
    `Comment:${comment._id} deleted`
  );

  await deleteCommentFromCache(comment);

  // Replace the populated postId in comment object with just the id
  comment.postId = comment.postId._id;

  return comment;
};
