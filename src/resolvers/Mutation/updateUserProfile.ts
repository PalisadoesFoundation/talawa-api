import {
  EMAIL_ALREADY_EXISTS,
  EMAIL_ALREADY_EXISTS_CODE,
  EMAIL_ALREADY_EXISTS_MESSAGE,
  EMAIL_ALREADY_EXISTS_PARAM,
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { uploadImage } from "../../utilities";

export const updateUserProfile: MutationResolvers["updateUserProfile"] = async (
  _parent,
  args,
  context
) => {
  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  if (args.data!.email !== undefined) {
    const userWithEmailExists = await User.exists({
      email: args.data?.email?.toLowerCase(),
    });

    if (userWithEmailExists === true) {
      throw new errors.ConflictError(
        IN_PRODUCTION !== true
          ? EMAIL_ALREADY_EXISTS
          : requestContext.translate(EMAIL_ALREADY_EXISTS_MESSAGE),
        EMAIL_ALREADY_EXISTS_CODE,
        EMAIL_ALREADY_EXISTS_PARAM
      );
    }
  } // Upload file
  let uploadImageObj;
  if (args.file) {
    uploadImageObj = await uploadImage(args.file, null);
  }
  const currentUser = await User.findById({
    _id: context.userId,
  });
  // Update User
  if (uploadImageObj) {
    return await User.findOneAndUpdate(
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
          image: uploadImageObj.imageAlreadyInDbPath
            ? uploadImageObj.imageAlreadyInDbPath
            : uploadImageObj.newImagePath,
        },
      },
      {
        new: true,
      }
    ).lean();
  } else {
    return await User.findOneAndUpdate(
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
        },
      },
      {
        new: true,
      }
    ).lean();
  }
};
