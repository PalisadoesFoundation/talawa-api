import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import type { MutationRemoveEventArgs } from "../../../types/generatedGraphQLTypes";
import { deleteRecurringEventInstances, deleteSingleEvent } from "./index";

/**
 * This function deletes thisInstance / allInstances / thisAndFollowingInstances of a recurring event.
 * @param args - removeEventArgs
 * @param event - an instance of the recurring event to be deleted.
 * @remarks The following steps are followed:
 * 1. get the recurrence rule and the base recurring event.
 * 2. if the instance is an exception instance or if we're deleting thisInstance only, just delete that single instance.
 * 3. if it's a bulk delete operation, handle it accordingly.
 */

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
    // delete all the instances
    // and update the recurrenceRule and baseRecurringEvent accordingly
    await deleteRecurringEventInstances(
      null, // because we're going to delete all the instances, which we could get from the recurrence rule
      recurrenceRule[0],
      baseRecurringEvent[0],
      session,
    );
  } else {
    // delete this and following the instances
    // and update the recurrenceRule and baseRecurringEvent accordingly
    await deleteRecurringEventInstances(
      event, // we'll find all the instances after(and including) this one and delete them
      recurrenceRule[0],
      baseRecurringEvent[0],
      session,
    );
  }
};
