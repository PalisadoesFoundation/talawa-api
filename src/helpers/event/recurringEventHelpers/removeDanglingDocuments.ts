import type mongoose from "mongoose";
import { Event, RecurrenceRule } from "../../../models";

/**
 * This function removes dangling recurrence rule and base recurring event documents.
 * @param baseRecurringEventId - _id of the base recurring event.
 * @param recurrenceRuleId - _id of the recurrence rule.
 * @remarks The following steps are followed:
 * 1. Call the function associated with the document to be removed, i.e. removeRecurrenceRule or removeBaseRecurringEvent.
 * 2. Check if the document has any associations, i.e.:
 *   - for recurrence rule, check if there exist any event that follow this given recurrence rule
 *   - for base recurring event, check if there exist any event that has this event as its base recurring event
 * 3. Remove the documents if no associations are found.
 */

export const removeDanglingDocuments = async (
  recurrenceRuleId: string,
  baseRecurringEventId: string,
  session: mongoose.ClientSession,
): Promise<void> => {
  await removeRecurrenceRule(recurrenceRuleId, session);
  await removeBaseRecurringEvent(baseRecurringEventId, session);
};

const removeRecurrenceRule = async (
  recurrenceRuleId: string,
  session: mongoose.ClientSession,
): Promise<void> => {
  const eventsFollowingRecurrenceRule = await Event.exists({
    recurrenceRuleId,
  });

  if (!eventsFollowingRecurrenceRule) {
    await RecurrenceRule.deleteOne(
      {
        _id: recurrenceRuleId,
      },
      { session },
    );
  }
};

const removeBaseRecurringEvent = async (
  baseRecurringEventId: string,
  session: mongoose.ClientSession,
): Promise<void> => {
  const eventsHavingBaseRecurringEvent = await Event.exists({
    baseRecurringEventId,
  });

  if (!eventsHavingBaseRecurringEvent) {
    await Event.deleteOne(
      {
        _id: baseRecurringEventId,
      },
      { session },
    );
  }
};
