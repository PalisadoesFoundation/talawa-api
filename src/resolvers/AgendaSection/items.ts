import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { AgendaItemModel } from "../../models";

/**
 * Resolver function for the `items` field of an `AgendaSection`.
 *
 * This function retrieves the agenda items associated with a specific agenda section.
 *
 * @param parent - The parent object representing the agenda section. It contains information about the agenda section, including the IDs of the agenda items associated with it.
 * @returns A promise that resolves to the agenda item documents found in the database. These documents represent the agenda items associated with the agenda section.
 *
 * @see AgendaItemModel - The AgendaItem model used to interact with the agenda items collection in the database.
 * @see AgendaSectionResolvers - The type definition for the resolvers of the AgendaSection fields.
 *
 */

export const items: AgendaSectionResolvers["items"] = async (parent) => {
  const relatedAgendaItemIds = parent.items;

  const relatedAgendaItems = await AgendaItemModel.find({
    _id: { $in: relatedAgendaItemIds },
  }).lean();

  return relatedAgendaItems;
};
