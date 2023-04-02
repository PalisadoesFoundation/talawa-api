import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Post } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  POST_NOT_FOUND_ERROR,
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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const post = await Post.findOne({
    _id: args.input.id,
  }).lean();

  // checks if there exists a post with _id === args.id
  if (!post) {
    throw new errors.NotFoundError(
      requestContext.translate(POST_NOT_FOUND_ERROR.MESSAGE),
      POST_NOT_FOUND_ERROR.CODE,
      POST_NOT_FOUND_ERROR.PARAM
    );
  }

  const currentUserIsPostCreator =
    post.creator.toString() === context.userId.toString();

  // checks if current user is an creator of the post with _id === args.id
  if (currentUserIsPostCreator === false) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResult_Title = isValidString(args.input!.title!, 256);
  const validationResult_Text = isValidString(args.input!.text!, 500);
  if (!validationResult_Title.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`
      ),
      LENGTH_VALIDATION_ERROR.CODE
    );
  }
  if (!validationResult_Text.isLessThanMaxLength) {
    throw new errors.InputValidationError(
      requestContext.translate(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 500 characters in information`
      ),
      LENGTH_VALIDATION_ERROR.CODE
    );
  }

  return await Post.findOneAndUpdate(
    {
      _id: args.input.id,
    },
    // @ts-ignore
    {
      ...args.input,
    },
    {
      new: true,
    }
  ).lean();
};
