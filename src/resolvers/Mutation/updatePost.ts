import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfacePost } from "../../models";
import { Post } from "../../models";
import {
  USER_NOT_AUTHORIZED_ERROR,
  POST_NOT_FOUND_ERROR,
  LENGTH_VALIDATION_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";
import { findPostsInCache } from "../../services/PostCache/findPostsInCache";
import { cachePosts } from "../../services/PostCache/cachePosts";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
import { uploadEncodedVideo } from "../../utilities/encodedVideoStorage/uploadEncodedVideo";
import { storeTransaction } from "../../utilities/storeTransaction";

export const updatePost: MutationResolvers["updatePost"] = async (
  _parent,
  args,
  context
) => {
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

  // checks if there exists a post with _id === args.id
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserIsPostCreator = post.creator.equals(context.userId);

  // checks if current user is an creator of the post with _id === args.id
  if (currentUserIsPostCreator === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  if (args.data?.imageUrl && args.data?.imageUrl !== null) {
    args.data.imageUrl = await uploadEncodedImage(
      args.data.imageUrl,
      post.imageUrl
    );
  }

  if (args.data?.videoUrl && args.data?.videoUrl !== null) {
    args.data.videoUrl = await uploadEncodedVideo(
      args.data.videoUrl,
      post.videoUrl
    );
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResultTitle = isValidString(args.data?.title ?? "", 256);
  const validationResultText = isValidString(args.data?.text ?? "", 500);
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

  const updatedPost = await Post.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as any),
    },
    {
      new: true,
    }
  ).lean();
  storeTransaction(
    context.userId,
    TRANSACTION_LOG_TYPES.UPDATE,
    "Post",
    `Post:${args.id} updated`
  );

  if (updatedPost !== null) {
    await cachePosts([updatedPost]);
  }

  return updatedPost!;
};
