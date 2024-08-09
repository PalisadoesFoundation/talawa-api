import { AgendaItemModel } from "../../models";
import { errors } from "../../libraries";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AGENDA_ITEM_NOT_FOUND_ERROR } from "../../constants";
/**
 * Retrieves an agenda item by its ID.
 *
 * This function fetches a specific agenda item from the database using its ID. If the agenda item
 * is not found, it throws an error indicating that the item does not exist.
 *
 * @param _parent - This parameter is not used in this resolver function.
 * @param args - The arguments provided by the GraphQL query, including the ID of the agenda item to retrieve.
 *
 * @returns The agenda item with the specified ID.
 */

export const getAgendaItem: QueryResolvers["getAgendaItem"] = async (
  _parent,
  args,
) => {
  const agendaItem = await AgendaItemModel.findById(args.id).lean();

  if (!agendaItem) {
    throw new errors.NotFoundError(
      AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE,
      AGENDA_ITEM_NOT_FOUND_ERROR.CODE,
      AGENDA_ITEM_NOT_FOUND_ERROR.PARAM,
    );
  }

  return agendaItem;
};
