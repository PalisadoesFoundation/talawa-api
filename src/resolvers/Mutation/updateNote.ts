import {
  NOTE_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  UNAUTHORIZED_UPDATE_NOTE_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceNote,
  InterfaceAppUserProfile,
  InterfaceUser,
} from "../../models";
import { NoteModel, AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Updates an existing note in the system.
 *
 * This function updates a specific note in the database. It first checks if the current user
 * exists and if they have the proper profile. Then it verifies if the note exists and whether
 * the current user is authorized to update it. If all checks pass, the function updates the note
 * with the provided data.
 *
 * The function performs the following steps:
 * 1. Retrieves the current user from the cache or database.
 * 2. Verifies if the current user exists.
 * 3. Retrieves the current user's profile from the cache or database.
 * 4. Checks if the user has the necessary authorization to update the note.
 * 5. Finds the note to be updated in the database.
 * 6. Verifies that the note belongs to the current user.
 * 7. Updates the note with the new data provided.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, including the ID of the note to be updated and the new data.
 * @param context - The context of the request, containing information about the currently authenticated user.
 *
 * @returns  The updated note.
 */

export const updateNote: MutationResolvers["updateNote"] = async (
  _parent,
  args,
  context,
): Promise<InterfaceNote> => {
  const userId = context.userId;

  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([userId]);
  currentUser = userFoundInCache[0];
  if (currentUser === null) {
    currentUser = await User.findOne({
      _id: userId,
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

  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const note: InterfaceNote | null = await NoteModel.findOne({
    _id: args.id,
  }).lean();

  if (!note) {
    throw new errors.NotFoundError(
      requestContext.translate(NOTE_NOT_FOUND_ERROR.MESSAGE),
      NOTE_NOT_FOUND_ERROR.CODE,
      NOTE_NOT_FOUND_ERROR.PARAM,
    );
  }
  if (note.createdBy?.toString() !== currentUser._id.toString()) {
    throw new errors.UnauthorizedError(
      requestContext.translate(UNAUTHORIZED_UPDATE_NOTE_ERROR.MESSAGE),
      UNAUTHORIZED_UPDATE_NOTE_ERROR.CODE,
      UNAUTHORIZED_UPDATE_NOTE_ERROR.PARAM,
    );
  }

  const updatedNote = await NoteModel.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.data as unknown as InterfaceNote),
    },
    {
      new: true,
    },
  ).lean();

  return updatedNote as InterfaceNote;
};
