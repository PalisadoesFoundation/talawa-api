import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import type { InterfaceRecurrenceRule } from "../../../models/RecurrenceRule";

export const updateAllInstances = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  const { _id: eventId, recurrenceRuleId, baseRecurringEventId } = event;

  if (
    (!recurrenceRule.endDate && !baseRecurringEvent.endDate) ||
    (recurrenceRule.endDate &&
      baseRecurringEvent.endDate &&
      recurrenceRule.endDate.toString() ===
        baseRecurringEvent.endDate.toString())
  ) {
    await Event.updateOne(
      {
        _id: baseRecurringEventId,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        session,
      },
    );
  }

  await Event.updateMany(
    {
      recurrenceRuleId,
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
    _id: eventId,
  }).lean();

  return updatedEvent as InterfaceEvent;
};
