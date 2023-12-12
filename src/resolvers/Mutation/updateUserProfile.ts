import {
  EMAIL_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
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

  if (args.data?.email && args.data?.email !== currentUser?.email) {
    const userWithEmailExists = await User.findOne({
      email: args.data?.email,
    });

    if (userWithEmailExists) {
      throw new errors.ConflictError(
        requestContext.translate(EMAIL_ALREADY_EXISTS_ERROR.MESSAGE),
        EMAIL_ALREADY_EXISTS_ERROR.MESSAGE,
        EMAIL_ALREADY_EXISTS_ERROR.PARAM
      );
    }
  }

  // Upload file
  let uploadImageFileName;
  if (args.file) {
    uploadImageFileName = await uploadEncodedImage(
      args.file,
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
        email: args.data?.email ? args.data.email : currentUser?.email,
        firstName: args.data?.firstName
          ? args.data.firstName
          : currentUser?.firstName,
        lastName: args.data?.lastName
          ? args.data.lastName
          : currentUser?.lastName,
        gender: args.data?.gender ? args.data.gender : currentUser?.gender,
        birthDate: args.data?.birthDate
          ? args.data.birthDate
          : currentUser?.birthDate,
        maritalStatus: args.data?.maritalStatus
          ? args.data.maritalStatus
          : currentUser?.maritalStatus,
        educationGrade: args.data?.educationGrade
          ? args.data.educationGrade
          : currentUser?.educationGrade,
        address: {
          line1: args.data?.address?.line1
            ? args.data.address.line1
            : currentUser?.address?.line1,
          line2: args.data?.address?.line2
            ? args.data.address.line2
            : currentUser?.address?.line2,
          line3: args.data?.address?.line3
            ? args.data.address.line3
            : currentUser?.address?.line3,
          line4: args.data?.address?.line4
            ? args.data.address.line4
            : currentUser?.address?.line4,
        },
        phone: {
          home: args.data?.phone?.home
            ? args.data?.phone?.home
            : currentUser?.phone?.home,
          mobile: args.data?.phone?.mobile
            ? args.data?.phone?.mobile
            : currentUser?.phone?.mobile,
          work: args.data?.phone?.work
            ? args.data?.phone?.work
            : currentUser?.phone?.work,
        },
        employmentStatus: args.data?.employmentStatus
          ? args.data.employmentStatus
          : currentUser?.employmentStatus,
        image: args.file ? uploadImageFileName : currentUser.image,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).lean();
  updatedUser!.image = updatedUser?.image
    ? `${context.apiRootUrl}${updatedUser?.image}`
    : null;

  return updatedUser ?? ({} as InterfaceUser);
};
