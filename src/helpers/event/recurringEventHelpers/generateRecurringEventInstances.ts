import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { AppUserProfile, Event, EventAttendee, User } from "../../../models";
import type { EventInput } from "../../../types/generatedGraphQLTypes";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import { addDays, differenceInDays } from "date-fns";

/**
 * This function generates the recurring event instances.
 * @param data - the EventInput data provided in the args.
 * @param baseRecurringEventId - _id of the baseRecurringEvent.
 * @param recurrenceRuleId - _id of the recurrenceRule document containing the recurrence rule that the instances follow.
 * @param recurringInstanceDates - the dates of the recurring instances.
 * @param creatorId - _id of the creator.
 * @param organizationId - _id of the current organization.
 * @remarks The following steps are followed:
 * 1. Gets the start and end dates for instances.
 * 2. Generate the instances.
 * 3. Insert the documents in the database.
 * 4. Associate the instances with the user.
 * 5. Cache the instances.
 * @returns A recurring instance generated during this operation.
 */

interface InterfaceGenerateRecurringInstances {
  data: InterfaceRecurringEvent;
  baseRecurringEventId: string;
  recurrenceRuleId: string;
  recurringInstanceDates: Date[];
  creatorId: string;
  organizationId: string;
  session: mongoose.ClientSession;
}

export interface InterfaceRecurringEvent extends EventInput {
  isBaseRecurringEvent?: boolean;
  recurrenceRuleId?: string;
  baseRecurringEventId?: string;
  creatorId?: string;
  admins?: string[];
  organization?: string;
}

export const generateRecurringEventInstances = async ({
  data,
  baseRecurringEventId,
  recurrenceRuleId,
  recurringInstanceDates,
  creatorId,
  organizationId,
  session,
}: InterfaceGenerateRecurringInstances): Promise<InterfaceEvent> => {
  // get the start and end dates from the data
  const { startDate, endDate } = data;

  // this is the difference between the start and end dates of the event
  // it will be used for creating events that last multiple days
  // e.g if an event has startDate: "2024-04-15" & endDate: "2024-04-17", i.e. event lasts 2 days
  // then, all the new instances generated would also have this 2 day gap between their start and end dates
  let eventDurationInDays = 0;

  // during createEventMutation, startDate & endDate would exist, so the difference would
  // be calculated with these dates
  if (endDate) {
    eventDurationInDays = differenceInDays(endDate, startDate);
  }

  // during queries, while dynamically generating new instances,
  // we would find this difference with the start and end dates of the latestGeneratedInstance
  const latestGeneratedInstance = await Event.findOne({
    recurrenceRuleId,
    baseRecurringEventId,
    isRecurringEventException: false,
  }).sort({ startDate: -1 });

  if (latestGeneratedInstance) {
    // it would exist during queries (i.e. during dynamic generation)
    eventDurationInDays = differenceInDays(
      latestGeneratedInstance.endDate as string,
      latestGeneratedInstance.startDate,
    );
  }

  // get the recurring event instances
  const recurringInstances: InterfaceRecurringEvent[] = [];
  recurringInstanceDates.map((date): void => {
    // get the start date for the instance
    const instanceStartDate = date;
    // get the end date of the instance
    const instanceEndDate = addDays(date, eventDurationInDays);

    const createdEventInstance = {
      ...data,
      startDate: instanceStartDate,
      endDate: instanceEndDate,
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId,
      baseRecurringEventId,
      creatorId,
      admins: data.admins && data.admins.length ? data.admins : [creatorId],
      organization: organizationId,
    };

    recurringInstances.push(createdEventInstance);
  });

  // Bulk insertion in database
  const recurringEventInstances = await Event.insertMany(recurringInstances, {
    session,
  });

  // add eventattendee for each instance
  const eventAttendees = recurringEventInstances.map(
    (recurringEventInstance) => ({
      userId: creatorId,
      eventId: recurringEventInstance?._id.toString(),
    }),
  );

  // get event instances ids for updating user event fields to include generated instances
  const eventInstanceIds = recurringEventInstances.map((instance) =>
    instance._id.toString(),
  );

  // perform database operations
  await Promise.all([
    EventAttendee.insertMany(eventAttendees, { session }),
    User.updateOne(
      { _id: creatorId },
      {
        $push: {
          registeredEvents: { $each: eventInstanceIds },
        },
      },
      { session },
    ),
    AppUserProfile.updateOne(
      {
        userId: creatorId,
      },
      {
        $push: {
          eventAdmin: { $each: eventInstanceIds },
          createdEvents: { $each: eventInstanceIds },
        },
      },
    ),
  ]);

  // cache the instances
  await Promise.all(
    recurringEventInstances.map((recurringEventInstance) =>
      cacheEvents([recurringEventInstance]),
    ),
  );

  return recurringEventInstances[0];
};
