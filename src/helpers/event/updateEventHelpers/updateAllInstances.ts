import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import type { InterfaceRecurrenceRule } from "../../../models/RecurrenceRule";
import { shouldUpdateBaseRecurringEvent } from "./index";

/**
 * This function updates all instances of the recurring event following the given recurrenceRule.
 * @param args - update event args.
 * @param event - the event to be updated.
 * @param recurrenceRule - the recurrence rule followed by the instances.
 * @param baseRecurringEvent - the base recurring event.
 * @remarks The following steps are followed:
 * 1. get the current event data.
 * 2. update the data provided in the input.
 * @returns The updated event.
 */

export const updateAllInstances = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  if (
    shouldUpdateBaseRecurringEvent(
      recurrenceRule?.endDate?.toString(),
      baseRecurringEvent?.endDate?.toString(),
    )
  ) {
    // if this was the latest recurrence rule, then update the baseRecurringEvent
    // because new instances following this recurrence rule would be generated based on baseRecurringEvent
    await Event.updateOne(
      {
        _id: baseRecurringEvent._id,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        session,
      },
    );
  }

  // update all the instances following this recurrence rule and are not exceptions
  await Event.updateMany(
    {
      recurrenceRuleId: recurrenceRule._id,
      isRecurringEventException: false,
    },
    {
      ...(args.data as Partial<InterfaceEvent>),
    },
    {
      session,
    },
  );

  const updatedEvent = await Event.findOne({
    _id: event._id,
  }).lean();

  return updatedEvent as InterfaceEvent;
};
