import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { RecurrenceRule } from "../../models/RecurrenceRule";

/**
 * This resolver function will fetch and return the recurrenceRule that the event is following.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the RecurrenceRule of the event.
 */

export const recurrenceRule: EventResolvers["recurrenceRule"] = async (
  parent,
) => {
  return await RecurrenceRule.findOne({
    _id: parent.recurrenceRuleId,
  }).lean();
};
