import type mongoose from "mongoose";
import type { Types } from "mongoose";
import type { InterfaceEvent, InterfaceRecurrenceRule } from "../../../models";
import {
  ActionItem,
  AppUserProfile,
  Event,
  EventAttendee,
  User,
  RecurrenceRule,
} from "../../../models";
import { shouldUpdateBaseRecurringEvent } from "../updateEventHelpers";
import { removeDanglingDocuments } from "../recurringEventHelpers";

/**
 * Deletes all instances or thisAndFollowingInstances of a recurring event.
 *
 * @param event - The event instance to be deleted:
 *   - For thisAndFollowingInstances, represents the starting instance.
 *   - For allInstances, should be null.
 * @param recurrenceRule - The recurrence rule associated with the instances.
 * @param baseRecurringEvent - The base recurring event from which instances are derived.
 *
 * @remarks
 * This function performs the following steps:
 * 1. Constructs a query object to fetch instances based on the delete type.
 * 2. Retrieves and deletes all associated documents (attendees, users, profiles, action items).
 * 3. Deletes the instances themselves.
 * 4. Updates the recurrence rule and base recurring event as needed.
 * 5. Removes any dangling documents related to the recurrence rule and base recurring event.
 */
export const deleteRecurringEventInstances = async (
  event: InterfaceEvent | null,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<void> => {
  // Construct the query object to filter events to be deleted:
  // - For thisAndFollowingInstances, find all instances after (and including) this one
  // - For allInstances, find all instances
  const eventsQueryObject: {
    recurrenceRuleId: Types.ObjectId;
    baseRecurringEventId: Types.ObjectId;
    isBaseRecurringEvent: boolean;
    isRecurringEventException: boolean;
    startDate?: { $gte: string };
  } = {
    recurrenceRuleId: recurrenceRule._id,
    baseRecurringEventId: baseRecurringEvent._id,
    isBaseRecurringEvent: false,
    isRecurringEventException: false,
  };

  if (event) {
    eventsQueryObject.startDate = { $gte: event.startDate };
  }

  // Get all the instances to be deleted
  const recurringEventInstances = await Event.find(
    {
      ...eventsQueryObject,
    },
    null,
    { session },
  );

  // Get the IDs of those instances
  const recurringEventInstancesIds = recurringEventInstances.map(
    (recurringEventInstance) => recurringEventInstance._id,
  );

  // Remove all associations for the instances that are being deleted
  await Promise.all([
    EventAttendee.deleteMany(
      { eventId: { $in: recurringEventInstancesIds } },
      { session },
    ),

    User.updateMany(
      {
        registeredEvents: { $in: recurringEventInstancesIds },
      },
      {
        $pull: {
          registeredEvents: { $in: recurringEventInstancesIds },
        },
      },
      { session },
    ),

    AppUserProfile.updateMany(
      {
        $or: [
          { createdEvents: { $in: recurringEventInstancesIds } },
          { eventAdmin: { $in: recurringEventInstancesIds } },
        ],
      },
      {
        $pull: {
          createdEvents: { $in: recurringEventInstancesIds },
          eventAdmin: { $in: recurringEventInstancesIds },
        },
      },
      { session },
    ),

    // Delete action items associated with the instances
    ActionItem.deleteMany(
      { eventId: { $in: recurringEventInstancesIds } },
      { session },
    ),

    // Delete the instances themselves
    Event.deleteMany(
      {
        _id: { $in: recurringEventInstancesIds },
      },
      {
        session,
      },
    ),
  ]);

  // Check if there are instances following the current recurrence rule
  const instancesFollowingCurrentRecurrence = await Event.find(
    {
      recurrenceRuleId: recurrenceRule._id,
      isRecurringEventException: false,
    },
    null,
    { session },
  ).sort({ startDate: -1 });

  // Determine if more instances following this recurrence rule exist
  const moreInstancesExist =
    instancesFollowingCurrentRecurrence &&
    instancesFollowingCurrentRecurrence.length;

  if (moreInstancesExist) {
    // Get the latest instance following the current recurrence rule
    const updatedEndDateString =
      instancesFollowingCurrentRecurrence[0].startDate;
    const updatedEndDate = new Date(updatedEndDateString);

    // Update the latestInstanceDate and recurrenceEndDate of the current recurrenceRule
    await RecurrenceRule.findOneAndUpdate(
      {
        _id: recurrenceRule._id,
      },
      {
        latestInstanceDate: updatedEndDate,
        recurrenceEndDate: updatedEndDate,
      },
      { session },
    ).lean();

    // Update the baseRecurringEvent if it is the latest recurrence rule that the instances were following
    if (
      shouldUpdateBaseRecurringEvent(
        recurrenceRule.recurrenceEndDate?.toString(),
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
    // If no instances conforming to the current recurrence rule exist,
    // find any previous recurrence rules associated with this baseRecurringEvent
    const previousRecurrenceRules = await RecurrenceRule.find(
      {
        baseRecurringEventId: baseRecurringEvent._id,
        recurrenceEndDate: { $lt: recurrenceRule.recurrenceStartDate },
      },
      null,
      { session },
    )
      .sort({ recurrenceEndDate: -1 })
      .lean();

    const previousRecurrenceRulesExist =
      previousRecurrenceRules && previousRecurrenceRules.length;
    if (previousRecurrenceRulesExist) {
      // Update the baseRecurringEvent if it is the latest recurrence rule that the instances were following
      if (
        shouldUpdateBaseRecurringEvent(
          recurrenceRule.recurrenceEndDate?.toString(),
          baseRecurringEvent.endDate?.toString(),
        )
      ) {
        await Event.updateOne(
          {
            _id: baseRecurringEvent._id,
          },
          {
            endDate: previousRecurrenceRules[0].recurrenceEndDate.toISOString(),
          },
          { session },
        );
      }
    }
  }

  // Remove any dangling recurrence rule and base recurring event documents
  await removeDanglingDocuments(
    recurrenceRule._id.toString(),
    baseRecurringEvent._id.toString(),
    session,
  );
};
