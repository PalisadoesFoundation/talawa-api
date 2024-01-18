/**
 * This function retrieves an agenda item by its ID.
 * @param _parent - parent of the current request
 * @param args - payload provided with the request, containing the ID of the agenda item to retrieve
 * @returns The agenda item object
 */
import { AgendaItemModel } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

export const getAgendaItem: QueryResolvers["getAgendaItem"] = async (
  _parent,
  args
) => {
  // Fetch the agenda item from the database by its ID
  const agendaItem = await AgendaItemModel.findById(args.id).lean();

  // Return the retrieved agenda item object
  return agendaItem;
};
