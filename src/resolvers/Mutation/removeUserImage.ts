import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
  USER_PROFILE_IMAGE_NOT_FOUND_MESSAGE,
  USER_PROFILE_IMAGE_NOT_FOUND_PARAM,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import { deleteImage } from "../../utilities";

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
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser.image already doesn't exist.
  if (!currentUser.image) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_PROFILE_IMAGE_NOT_FOUND_MESSAGE),
      USER_PROFILE_IMAGE_NOT_FOUND_MESSAGE,
      USER_PROFILE_IMAGE_NOT_FOUND_PARAM
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
