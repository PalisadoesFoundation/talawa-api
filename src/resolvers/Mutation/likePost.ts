import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post } from "../../models";
import { errors, requestContext } from "../../libraries";
import { POST_NOT_FOUND_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";

export const likePost: MutationResolvers["likePost"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks whether currentUser with _id == context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const post = await Post.findOne({
    _id: args.id,
  }).lean();

  // Checks whether post exists.
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserHasLikedPost = post.likedBy.some(
    (likedByUser) => likedByUser.toString() === context.userId.toString()
  );

  // Checks whether currentUser with _id === context.userId has not already liked the post.
  if (currentUserHasLikedPost === false) {
    /*
    Adds context.userId to likedBy list and increases likeCount field by 1
    of post's document and returns the updated post.
    */
    return await Post.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        $push: {
          likedBy: context.userId,
        },
        $inc: {
          likeCount: 1,
        },
      },
      {
        new: true,
      }
    ).lean();
  }

  // Returns the post without liking.
  return post;
};
