import {
  EMAIL_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceUser } from "../../models";
import { AppUserProfile, User } from "../../models";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { deleteUserFromCache } from "../../services/UserCache/deleteUserFromCache";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
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
  context,
) => {
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([context.userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: context.userId,
    }).lean();
    if (currentUser !== null) {
      await cacheUsers([currentUser]);
    }
  }

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  if (args.data?.email && args.data?.email !== currentUser?.email) {
    const userWithEmailExists = await User.findOne({
      email: args.data?.email.toLowerCase(),
    });

    if (userWithEmailExists) {
      throw new errors.ConflictError(
        requestContext.translate(EMAIL_ALREADY_EXISTS_ERROR.MESSAGE),
        EMAIL_ALREADY_EXISTS_ERROR.MESSAGE,
        EMAIL_ALREADY_EXISTS_ERROR.PARAM,
      );
    }
  }

  // Upload file
  let uploadImageFileName;
  if (args.file) {
    uploadImageFileName = await uploadEncodedImage(
      args.file,
      currentUser?.image,
    );
  }

  // Update User
  let updatedUser = await User.findOneAndUpdate(
    {
      _id: context.userId,
    },
    {
      $set: {
        address: {
          city: args.data?.address?.city
            ? args.data.address.city
            : currentUser?.address?.city,
          countryCode: args.data?.address?.countryCode
            ? args.data.address.countryCode
            : currentUser?.address?.countryCode,
          dependentLocality: args.data?.address?.dependentLocality
            ? args.data.address.dependentLocality
            : currentUser?.address?.dependentLocality,
          line1: args.data?.address?.line1
            ? args.data.address.line1
            : currentUser?.address?.line1,
          line2: args.data?.address?.line2
            ? args.data.address.line2
            : currentUser?.address?.line2,
          postalCode: args.data?.address?.postalCode
            ? args.data.address.postalCode
            : currentUser?.address?.postalCode,
          sortingCode: args.data?.address?.sortingCode
            ? args.data.address.sortingCode
            : currentUser?.address?.sortingCode,
          state: args.data?.address?.state
            ? args.data.address.state
            : currentUser?.address?.state,
        },
        birthDate: args.data?.birthDate
          ? args.data.birthDate
          : currentUser?.birthDate,
        educationGrade: args.data?.educationGrade
          ? args.data.educationGrade
          : currentUser?.educationGrade,
        email: args.data?.email
          ? args.data.email.toLowerCase()
          : currentUser?.email.toLowerCase(),
        employmentStatus: args.data?.employmentStatus
          ? args.data.employmentStatus
          : currentUser?.employmentStatus,
        firstName: args.data?.firstName
          ? args.data.firstName
          : currentUser?.firstName,
        gender: args.data?.gender ? args.data.gender : currentUser?.gender,
        image: args.file ? uploadImageFileName : currentUser.image,
        lastName: args.data?.lastName
          ? args.data.lastName
          : currentUser?.lastName,
        maritalStatus: args.data?.maritalStatus
          ? args.data.maritalStatus
          : currentUser?.maritalStatus,
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
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();
  if (updatedUser != null) {
    await deleteUserFromCache(updatedUser?._id.toString());
    await cacheUsers([updatedUser]);
  }

  if (args.data?.appLanguageCode) {
    await AppUserProfile.findOneAndUpdate(
      {
        userId: context.userId,
      },
      {
        $set: {
          appLanguageCode: args.data?.appLanguageCode,
        },
      },
    );
  }

  if (args.data == undefined) updatedUser = null;

  return updatedUser ?? ({} as InterfaceUser);
};
