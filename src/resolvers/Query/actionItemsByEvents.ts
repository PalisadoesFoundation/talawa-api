import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { ActionItem } from "../../models";
/**
 * This query will fetch all action items for the event from database.
 * @param _parent-
 * @param args - An object that contains `orderBy` to sort the object as specified and `id` of the Organization.
 * @returns An `actionItems` object that holds all action items with `ACTIVE` status for the Organization.
 */
export const actionItemsByEvents: QueryResolvers["actionItemsByEvents"] =
  async (_parent, args) => {
    const actionItem = await ActionItem.find({
      event: args.eventId,
    })
      .populate("org")
      .lean();

    return actionItem;
  };
