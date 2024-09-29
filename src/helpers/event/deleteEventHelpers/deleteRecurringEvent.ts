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
 * Deletes instances of a recurring event based on the delete type specified.
 * Delete types include: thisInstance, allInstances, thisAndFollowingInstances.
 *
 * @param args - Arguments containing details for the event deletion.
 * @param event - The instance of the recurring event to be deleted.
 * @param session - The MongoDB client session for transactional operations.
 *
 * @remarks
 * This function follows these steps:
 * 1. Retrieves the recurrence rule associated with the event.
 * 2. Retrieves the base recurring event to which the event belongs.
 * 3. If the event is an exception instance or deleting a single instance (`thisInstance`), deletes that specific instance.
 * 4. If deleting all instances (`allInstances`), deletes all instances associated with the recurrence rule.
 * 5. If deleting this and following instances (`thisAndFollowingInstances`), deletes all instances starting from the specified event instance.
 *
 */
export const deleteRecurringEvent = async (
  args: MutationRemoveEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<void> => {
  // Retrieve the recurrence rule associated with the event
  const recurrenceRule = await RecurrenceRule.findOne({
    _id: event.recurrenceRuleId,
  });

  // Throw error if the recurrence rule doesn't exist
  if (recurrenceRule === null) {
    throw new errors.NotFoundError(
      requestContext.translate(RECURRENCE_RULE_NOT_FOUND.MESSAGE),
      RECURRENCE_RULE_NOT_FOUND.CODE,
      RECURRENCE_RULE_NOT_FOUND.PARAM,
    );
  }

  // Retrieve the base recurring event associated with the event
  const baseRecurringEvent = await Event.findOne({
    _id: event.baseRecurringEventId,
  });

  // Throw error if the base recurring event doesn't exist
  if (baseRecurringEvent === null) {
    throw new errors.NotFoundError(
      requestContext.translate(BASE_RECURRING_EVENT_NOT_FOUND.MESSAGE),
      BASE_RECURRING_EVENT_NOT_FOUND.CODE,
      BASE_RECURRING_EVENT_NOT_FOUND.PARAM,
    );
  }

  // Determine the type of deletion operation based on args.recurringEventDeleteType
  if (
    event.isRecurringEventException ||
    args.recurringEventDeleteType === "thisInstance"
  ) {
    // If the event is an exception or deleting thisInstance, delete the single event instance
    await deleteSingleEvent(
      event._id.toString(),
      session,
      recurrenceRule._id.toString(),
      baseRecurringEvent._id.toString(),
    );
  } else if (args.recurringEventDeleteType === "allInstances") {
    // If deleting allInstances, delete all instances associated with the recurrence rule
    await deleteRecurringEventInstances(
      null, // Passing null as we delete all instances controlled by the recurrence rule
      recurrenceRule,
      baseRecurringEvent,
      session,
    );
  } else {
    // If deleting thisAndFollowingInstances, delete this and all following instances
    await deleteRecurringEventInstances(
      event, // Delete all instances from this instance onwards
      recurrenceRule,
      baseRecurringEvent,
      session,
    );
  }
};
