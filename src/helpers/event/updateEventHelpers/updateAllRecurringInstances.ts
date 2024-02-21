import type mongoose from "mongoose";
import { Event, InterfaceEvent } from "../../../models";
import { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { RecurrenceRule } from "../../../models/RecurrenceRule";

export const updateAllRecurringInstances = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  const { _id: eventId, recurrenceRuleId, baseRecurringEventId } = event;

  const recurrenceRule = await RecurrenceRule.findOne({
    _id: recurrenceRuleId,
  });

  const baseRecurringEvent = await Event.findOne({
    _id: baseRecurringEventId,
  });

  if (!recurrenceRule || !baseRecurringEvent) {
    return event;
  }

  if (
    (recurrenceRule.endDate === null && baseRecurringEvent.endDate === null) ||
    (recurrenceRule.endDate &&
      baseRecurringEvent.endDate &&
      recurrenceRule.endDate.toISOString() === baseRecurringEvent.endDate)
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

  console.log("here");

  await Event.updateMany(
    {
      recurrenceRuleId,
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
