import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, RecurrenceRule } from "../../../models";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { updateThisInstance } from "./updateThisInstance";
import { updateRecurringEventInstances } from "./updateRecurringEventInstances";
import { errors, requestContext } from "../../../libraries";
import {
  BASE_RECURRING_EVENT_NOT_FOUND,
  RECURRENCE_RULE_NOT_FOUND,
} from "../../../constants";

/**
 * This function updates a recurring event based on the provided arguments.
 * @param args - The arguments containing data for updating the event.
 * @param event - The event to be updated.
 * @param session - The Mongoose client session for database transactions.
 * @returns The updated event object.
 */
export const updateRecurringEvent = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event; // Initialize the updated event with the current event data

  // Step 1: Retrieve the recurrenceRule associated with the event
  const recurrenceRule = await RecurrenceRule.findOne({
    _id: event.recurrenceRuleId,
  });

  // Step 2: Throw an error if the recurrence rule is not found
  if (recurrenceRule === null) {
    throw new errors.NotFoundError(
      requestContext.translate(RECURRENCE_RULE_NOT_FOUND.MESSAGE),
      RECURRENCE_RULE_NOT_FOUND.CODE,
      RECURRENCE_RULE_NOT_FOUND.PARAM,
    );
  }

  // Step 3: Retrieve the baseRecurringEvent associated with the event
  const baseRecurringEvent = await Event.findOne({
    _id: event.baseRecurringEventId,
  });

  // Step 4: Throw an error if the base recurring event is not found
  if (baseRecurringEvent === null) {
    throw new errors.NotFoundError(
      requestContext.translate(BASE_RECURRING_EVENT_NOT_FOUND.MESSAGE),
      BASE_RECURRING_EVENT_NOT_FOUND.CODE,
      BASE_RECURRING_EVENT_NOT_FOUND.PARAM,
    );
  }

  // Step 5: Determine the type of update (this instance, all instances, this and following instances)
  if (
    (args.data?.isRecurringEventException !== undefined &&
      args.data?.isRecurringEventException !==
        event.isRecurringEventException) ||
    args.recurringEventUpdateType === "thisInstance"
  ) {
    // Update only this instance or handle exception status change
    updatedEvent = await updateThisInstance(args, event, session);
  } else if (args.recurringEventUpdateType === "allInstances") {
    // Update all instances
    updatedEvent = await updateRecurringEventInstances(
      args,
      event,
      recurrenceRule,
      baseRecurringEvent,
      "allInstances",
      session,
    );
  } else {
    // Update this and following instances
    updatedEvent = await updateRecurringEventInstances(
      args,
      event,
      recurrenceRule,
      baseRecurringEvent,
      "thisAndFollowingInstances",
      session,
    );
  }

  return updatedEvent;
};
