import type mongoose from "mongoose";
import { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { Event, InterfaceEvent } from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import { generateRecurrenceRuleString } from "../recurringEventHelpers";

export const updateCurrentRecurringInstance = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  const recurrenceRule = await RecurrenceRule.findOne({
    _id: event.recurrenceRuleId,
  });

  if (!recurrenceRule) {
    return event;
  }

  let newRecurrenceRuleString = recurrenceRule.recurrenceRuleString;
  let isRecurrenceRuleChanged = false;

  const startDate = args.data?.startDate || event.startDate;
  const endDate = args.data?.endDate || event.endDate;

  if (args.recurrenceRuleData) {
    newRecurrenceRuleString = generateRecurrenceRuleString(
      args.recurrenceRuleData,
      startDate,
      endDate,
    );

    isRecurrenceRuleChanged =
      recurrenceRule.recurrenceRuleString !== newRecurrenceRuleString;
  }

  if (
    event.isRecurringEventException !== args.data?.isRecurringEventException ||
    !isRecurrenceRuleChanged
  ) {
    updatedEvent = await Event.findOneAndUpdate(
      {
        _id: args.id,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        new: true,
        session,
      },
    ).lean();

    if (updatedEvent !== null) {
      await cacheEvents([updatedEvent]);
    }
  } else {
    // if recurrenceRule has changed
  }

  return updatedEvent;
};
