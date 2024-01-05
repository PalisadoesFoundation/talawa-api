import { ActionItem } from "../../models";
import type { EventResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the action items related to the event from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of all action items related to the event.
 */
export const actionItems: EventResolvers["actionItems"] = async (parent) => {
  return await ActionItem.find({
    _id: {
      $in: parent.actionItems,
    },
  }).lean();
};
