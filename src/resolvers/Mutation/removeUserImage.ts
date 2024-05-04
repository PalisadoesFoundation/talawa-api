import {
  USER_NOT_FOUND_ERROR,
  USER_PROFILE_IMAGE_NOT_FOUND_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import type { InterfaceUser } from "../../models";
import { deleteImage } from "../../utilities";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
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

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Checks whether currentUser.image already doesn't exist.
  console.log(currentUser.image);
  if (!currentUser.image) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_PROFILE_IMAGE_NOT_FOUND_ERROR.MESSAGE),
      USER_PROFILE_IMAGE_NOT_FOUND_ERROR.MESSAGE,
      USER_PROFILE_IMAGE_NOT_FOUND_ERROR.PARAM,
    );
  }

  await deleteImage(currentUser.image);

  // Sets image field to null for currentUser and returns the updated currentUser.
  return (await User.findOneAndUpdate(
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
    },
  ).lean()) as InterfaceUser;
};
