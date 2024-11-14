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
 * Creates a note for a specified agenda item.
 *
 * This resolver performs the following actions:
 *
 * 1. Verifies the existence of the current user making the request.
 * 2. Checks the user's app profile to ensure they are authenticated.
 * 3. Checks if the specified agenda item exists.
 * 4. Creates a new note associated with the agenda item.
 * 5. Updates the agenda item to include the newly created note.
 *
 * @param _parent - The parent object, not used in this resolver.
 * @param args - The input arguments for the mutation, including:
 *   - `data`: An object containing:
 *     - `agendaItemId`: The ID of the agenda item to which the note will be added.
 *     - `content`: The content of the note.
 * @param context - The context object containing user information (context.userId).
 *
 * @returns The created note object.
 *
 * @remarks This function creates a note, associates it with the specified agenda item, and updates the agenda item to include the new note. It also handles caching and error scenarios.
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
