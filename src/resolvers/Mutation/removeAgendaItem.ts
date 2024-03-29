import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAgendaItem } from "../../models";
import { User, AgendaItemModel, AppUserProfile } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../constants";
/**
 * This function removes an agenda item.
 * @param _parent - parent of the current request
 * @param args - payload provided with the request
 * @param context - context of the entire application
 * @returns ID of the removed agenda item
 * @throws NotFoundError if the user or agenda item is not found
 * @throws UnauthorizedError if the user is not the creator of the agenda item
 */
export const removeAgendaItem: MutationResolvers["removeAgendaItem"] = async (
  _parent,
  args,
  context,
): Promise<InterfaceAgendaItem> => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentAppUserProfile = await AppUserProfile.findOne({
    userId: currentUser?._id,
  }).lean();
  if (!currentAppUserProfile) {
    throw new errors.UnauthenticatedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  const agendaItem = await AgendaItemModel.findOne({
    _id: args.id,
  }).lean();
  if (!agendaItem) {
    throw new errors.NotFoundError(
      requestContext.translate(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE),
      AGENDA_ITEM_NOT_FOUND_ERROR.CODE,
      AGENDA_ITEM_NOT_FOUND_ERROR.PARAM,
    );
  }

  if (!agendaItem.createdBy.equals(currentUser._id)) {
    throw new errors.UnauthorizedError(
      requestContext.translate(UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR.MESSAGE),
      UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR.CODE,
      UNAUTHORIZED_REMOVE_AGENDA_ITEM_ERROR.PARAM,
    );
  }

  // Delete the agenda item from the database
  await AgendaItemModel.deleteOne({ _id: args.id });

  /*
  Remove agendaItem._id from appropriate lists
  on currentUser's document.
  */
  await User.updateOne(
    {
      _id: currentUser._id,
    },
    {
      $pull: {
        // Add relevant lists here based on your schema
        createdAgendaItems: agendaItem._id,
      },
    },
  );

  return agendaItem;
};
