import {
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import type {
  InterfaceAgendaItem,
  InterfaceAppUserProfile,
  InterfaceUser,
} from "../../models";
import { AgendaItemModel, AppUserProfile, User } from "../../models";
import { cacheAppUserProfile } from "../../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../../services/UserCache/cacheUser";
import { findUserInCache } from "../../services/UserCache/findUserInCache";
import type {
  MutationResolvers,
  UpdateAgendaItemInput,
} from "../../types/generatedGraphQLTypes";

/**
 * This function allows the user who created an agenda item to update it.
 * @param _parent - The parent of the current request.
 * @param args - The payload provided with the request.
 * @param context - The context of the entire application.
 * @returns The updated agenda item.
 */
export const updateAgendaItem: MutationResolvers["updateAgendaItem"] = async (
  _parent,
  args,
  context,
) => {
  // Fetch the current user based on the provided ID
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
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Check if the agenda item exists
  const agendaItem: InterfaceAgendaItem | null = await AgendaItemModel.findOne({
    _id: args.id,
  }).lean();

  // If the agenda item doesn't exist, throw a NotFoundError
  if (!agendaItem) {
    throw new errors.NotFoundError(
      requestContext.translate(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE),
      AGENDA_ITEM_NOT_FOUND_ERROR.CODE,
      AGENDA_ITEM_NOT_FOUND_ERROR.PARAM,
    );
  }

  // Check if the current user created the agenda item
  if (!agendaItem.createdBy.equals(currentUser._id)) {
    throw new errors.UnauthorizedError(
      requestContext.translate(UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR.MESSAGE),
      UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR.CODE,
      UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR.PARAM,
    );
  }

  // Update the agenda item in the database
  const updatedAgendaItem = await AgendaItemModel.findByIdAndUpdate(
    args.id,
    {
      $set: {
        ...(args.input as UpdateAgendaItemInput),
      },
      updatedBy: context.userId,
    },
    {
      new: true, // Return the updated document
    },
  ).lean();

  return updatedAgendaItem;
};
