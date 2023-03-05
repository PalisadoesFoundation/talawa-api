import {
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Comment } from "../../models";

export const unlikeComment: MutationResolvers["unlikeComment"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const comment = await Comment.findOne({
    _id: args.id,
  }).lean();

  if (!comment) {
    throw new errors.NotFoundError(
      requestContext.translate(COMMENT_NOT_FOUND_MESSAGE),
      COMMENT_NOT_FOUND_CODE,
      COMMENT_NOT_FOUND_PARAM
    );
  }

  const currentUserHasLikedComment = comment.likedBy.some(
    (liker) => liker.toString() === context.userId.toString()
  );

  if (currentUserHasLikedComment === true) {
    return await Comment.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $pull: {
          likedBy: context.userId,
        },
        $inc: {
          likeCount: -1,
        },
      },
      {
        new: true,
      }
    ).lean();
  }

  return comment;
};
