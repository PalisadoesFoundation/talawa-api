import type mongoose from "mongoose";
import { MutationRemoveEventArgs } from "../../../types/generatedGraphQLTypes";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import { Event, InterfaceEvent } from "../../../models";
import { deleteSingleEvent, deleteRecurringEventInstances } from "./index";

export const deleteRecurringEvent = async (
  args: MutationRemoveEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<void> => {
  // get the recurrenceRule
  const recurrenceRule = await RecurrenceRule.find({
    _id: event.recurrenceRuleId,
  });

  // get the baseRecurringEvent
  const baseRecurringEvent = await Event.find({
    _id: event.baseRecurringEventId,
  });

  if (
    event.isRecurringEventException ||
    args.recurringEventDeleteType === "ThisInstance"
  ) {
    // if the event is an exception or if it's deleting thisInstance only,
    // just delete this single instance
    await deleteSingleEvent(event._id.toString(), session);
  } else if (args.recurringEventDeleteType === "AllInstances") {
    // perform a regular bulk delete on all the instances
    await deleteRecurringEventInstances(
      null,
      recurrenceRule[0],
      baseRecurringEvent[0],
      session,
    );
  } else {
    // update current and following events
    await deleteRecurringEventInstances(
      event,
      recurrenceRule[0],
      baseRecurringEvent[0],
      session,
    );
  }
};
