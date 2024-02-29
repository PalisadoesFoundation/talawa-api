import type mongoose from "mongoose";
import type { InterfaceRecurrenceRule } from "../../../models/RecurrenceRule";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import type { InterfaceEvent } from "../../../models";
import { ActionItem, Event, EventAttendee, User } from "../../../models";
import { shouldUpdateBaseRecurringEvent } from "../updateEventHelpers";
import type { Types } from "mongoose";

/**
 * This function deletes allInstances / thisAndFollowingInstances of a recurring event.
 * @param event - the event to be deleted:
 *              - in case of deleting thisAndFollowingInstances, it would represent this instance.
 *              - in case of deleting allInstances, it would be null.
 * @param recurrenceRule - the recurrence rule followed by the instances.
 * @param baseRecurringEvent - the base recurring event.
 * @remarks The following steps are followed:
 * 1. get the instances to be deleted.
 * 2. remove the associations of the instances.
 * 3. delete the instances.
 * 4. update the recurrenceRule and baseRecurringEvent accordingly.
 */

export const deleteRecurringEventInstances = async (
  event: InterfaceEvent | null,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<void> => {
  // get the query object:
  // if we're deleting thisAndFollowingInstance, it would find all the instances after(and including) this one
  // if we're deleting allInstances, it would find all the instances
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

  // get all the instances to be deleted
  const recurringEventInstances = await Event.find(query);

  // get the ids of those instances
  const recurringEventInstancesIds = recurringEventInstances.map(
    (recurringEventInstance) => recurringEventInstance._id,
  );

  // remove all the associations for the instances that are deleted
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

  // delete the instances
  await Event.deleteMany(
    {
      _id: { $in: recurringEventInstancesIds },
    },
    {
      session,
    },
  );

  // get the instances following the current recurrence rule (if any)
  const instancesFollowingCurrentRecurrence = await Event.find(
    {
      recurrenceRuleId: recurrenceRule._id,
      isRecurringEventException: false,
    },
    null,
    { session },
  ).sort({ startDate: -1 });

  // check if more instances following this recurrence rule still exist
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

    // update the baseRecurringEvent if it is the latest recurrence rule that the instances were following
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
    // if no instances conforming to the current recurrence rule exist
    // find any previous recurrence rules that were associated with this baseRecurringEvent
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
      // update the baseRecurringEvent if it is the latest recurrence rule that the instances were following
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
