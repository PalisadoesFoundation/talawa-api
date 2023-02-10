import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { uploadImage } from "../../utilities";
import { User } from "../../models";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";

export const addUserImage: MutationResolvers["addUserImage"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  // Checks whether currentUser exists.
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const imageToUpload = await uploadImage(args.file, currentUser.image!);

  // Updates the user with new image and returns the updated user.
  return await User.findOneAndUpdate(
    {
      _id: currentUser._id,
    },
    {
      $set: {
        image: imageToUpload.imageAlreadyInDbPath
          ? imageToUpload.imageAlreadyInDbPath
          : imageToUpload.newImagePath,
      },
    },
    {
      new: true,
    }
  ).lean();
};
