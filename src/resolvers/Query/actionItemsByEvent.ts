import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItem } from "../../models";
/**
 * This query will fetch all action items for an event from database.
 * @param _parent-
 * @param args - An object that contains `eventId` which is the _id of the Event.
 * @returns An `actionItems` object that holds all action items for the Event.
 */
export const actionItemsByEvent: QueryResolvers["actionItemsByEvent"] = async (
  _parent,
  args,
) => {
  const actionItems = await ActionItem.find({
    event: args.eventId,
  }).lean();

  return actionItems;
};
