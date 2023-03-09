import {
  EMAIL_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";

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

  if (args.data!.email !== undefined) {
    const userWithEmailExists = await User.exists({
      email: args.data?.email?.toLowerCase(),
    });

    if (userWithEmailExists === true) {
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
  if (uploadImageFileName) {
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
          image: uploadImageFileName,
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
