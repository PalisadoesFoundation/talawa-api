import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { User } from "../../models";
import type { InterfaceUser } from "../../models/User";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { uploadEncodedImage } from "../../utilities/encodedImageStorage/uploadEncodedImage";

/**
 * Mutation resolver function to add or update a user's profile image.
 *
 * This function performs the following actions:
 * 1. Retrieves the current user from the cache or database based on the `userId` from the context.
 * 2. Checks if the current user exists. If not, throws a not found error.
 * 3. Uploads the provided encoded image file and updates the user's profile image with the new file path.
 * 4. Updates the user document in the database with the new image information.
 * 5. Caches the updated user data.
 *
 * @param _parent - The parent object for the mutation. Typically, this is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `file`: The encoded image file to be uploaded.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the updated user document with the new image.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 * @see uploadEncodedImage - Utility function to handle the upload of an encoded image file.
 * @see cacheUsers - Service function to cache the updated user data.
 * @see findUserInCache - Service function to retrieve users from cache.
 *
 * @remarks
 * The function first attempts to retrieve the user from the cache using `findUserInCache`.
 * If the user is not found in the cache, it queries the database.
 * It then performs the image upload and updates the user's profile image before saving the changes to the database.
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
