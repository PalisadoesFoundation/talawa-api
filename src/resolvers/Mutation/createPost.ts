import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, Post, Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
} from "../../constants";
import { isValidString } from "../../libraries/validators/validateString";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
/**
 * This function enables to create a post.
 * @param _parent - parent of current request
 * @param args -  payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists
 * 2. If the organization exists
 * @returns Created Post
 */
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
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const organizationExists = await Organization.exists({
    _id: args.input.data.organizationId,
  });

  // Checks whether organization with _id == args.input.data.organizationId exists.
  if (organizationExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
    );
  }

  let uploadImageFileName;

  if (args.input.postImage) {
    uploadImageFileName = await uploadEncodedImage(args.input.postImage!, null);
  }

  // Checks if the recieved arguments are valid according to standard input norms
  const validationResult_Title = isValidString(args.input.data!.title!, 256);
  const validationResult_Text = isValidString(args.input.data!.text, 500);
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

  if (args.input.data.pinned) {
    // Check if the user has privileges to pin the post
    const currentUserIsOrganizationAdmin = currentUser.adminFor.some(
      (organizationId) =>
        organizationId.toString() === args.input.data.organizationId
    );

    if (
      !(currentUser!.userType === "SUPERADMIN") &&
      !currentUserIsOrganizationAdmin
    ) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE),
        USER_NOT_AUTHORIZED_TO_PIN.CODE,
        USER_NOT_AUTHORIZED_TO_PIN.PARAM
      );
    }
  }

  // Creates new post
  const createdPost = await Post.create({
    ...args.input.data,
    pinned: args.input.data.pinned ? true : false,
    creator: context.userId,
    organization: args.input.data.organizationId,
    imageUrl: args.input.postImage ? uploadImageFileName : null,
  });

  if (args.input.data.pinned) {
    // Add the post to pinnedPosts of the organization
    await Organization.updateOne(
      { _id: args.input.data.organizationId },
      {
        $push: {
          pinnedPosts: createdPost._id,
        },
      }
    );
  }

  // Returns createdPost.
  return {
    ...createdPost.toObject(),
    imageUrl: createdPost.imageUrl
      ? `${context.apiRootUrl}${uploadImageFileName}`
      : null,
  };
};
