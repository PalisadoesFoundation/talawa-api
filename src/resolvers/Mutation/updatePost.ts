import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Post } from "../../models";
import {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_PARAM,
  REGEX_VALIDATION_ERROR,
  LENGTH_VALIDATION_ERROR,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";

export const updatePost: MutationResolvers["updatePost"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // checks if current user exists
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const post = await Post.findOne({
    _id: args.id,
  }).lean();

  // checks if there exists a post with _id === args.id
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }

  const currentUserIsPostCreator =
    post.creator.toString() === context.userId.toString();

  // checks if current user is an creator of the post with _id === args.id
  if (currentUserIsPostCreator === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResult_Title = isValidString(args.data!.title!, 256);
  const validationResult_Text = isValidString(args.data!.text!, 500);
  if (!validationResult_Title.isFollowingPattern) {
    throw new errors.InputValidationError(
      requestContext.translate(`${REGEX_VALIDATION_ERROR.message} in title`),
      REGEX_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Title.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 256 characters in title`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Text.isFollowingPattern) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${REGEX_VALIDATION_ERROR.message} in information`
      ),
      REGEX_VALIDATION_ERROR.code
    );
  }
  if (!validationResult_Text.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.message} 500 characters in information`
      ),
      LENGTH_VALIDATION_ERROR.code
    );
  }

  return await Post.findOneAndUpdate(
    {
      _id: args.id,
    },
    // @ts-ignore
    {
      ...args.data,
    },
    {
      new: true,
    }
  ).lean();
};
