import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { updateThisInstance } from "./updateThisInstance";
import { updateAllInstances } from "./updateAllInstances";
import { updateThisAndFollowingInstances } from "./updateThisAndFollowingInstances";
import { RecurrenceRule } from "../../../models/RecurrenceRule";

/**
 * This function updates the recurring event.
 * @param args - update event args.
 * @param event - the event to be updated.
 * @remarks The following steps are followed:
 * 1. get the recurrence rule.
 * 2. get the base recurring event.
 * 3. based on the type of update, call the function required.
 * @returns The updated event.
 */

export const updateRecurringEvent = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  // get the recurrenceRule
  const recurrenceRule = await RecurrenceRule.find({
    _id: event.recurrenceRuleId,
  });

  // get the baseRecurringEvent
  const baseRecurringEvent = await Event.find({
    _id: event.baseRecurringEventId,
  });

  if (
    (args.data?.isRecurringEventException !== undefined &&
      args.data?.isRecurringEventException !==
        event.isRecurringEventException) ||
    args.recurringEventUpdateType === "ThisInstance"
  ) {
    // if this is a single update or if the event's exception status has changed
    updatedEvent = await updateThisInstance(args, event, session);
  } else if (args.recurringEventUpdateType === "AllInstances") {
    // perform a regular bulk update on all the instances
    updatedEvent = await updateAllInstances(
      args,
      event,
      recurrenceRule[0],
      baseRecurringEvent[0],
      session,
    );
  } else {
    // update current and following events
    updatedEvent = await updateThisAndFollowingInstances(
      args,
      event,
      recurrenceRule[0],
      baseRecurringEvent[0],
      session,
    );
  }

  return updatedEvent;
};
