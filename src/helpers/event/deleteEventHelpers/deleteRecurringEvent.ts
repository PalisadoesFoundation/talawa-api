import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, RecurrenceRule } from "../../../models";
import type { MutationRemoveEventArgs } from "../../../types/generatedGraphQLTypes";
import { deleteRecurringEventInstances, deleteSingleEvent } from "./index";
import { errors, requestContext } from "../../../libraries";
import {
  BASE_RECURRING_EVENT_NOT_FOUND,
  RECURRENCE_RULE_NOT_FOUND,
} from "../../../constants";

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
    event.isRecurringEventException ||
    args.recurringEventDeleteType === "thisInstance"
  ) {
    // if the event is an exception or if it's deleting thisInstance only,
    // just delete this single instance
    await deleteSingleEvent(
      event._id.toString(),
      session,
      recurrenceRule._id.toString(),
      baseRecurringEvent._id.toString(),
    );
  } else if (args.recurringEventDeleteType === "allInstances") {
    // delete all the instances
    // and update the recurrenceRule and baseRecurringEvent accordingly
    await deleteRecurringEventInstances(
      null, // because we're going to delete all the instances, which we could get from the recurrence rule
      recurrenceRule,
      baseRecurringEvent,
      session,
    );
  } else {
    // delete this and following the instances
    // and update the recurrenceRule and baseRecurringEvent accordingly
    await deleteRecurringEventInstances(
      event, // we'll find all the instances after(and including) this one and delete them
      recurrenceRule,
      baseRecurringEvent,
      session,
    );
  }
};
