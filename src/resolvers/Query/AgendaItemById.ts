import { AgendaItemModel, User } from "../../models";
import { errors, requestContext } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  AGENDA_ITEM_NOT_FOUND_ERROR,
} from "../../constants";

export const getAgendaItem: QueryResolvers["getAgendaItem"] = async (
  _parent,
  args,
  context
) => {
  // Fetch the current user
  const currentUser = await User.findById(context.userId).lean();

  // If the user is not found, throw a NotFoundError
  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Fetch the agenda item from the database by its ID
  const agendaItem = await AgendaItemModel.findById(args.id).lean();

  // If the agenda item is not found, throw a NotFoundError
  if (!agendaItem) {
    throw new errors.NotFoundError(
      requestContext.translate(AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE),
      AGENDA_ITEM_NOT_FOUND_ERROR.CODE,
      AGENDA_ITEM_NOT_FOUND_ERROR.PARAM
    );
  }

  // Check if the user is authorized to access the agenda item
  const isAuthorized =
    currentUser.adminFor.includes(agendaItem.organization) ||
    currentUser.userType === "SUPERADMIN" ||
    agendaItem.createdBy === currentUser._id;

  if (!isAuthorized) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Return the retrieved agenda item object
  return agendaItem;
};
