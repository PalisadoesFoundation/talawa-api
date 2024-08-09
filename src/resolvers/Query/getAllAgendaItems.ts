import { AgendaItemModel } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Retrieves all agenda items from the database.
 *
 * This function performs the following steps:
 * 1. Fetches all agenda items stored in the database.
 * 2. Returns the list of all agenda items.
 *
 * @param _parent - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 * @param _args - This parameter is not used in this resolver function but is included for compatibility with GraphQL resolver signatures.
 *
 * @returns A list of all agenda items stored in the database.
 */

export const getAllAgendaItems: QueryResolvers["getAllAgendaItems"] = async (
  _parent,
  _args,
) => {
  console.log(_parent);
  console.log(_args);

  // Fetch all agenda items from the database
  const allAgendaItems = await AgendaItemModel.find().lean().exec();
  return allAgendaItems;
};
