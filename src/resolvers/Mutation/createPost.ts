import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Organization } from "../../models";
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
  USER_NOT_AUTHORIZED_TO_PIN,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";

export const createPost: MutationResolvers["createPost"] = async (
  _parent,
  args,
  context
) => {
  // Get the current user
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
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

  let uploadImageFileName;

  if (args.file) {
    uploadImageFileName = await uploadEncodedImage(args.file!, null);
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

  if (args.data.pinned) {
    // Check if the user has privileges to pin the post
    const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
      (organizationId) => organizationId.toString() === args.data.organizationId
    );

    if (
      !(currentUser!.userType === "SUPERADMIN") &&
      !currentUserIsOrganizationAdmin
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.message),
        USER_NOT_AUTHORIZED_TO_PIN.code,
        USER_NOT_AUTHORIZED_TO_PIN.param
      );
    }
  }

  // Creates new post
  const createdPost = await Post.create({
    ...args.data,
    pinned: args.data.pinned ? true : false,
    creator: context.userId,
    organization: args.data.organizationId,
    imageUrl: args.file ? uploadImageFileName : null,
  });

  if (args.data.pinned) {
    // Add the post to pinnedPosts of the organization
    await Organization.updateOne(
      { _id: args.data.organizationId },
      {
        $push: {
          pinnedPosts: createdPost._id,
        },
      }
    );
  }

  // Returns createdPost.
  return createdPost.toObject();
};
