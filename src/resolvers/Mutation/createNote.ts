import {
  AGENDA_ITEM_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAgendaItem,
  InterfaceAppUserProfile,
  InterfaceUser,
} from "../../models";
import { AgendaItemModel, AppUserProfile, NoteModel, User } from "../../models";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
/**
 * Create an note for an agenda item based on the provided input.
 *
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @returns The created note for an agenda item.
 */
export const createNote: MutationResolvers["createNote"] = async (
  _parent,
  args,
  context,
) => {
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
  let currentAppUserProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    currentUser.appUserProfileId?.toString(),
  ]);
  currentAppUserProfile = appUserProfileFoundInCache[0];
  if (currentAppUserProfile === null) {
    currentAppUserProfile = await AppUserProfile.findOne({
      userId: currentUser._id,
    }).lean();
    // if (currentAppUserProfile !== null) {
    //   await cacheAppUserProfile([currentAppUserProfile]);
    // }
  }
  if (!currentAppUserProfile) {
    throw new errors.UnauthenticatedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  const relatedAgendaItem: InterfaceAgendaItem | null =
    await AgendaItemModel.findOne({
      _id: args.data.agendaItemId,
    }).lean();

  if (!relatedAgendaItem) {
    throw new errors.NotFoundError(
      requestContext.translate(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE),
      AGENDA_ITEM_NOT_FOUND_ERROR.CODE,
      AGENDA_ITEM_NOT_FOUND_ERROR.PARAM,
    );
  }

  const createdNote = await NoteModel.create({
    ...args.data,
    createdBy: currentUser._id,
    updatedBy: currentUser._id,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  await AgendaItemModel.updateOne(
    {
      _id: args.data.agendaItemId,
    },
    {
      $push: {
        notes: createdNote._id,
      },
    },
  );

  return createdNote.toObject();
};
