import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import type { InterfaceAgendaItem } from "../../models";
import { User, AgendaItemModel } from "../../models";
import {
  USER_NOT_FOUND_ERROR,
  AGENDA_ITEM_NOT_FOUND_ERROR,
  UNAUTHORIZED_UPDATE_AGENDA_ITEM_ERROR,
} from "../../constants";

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
  const userId = args.input.updatedBy;
  console.log(context);
  // Fetch the current user based on the provided ID
  const currentUser = await User.findById(userId);

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
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
  const updatedAgendaItem = await AgendaItemModel.findOneAndUpdate(
    {
      _id: args.id,
    },
    {
      ...(args.input as InterfaceAgendaItem),
    },
    {
      new: true, // Return the updated document
    },
  ).lean();

  return updatedAgendaItem;
};
