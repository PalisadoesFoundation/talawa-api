import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Organization } from "../../models";
import { uploadImage } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  REGEX_VALIDATION_ERROR,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";

export const createPost: MutationResolvers["createPost"] = async (
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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const organizationExists = await Organization.exists({
    _id: args.data.organizationId,
  });

  // Checks whether organization with _id == args.data.organizationId exists.
  if (organizationExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  let uploadImageObj;

  if (args.file) {
    uploadImageObj = await uploadImage(args.file, "");
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResult_Title = isValidString(args.data!.title!, 256);
  const validationResult_Text = isValidString(args.data!.text, 500);
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

  // Creates new post.
  const createdPost = await Post.create({
    ...args.data,
    creator: context.userId,
    organization: args.data.organizationId,
    imageUrl: args.file ? uploadImageObj?.newImagePath : null,
  });

  // Returns createdPost.
  return createdPost.toObject();
};
