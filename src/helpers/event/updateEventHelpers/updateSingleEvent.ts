import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, EventAttendee, User } from "../../../models";
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

  if (args.data?.recurring) {
    // get the data from args
    const { data: updateEventInputData } = args;
    let { recurrenceRuleData } = args;

    // get latest eventData to be used for baseRecurringEvent and recurring instances
    const eventData = getEventData(updateEventInputData, event);

    if (!recurrenceRuleData) {
      // create a default weekly recurrence rule
      recurrenceRuleData = {
        frequency: "WEEKLY",
      };
    }

    // get the recurrence startDate, if provided, else, use event startDate
    const startDate = new Date(eventData.startDate);
    // get the recurrence endDate, if provided or made null (infinitely recurring)
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;

    // generate a recurrence rule string which would be used to generate rrule object
    const recurrenceRuleString = generateRecurrenceRuleString(
      recurrenceRuleData,
      startDate,
      endDate ? endDate : undefined,
    );

    // create a baseRecurringEvent
    const baseRecurringEvent = await Event.create(
      [
        {
          ...eventData,
          organization: eventData.organizationId,
          recurring: true,
          isBaseRecurringEvent: true,
        },
      ],
      { session },
    );

    // get recurrence dates
    const recurringInstanceDates = getRecurringInstanceDates(
      recurrenceRuleString,
      startDate,
      endDate,
    );

    // get the startDate of the latest instance following the recurrence
    const latestInstanceDate =
      recurringInstanceDates[recurringInstanceDates.length - 1];

    // create the recurrencerule
    const recurrenceRule = await createRecurrenceRule(
      recurrenceRuleString,
      startDate,
      endDate,
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
            eventAdmin: event._id,
            createdEvents: event._id,
            registeredEvents: event._id,
          },
        },
        { session },
      ),
    ]);
  } else {
    // else (i.e. the event is still non-recurring), just perform a regular update
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
  }

  return updatedEvent;
};
