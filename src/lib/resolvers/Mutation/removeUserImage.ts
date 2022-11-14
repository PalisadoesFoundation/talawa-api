import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { deleteImage } from "../../utilities";
/**
 * This function enables to remove user image.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the user exists.
 * 2. If the image exists
 * @returns Updated user.
 */
export const removeUserImage: MutationResolvers["removeUserImage"] = async (
  _parent,
  _args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser.image already doesn't exist.
  if (!currentUser.image) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? "User profile image not found"
        : requestContext.translate("user.profileImage.notFound"),
      "user.profileImage.notFound",
      "userProfileImage"
    );
  }

  await deleteImage(currentUser.image);

  // Sets image field to null for currentUser and returns the updated currentUser.
  return await User.findOneAndUpdate(
    {
      _id: currentUser._id,
    },
    {
      $set: {
        image: null,
      },
    },
    {
      new: true,
    }
  ).lean();
};
