import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Comment } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";

export const createComment: MutationResolvers["createComment"] = async (
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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Creates new comment.
  const createdComment = await Comment.create({
    ...args.data,
    creator: context.userId,
    post: args.postId,
  });

  /*
  Adds createdComment._id to comments list and increases commentCount by 1
  on post's document with _id === args.postId.
  */
  await Post.updateOne(
    {
      _id: args.postId,
    },
    {
      $push: {
        comments: createdComment._id,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );

  // Returns the createdComment.
  return createdComment.toObject();
};
