import {
  NOTE_NOT_FOUND_ERROR,
  UNAUTHORIZED_REMOVE_NOTE_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../models";
import { NoteModel, AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";

/**
 * This function deletes a note.
 * @param _parent - parent of the current request
 * @param args - payload provided with the request
 * @param context - context of the entire application
 * @returns ID of the deleted note.
 * @throws NotFoundError if the user or note is not found
 * @throws UnauthorizedError if the user is not the creator of the note.
 */
export const deleteNote: MutationResolvers["deleteNote"] = async (
  _parent,
  args,
  context,
): Promise<string> => {
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
    throw new errors.UnauthenticatedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  const note = await NoteModel.findOne({
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
      requestContext.translate(UNAUTHORIZED_REMOVE_NOTE_ERROR.MESSAGE),
      UNAUTHORIZED_REMOVE_NOTE_ERROR.CODE,
      UNAUTHORIZED_REMOVE_NOTE_ERROR.PARAM,
    );
  }

  // Delete the note from the database
  await NoteModel.deleteOne({ _id: args.id });

  /*
        Remove note._id from appropriate lists
        on agendaItem's document.
        */
  await User.updateOne(
    {
      _id: note.agendaItemId,
    },
    {
      $pull: {
        notes: note._id,
      },
    },
  );

  return note._id.toString();
};
