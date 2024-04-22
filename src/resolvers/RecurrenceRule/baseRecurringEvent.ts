import type { RecurrenceRuleResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

export const baseRecurringEvent: RecurrenceRuleResolvers["baseRecurringEvent"] =
  async (parent) => {
    return await Event.findOne({
      _id: parent.baseRecurringEventId,
    }).lean();
  };
