import type mongoose from "mongoose";
import type { InterfaceRecurrenceRule } from "../../../models/RecurrenceRule";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import type { InterfaceEvent } from "../../../models";
import { ActionItem, Event, EventAttendee, User } from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import { shouldUpdateBaseRecurringEvent } from "../updateEventHelpers";
import type { Types } from "mongoose";

export const deleteRecurringEventInstances = async (
  event: InterfaceEvent | null,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<void> => {
  const query: {
    recurrenceRuleId: Types.ObjectId;
    isRecurringEventException: boolean;
    startDate?: { $gte: string };
  } = {
    recurrenceRuleId: recurrenceRule._id,
    isRecurringEventException: false,
  };

  if (event) {
    query.startDate = { $gte: event.startDate };
  }

  const recurringEventInstances = await Event.find(query);

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
  const instancesFollowingCurrentRecurrence = await Event.find(
    {
      recurrenceRuleId: recurrenceRule._id,
      isRecurringEventException: false,
      status: "ACTIVE",
    },
    null,
    { session },
  ).sort({ startDate: -1 });

  const moreInstancesExist =
    instancesFollowingCurrentRecurrence &&
    instancesFollowingCurrentRecurrence.length;

  if (moreInstancesExist) {
    // get the latest instance following the old recurrence rule
    const updatedEndDateString =
      instancesFollowingCurrentRecurrence[0].startDate;
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
      {
        baseRecurringEventId: baseRecurringEvent._id,
        endDate: { $lt: recurrenceRule.startDate },
      },
      null,
      { session },
    )
      .sort({ endDate: -1 })
      .lean();

    const previousRecurrenceRulesExist =
      previousRecurrenceRules && previousRecurrenceRules.length;
    if (previousRecurrenceRulesExist) {
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
          { endDate: previousRecurrenceRules[0].endDate.toISOString() },
          { session },
        );
      }
    }
  }
};
