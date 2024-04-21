import {
  NOTE_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
 UNAUTHORIZED_UPDATE_NOTE_ERROR } from "../../constants";
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
