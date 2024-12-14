import { ActionItem } from "../../models";
import type { EventResolvers } from "../../types/generatedGraphQLTypes";

/**
 * Resolver function for the `actionItems` field of an `Event`.
 *
 * This function retrieves the action items associated with a specific event.
 *
 * @param parent - The parent object representing the event. It contains information about the event, including the ID of the action items associated with it.
 * @returns A promise that resolves to an array of action item documents found in the database. These documents represent the action items associated with the event.
 *
 * @see ActionItem - The ActionItem model used to interact with the action items collection in the database.
 * @see EventResolvers - The type definition for the resolvers of the Event fields.
 *
 */
export const actionItems: EventResolvers["actionItems"] = async (parent) => {
  return await ActionItem.find({
    event: parent._id,
  }).lean();
};
