import type mongoose from "mongoose";
import { InterfaceEvent } from "../../../models";
import { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { updateThisInstance } from "./updateThisInstance";
import { updateAllInstances } from "./updateAllInstances";
import { updateThisAndFollowingInstances } from "./updateThisAndFollowingInstances";

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
    args.recurringEventUpdateType === "ThisInstance"
  ) {
    updatedEvent = await updateThisInstance(args, event, session);
  } else if (args.recurringEventUpdateType === "AllInstances") {
    // perform a regular bulk update on all the instances
    updatedEvent = await updateAllInstances(args, event, session);
  } else {
    // update current and following events
    updatedEvent = await updateThisAndFollowingInstances(args, event, session);
  }

  return updatedEvent;
};
