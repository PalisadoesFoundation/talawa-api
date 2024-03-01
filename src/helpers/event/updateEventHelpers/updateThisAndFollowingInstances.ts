import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, EventAttendee, User } from "../../../models";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import type { InterfaceRecurrenceRule } from "../../../models/RecurrenceRule";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import {
  createRecurrenceRule,
  generateRecurrenceRuleString,
  generateRecurringEventInstances,
  getRecurringInstanceDates,
} from "../recurringEventHelpers";
import { getEventData, shouldUpdateBaseRecurringEvent } from "./index";

/**
 * This function updates this and the following instances of a recurring event.
 * @param args - update event args.
 * @param event - the event to be updated.
 * @param recurrenceRule - the recurrence rule followed by the instances.
 * @param baseRecurringEvent - the base recurring event.
 * @remarks The following steps are followed:
 * 1. Check if the recurrence rule has been changed.
 * 2. If the recurrence rule has been changed.
 *   - get the appropriate data to create the baseRecurringEvent and recurring event instances.
 *   - generate the instances with createRecurringEvent function.
 *   - remove the current event and its associations as a new series has been created.
 * 3. If the recurrence rule hasn't changed:
 *   - just perform a bulk regular update.
 * 4. Update the base recurring event if required.
 * @returns The updated first instance of the recurrence rule.
 */

export const updateThisAndFollowingInstances = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  recurrenceRule: InterfaceRecurrenceRule,
  baseRecurringEvent: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  // initiate the new recurrence rule string
  let newRecurrenceRuleString = recurrenceRule.recurrenceRuleString;

  // get the data from the args
  const { data: updateEventInputData, recurrenceRuleData } = args;

  // get the start and end dates for the recurrence
  const startDate = updateEventInputData?.startDate || recurrenceRule.startDate;
  const endDate =
    updateEventInputData?.endDate || updateEventInputData?.endDate === null
      ? updateEventInputData.endDate
      : recurrenceRule.endDate;

  // check if the recurrence rule has changed
  if (recurrenceRuleData) {
    newRecurrenceRuleString = generateRecurrenceRuleString(
      recurrenceRuleData,
      startDate,
      endDate ?? undefined,
    );
  }

  if (newRecurrenceRuleString !== recurrenceRule.recurrenceRuleString) {
    // if the recurrence rule has changed, delete the currenct recurrence series, and generate a new one

    // get latest eventData to be used for baseRecurringEvent and recurring instances
    const eventData = getEventData(updateEventInputData, event);

    // get the recurrence startDate
    const recurrenceStartDate = new Date(eventData.startDate);

    // get recurrence dates
    const recurringInstanceDates = getRecurringInstanceDates(
      newRecurrenceRuleString,
      recurrenceStartDate,
      endDate,
    );

    // get the startDate of the latest instance following the recurrence
    const latestInstanceDate =
      recurringInstanceDates[recurringInstanceDates.length - 1];

    // create the recurrencerule
    const newRecurrenceRule = await createRecurrenceRule(
      newRecurrenceRuleString,
      recurrenceStartDate,
      endDate,
      eventData.organizationId,
      baseRecurringEvent._id.toString(),
      latestInstanceDate,
      session,
    );

    // generate the recurring instances and get an instance back
    updatedEvent = await generateRecurringEventInstances({
      data: eventData,
      baseRecurringEventId: baseRecurringEvent._id.toString(),
      recurrenceRuleId: newRecurrenceRule?._id.toString(),
      recurringInstanceDates,
      creatorId: event.creatorId,
      organizationId: eventData.organizationId,
      session,
    });

    // remove the events conforming to the current recurrence rule and their associations
    const recurringEventInstances = await Event.find(
      {
        recurrenceRuleId: event.recurrenceRuleId,
        startDate: { $gte: event.startDate },
        isRecurringEventException: false,
      },
      null,
      { session },
    );
    const recurringEventInstancesIds = recurringEventInstances.map(
      (recurringEventInstance) => recurringEventInstance._id,
    );

    await Promise.all([
      Event.deleteMany(
        {
          _id: { $in: recurringEventInstancesIds },
        },
        { session },
      ),
      EventAttendee.deleteMany(
        {
          eventId: { $in: recurringEventInstancesIds },
        },
        { session },
      ),
      User.updateOne(
        {
          _id: event.creatorId,
        },
        {
          $pull: {
            eventAdmin: { $in: recurringEventInstancesIds },
            createdEvents: { $in: recurringEventInstancesIds },
            registeredEvents: { $in: recurringEventInstancesIds },
          },
        },
        { session },
      ),
    ]);

    // get the instances following the old recurrence rule
    const eventsFollowingCurrentRecurrence = await Event.find(
      {
        recurrenceRuleId: recurrenceRule._id,
        isRecurringEventException: false,
      },
      null,
      { session },
    ).sort({ startDate: -1 });

    if (
      eventsFollowingCurrentRecurrence &&
      eventsFollowingCurrentRecurrence.length
    ) {
      // get the latest instance following the old recurrence rule
      const updatedLatestRecurringInstanceDate = new Date(
        eventsFollowingCurrentRecurrence[0].startDate,
      );
      // find the latest instance for the old recurrence rule and update it
      await RecurrenceRule.findOneAndUpdate(
        {
          _id: recurrenceRule._id,
        },
        {
          latestInstanceDate: updatedLatestRecurringInstanceDate,
          endDate: updatedLatestRecurringInstanceDate,
        },
        { session },
      ).lean();
    }
  } else {
    // perform bulk update on the events following the current event's recurrence rule
    await Event.updateMany(
      {
        recurrenceRuleId: event.recurrenceRuleId,
        startDate: { $gte: event.startDate },
        isRecurringEventException: false,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        session,
      },
    );

    updatedEvent = await Event.findOne({
      _id: event._id,
    }).lean();
  }

  // update the baseRecurringEvent if it is the latest recurrence rule that the instances are following
  if (
    shouldUpdateBaseRecurringEvent(
      recurrenceRule?.endDate?.toString(),
      baseRecurringEvent?.endDate?.toString(),
    )
  ) {
    await Event.updateOne(
      {
        _id: event.baseRecurringEventId,
      },
      {
        ...(args.data as Partial<InterfaceEvent>),
      },
      {
        session,
      },
    );
  }

  return updatedEvent;
};
