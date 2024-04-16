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
  const recurrenceRule = await RecurrenceRule.findOne({
    _id: event.recurrenceRuleId,
  });

  // throws error if the recurrence rule doesn't exist
  if (recurrenceRule === null) {
    throw new errors.NotFoundError(
      requestContext.translate(RECURRENCE_RULE_NOT_FOUND.MESSAGE),
      RECURRENCE_RULE_NOT_FOUND.CODE,
      RECURRENCE_RULE_NOT_FOUND.PARAM,
    );
  }

  // get the baseRecurringEvent
  const baseRecurringEvent = await Event.findOne({
    _id: event.baseRecurringEventId,
  });

  // throws error if the base recurring event doesn't exist
  if (baseRecurringEvent === null) {
    throw new errors.NotFoundError(
      requestContext.translate(BASE_RECURRING_EVENT_NOT_FOUND.MESSAGE),
      BASE_RECURRING_EVENT_NOT_FOUND.CODE,
      BASE_RECURRING_EVENT_NOT_FOUND.PARAM,
    );
  }

  if (
    (args.data?.isRecurringEventException !== undefined &&
      args.data?.isRecurringEventException !==
        event.isRecurringEventException) ||
    args.recurringEventUpdateType === "thisInstance"
  ) {
    // if this is a single update or if the event's exception status has changed
    updatedEvent = await updateThisInstance(args, event, session);
  } else if (args.recurringEventUpdateType === "allInstances") {
    // perform a regular bulk update on all the instances
    updatedEvent = await updateRecurringEventInstances(
      args,
      event,
      recurrenceRule,
      baseRecurringEvent,
      "allInstances",
      session,
    );
  } else {
    // update current and following events
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
