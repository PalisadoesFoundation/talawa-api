import type mongoose from "mongoose";
import { Event, RecurrenceRule } from "../../../models";

/**
 * Removes dangling recurrence rule and base recurring event documents if they have no associated events.
 * @param recurrenceRuleId - _id of the recurrence rule.
 * @param baseRecurringEventId - _id of the base recurring event.
 * @param session - Mongoose client session.
 * @remarks
 * The function first checks if there are any associated events for each document.
 * If no associated events are found, it deletes the document from the database.
 */
export const removeDanglingDocuments = async (
  recurrenceRuleId: string,
  baseRecurringEventId: string,
  session: mongoose.ClientSession,
): Promise<void> => {
  await removeRecurrenceRule(recurrenceRuleId, session);
  await removeBaseRecurringEvent(baseRecurringEventId, session);
};

/**
 * Removes the recurrence rule document if no events follow this recurrence rule.
 * @param recurrenceRuleId - _id of the recurrence rule.
 * @param session - Mongoose client session.
 */
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

/**
 * Removes the base recurring event document if no events reference this base recurring event.
 * @param baseRecurringEventId - _id of the base recurring event.
 * @param session - Mongoose client session.
 */
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
