import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import type { InterfaceUser } from "../../models/User";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";
/**
 * This function adds User Image.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the current user exists
 * @returns Updated User
 */
export const addUserImage: MutationResolvers["addUserImage"] = async (
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
  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }

  const imageToUploadFilePath = await uploadEncodedImage(
    args.file,
    currentUser.image,
  );

  // Updates the user with new image and returns the updated user.
  return (await User.findOneAndUpdate(
    {
      _id: currentUser._id,
    },
    {
      $set: {
        image: imageToUploadFilePath,
      },
    },
    {
      new: true,
    },
  ).lean()) as InterfaceUser;
};
