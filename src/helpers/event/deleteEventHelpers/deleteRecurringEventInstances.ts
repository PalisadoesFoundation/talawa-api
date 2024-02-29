import type mongoose from "mongoose";
import {
  InterfaceRecurrenceRule,
  RecurrenceRule,
} from "../../../models/RecurrenceRule";
import {
  ActionItem,
  Event,
  EventAttendee,
  InterfaceEvent,
  User,
} from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import { shouldUpdateBaseRecurringEvent } from "../updateEventHelpers";

export const deleteRecurringEventInstances = async (
  event: InterfaceEvent | null,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<void> => {
  const recurringEventInstances = await Event.find({
    recurrenceRuleId: recurrenceRule._id,
    startDate: { $gte: event?.startDate },
  });

  const recurringEventInstancesIds = recurringEventInstances.map(
    (recurringEventInstance) => recurringEventInstance._id,
  );

  await Promise.all([
    EventAttendee.deleteMany(
      { eventId: { $in: recurringEventInstancesIds } },
      { session },
    ),
    User.updateMany(
      {
        $or: [
          { createdEvents: { $in: recurringEventInstancesIds } },
          { eventAdmin: { $in: recurringEventInstancesIds } },
          { registeredEvents: { $in: recurringEventInstancesIds } },
        ],
      },
      {
        $pull: {
          createdEvents: { $in: recurringEventInstancesIds },
          eventAdmin: { $in: recurringEventInstancesIds },
          registeredEvents: { $in: recurringEventInstancesIds },
        },
      },
      { session },
    ),
    ActionItem.deleteMany(
      { eventId: { $in: recurringEventInstancesIds } },
      { session },
    ),
  ]);

  await Event.updateMany(
    {
      _id: { $in: recurringEventInstancesIds },
    },
    {
      status: "DELETED",
    },
    {
      session,
    },
  );

  const updatedRecurringEventInstances = await Event.find(
    {
      _id: { $in: recurringEventInstancesIds },
    },
    null,
    { session },
  );

  await Promise.all(
    updatedRecurringEventInstances.map((updatedEvent) =>
      cacheEvents([updatedEvent]),
    ),
  );

  // get the instances following the current recurrence rule
  const eventsFollowingCurrentRecurrence = await Event.find(
    {
      recurrenceRuleId: recurrenceRule._id,
      isRecurringEventException: false,
    },
    null,
    { session },
  ).sort({ startDate: -1 });

  const moreInstancesExist =
    eventsFollowingCurrentRecurrence && eventsFollowingCurrentRecurrence.length;

  if (moreInstancesExist) {
    // get the latest instance following the old recurrence rule
    const updatedEndDateString = eventsFollowingCurrentRecurrence[0].startDate;
    const updatedEndDate = new Date(updatedEndDateString);

    // update the latestInstanceDate and endDate of the current recurrenceRule
    await RecurrenceRule.findOneAndUpdate(
      {
        _id: recurrenceRule._id,
      },
      {
        latestInstanceDate: updatedEndDate,
        endDate: updatedEndDate,
      },
      { session },
    ).lean();

    // update the baseRecurringEvent if it is the latest recurrence rule that the instances are following
    if (
      shouldUpdateBaseRecurringEvent(
        recurrenceRule.endDate?.toString(),
        baseRecurringEvent.endDate?.toString(),
      )
    ) {
      await Event.updateOne(
        {
          _id: baseRecurringEvent._id,
        },
        {
          endDate: updatedEndDateString,
        },
        {
          session,
        },
      );
    }
  } else {
    const previousRecurrenceRules = await RecurrenceRule.find(
      { baseRecurringEventId: baseRecurringEvent._id },
      null,
      { session },
    ).sort({ endDate: -1 });

    const previousRecurrenceRulesExist =
      previousRecurrenceRules && previousRecurrenceRules.length;
    if (previousRecurrenceRulesExist) {
      if (
        shouldUpdateBaseRecurringEvent(
          recurrenceRule.endDate.toISOString(),
          baseRecurringEvent.endDate,
        )
      ) {
        await Event.updateOne(
          {
            _id: baseRecurringEvent._id,
          },
          { endDate: previousRecurrenceRules[0]._id },
          { session },
        );
      }
    }
  }
};
