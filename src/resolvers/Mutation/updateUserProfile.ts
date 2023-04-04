import {
  EMAIL_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
/**
 * This function enables to update user profile.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * @returns Updated user profile.
 */
export const updateUserProfile: MutationResolvers["updateUserProfile"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  if (args.input.data!.email !== undefined) {
    const userWithEmailExists = await User.find({
      email: args.input.data?.email?.toLowerCase(),
    });
    if (
      userWithEmailExists.length > 0 &&
      userWithEmailExists[0]._id.toString() !== context.userId.toString()
    ) {
      throw new errors.ConflictError(
        requestContext.translate(EMAIL_ALREADY_EXISTS_ERROR.MESSAGE),
        EMAIL_ALREADY_EXISTS_ERROR.MESSAGE,
        EMAIL_ALREADY_EXISTS_ERROR.PARAM
      );
    }
  }

  // Upload newUserProfileImage
  let uploadImageFileName;
  if (args.input.newUserProfileImage) {
    uploadImageFileName = await uploadEncodedImage(
      args.input.newUserProfileImage,
      currentUser?.image
    );
  }

  // Update User
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: context.userId,
    },
    {
      $set: {
        email: args.input.data?.email
          ? args.input.data.email
          : currentUser?.email,
        firstName: args.input.data?.firstName
          ? args.input.data.firstName
          : currentUser?.firstName,
        lastName: args.input.data?.lastName
          ? args.input.data.lastName
          : currentUser?.lastName,
        image: args.input.newUserProfileImage
          ? uploadImageFileName
          : currentUser.image,
      },
    },
    {
      new: true,
    }
  ).lean();
  updatedUser!.image = updatedUser?.image
    ? `${context.apiRootUrl}${updatedUser?.image}`
    : null;

  return updatedUser!;
};
