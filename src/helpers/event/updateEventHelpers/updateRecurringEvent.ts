import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { updateThisInstance } from "./updateThisInstance";
import { updateAllInstances } from "./updateAllInstances";
import { updateThisAndFollowingInstances } from "./updateThisAndFollowingInstances";
import { RecurrenceRule } from "../../../models/RecurrenceRule";

export const updateRecurringEvent = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  const recurrenceRule = await RecurrenceRule.find({
    _id: event.recurrenceRuleId,
  });

  const baseRecurringEvent = await Event.find({
    _id: event.baseRecurringEventId,
  });

  if (
    (args.data?.isRecurringEventException &&
      args.data?.isRecurringEventException !==
        event.isRecurringEventException) ||
    args.recurringEventUpdateType === "ThisInstance"
  ) {
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
