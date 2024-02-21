import type mongoose from "mongoose";
import { InterfaceEvent } from "../../../models";
import { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { updateCurrentRecurringInstance } from "./updateCurrentRecurringInstance";
import { updateAllRecurringInstances } from "./updateAllRecurringInstances";
import { updateCurrentAndFollowingInstances } from "./updateCurrentAndFollowingInstances";

export const updateRecurringEvent = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  if (
    (args.data?.isRecurringEventException &&
      args.data?.isRecurringEventException !==
        event.isRecurringEventException) ||
    args.recurringEventUpdateType === "ThisEvent"
  ) {
    updatedEvent = await updateCurrentRecurringInstance(args, event, session);
  } else if (args.recurringEventUpdateType === "AllEvents") {
    // perform a regular bulk update on all the instances
    updatedEvent = await updateAllRecurringInstances(args, event, session);
  } else {
    // update current and following events
    updatedEvent = await updateCurrentAndFollowingInstances(
      event,
      // args,
      // session,
    );
  }

  return updatedEvent;
};
