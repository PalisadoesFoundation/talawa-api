import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  COMMENT_NOT_FOUND,
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
} from "../../constants";

export const removeComment: MutationResolvers["removeComment"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const comment = await Comment.findOne({
    _id: args.id,
  }).lean();

  // Checks whether comment exists.
  if (!comment) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? COMMENT_NOT_FOUND
        : requestContext.translate(COMMENT_NOT_FOUND_MESSAGE),
      COMMENT_NOT_FOUND_CODE,
      COMMENT_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is not the creator of comment.
  if (comment.creator.toString() !== context.userId.toString()) {
    throw new errors.UnauthorizedError(
      IN_PRODUCTION !== true
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  /*
  Removes comment._id from comments list and reduces commentCount
  by 1 of post with _id === comment.post
  */
  await Post.updateOne(
    {
      _id: comment.post,
    },
    {
      $pull: {
        comments: comment._id,
      },
      $inc: {
        commentCount: -1,
      },
    }
  );

  // Deletes the comment.
  await Comment.deleteOne({
    _id: comment._id,
  });

  // Returns the deleted comment.
  return comment;
};
