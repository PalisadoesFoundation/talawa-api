import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { AppUserProfile, Event, EventAttendee, User } from "../../../models";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import type { MutationUpdateEventArgs } from "../../../types/generatedGraphQLTypes";
import { getEventData } from "./getEventData";
import {
  createRecurrenceRule,
  generateRecurrenceRuleString,
  generateRecurringEventInstances,
  getRecurringInstanceDates,
} from "../recurringEventHelpers";

/**
 * This function updates a single non-recurring event.
 * @param args - the arguments provided for the updateEvent mutation.
 * @param event - the single event to be updated.
 * @remarks The following steps are followed:
 * 1. If the single event is made recurring with this update:
 *   - get the appropriate data to create the baseRecurringEvent and recurring event instances.
 *   - generate the instances with createRecurringEvent function.
 *   - remove the current event and its associations as a new series has been created.
 * 2. If it's still a non-recurring event:
 *   - just perform a regular update.
 * @returns The updated event.
 */

export const updateSingleEvent = async (
  args: MutationUpdateEventArgs,
  event: InterfaceEvent,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  let updatedEvent: InterfaceEvent = event;

  if (args.data.recurring) {
    // get the data from args
    const { data: updateEventInputData } = args;
    let { recurrenceRuleData } = args;

    // get latest eventData to be used for baseRecurringEvent and recurring instances
    const eventData = getEventData(updateEventInputData, event);

    if (!recurrenceRuleData) {
      // create a default weekly recurrence rule
      recurrenceRuleData = {
        frequency: "WEEKLY",
        recurrenceStartDate: eventData.startDate,
        recurrenceEndDate: null,
      };
    }

    // get recurrence start and end dates
    const { recurrenceStartDate, recurrenceEndDate } = recurrenceRuleData;

    // generate a recurrence rule string which would be used to generate rrule object
    const recurrenceRuleString =
      generateRecurrenceRuleString(recurrenceRuleData);

    // create a baseRecurringEvent
    const baseRecurringEvent = await Event.create(
      [
        {
          ...eventData,
          recurring: true,
          isBaseRecurringEvent: true,
          startDate: recurrenceStartDate,
          endDate: recurrenceEndDate,
          creatorId: event.creatorId,
          admins: [event.creatorId],
          organization: eventData.organizationId,
        },
      ],
      { session },
    );

    // get recurrence dates
    const recurringInstanceDates = getRecurringInstanceDates(
      recurrenceRuleString,
      recurrenceStartDate,
      recurrenceEndDate,
    );

    // get the startDate of the latest instance following the recurrence
    const latestInstanceDate =
      recurringInstanceDates[recurringInstanceDates.length - 1];

    // create the recurrencerule
    const recurrenceRule = await createRecurrenceRule(
      recurrenceRuleString,
      recurrenceStartDate,
      recurrenceEndDate,
      eventData.organizationId,
      baseRecurringEvent[0]._id.toString(),
      latestInstanceDate,
      session,
    );

    // generate the recurring instances and get an instance back
    updatedEvent = await generateRecurringEventInstances({
      data: eventData,
      baseRecurringEventId: baseRecurringEvent[0]._id.toString(),
      recurrenceRuleId: recurrenceRule?._id.toString(),
      recurringInstanceDates,
      creatorId: event.creatorId,
      organizationId: eventData.organizationId,
      session,
    });

    // remove the current event and its association
    await Promise.all([
      Event.deleteOne(
        {
          _id: event._id,
        },
        { session },
      ),
      EventAttendee.deleteOne({
        eventId: event._id,
        userId: event.creatorId,
      }),
      User.updateOne(
        {
          _id: event.creatorId,
        },
        {
          $pull: {
            registeredEvents: event._id,
          },
        },
        { session },
      ),
      AppUserProfile.updateOne(
        {
          userId: event.creatorId,
        },
        {
          $push: {
            eventAdmin: event._id,
            createdEvents: event._id,
          },
        },
      ),
    ]);
  } else {
    // else (i.e. the event is still non-recurring), just perform a regular update
    updatedEvent = (await Event.findOneAndUpdate(
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
    ).lean()) as InterfaceEvent;

    if (updatedEvent !== null) {
      await cacheEvents([updatedEvent]);
    }
  }

  return updatedEvent;
};
