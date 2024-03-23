import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { AppUserProfile, Event, EventAttendee, User } from "../../../models";
import type { EventInput } from "../../../types/generatedGraphQLTypes";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

/**
 * This function generates the recurring event instances.
 * @param data - the EventInput data provided in the args.
 * @param baseRecurringEventId - _id of the baseRecurringEvent.
 * @param recurrenceRuleId - _id of the recurrenceRule document containing the recurrence rule that the instances follow.
 * @param recurringInstanceDates - the dates of the recurring instances.
 * @param creatorId - _id of the creator.
 * @param organizationId - _id of the current organization.
 * @remarks The following steps are followed:
 * 1. Generate the instances for each provided date.
 * 2. Insert the documents in the database.
 * 3. Associate the instances with the user.
 * 4. Cache the instances.
 * @returns A recurring instance generated during this operation.
 */

interface InterfaceGenerateRecurringInstances {
  data: InterfaceRecurringEvent;
  baseRecurringEventId: string;
  recurrenceRuleId: string;
  recurringInstanceDates: Date[];
  creatorId: string;
  organizationId: string;
  status?: string;
  session: mongoose.ClientSession;
}

export interface InterfaceRecurringEvent extends EventInput {
  isBaseRecurringEvent?: boolean;
  recurrenceRuleId?: string;
  baseRecurringEventId?: string;
  creatorId?: string;
  admins?: string[];
  organization?: string;
  status?: string;
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
  const recurringInstances: InterfaceRecurringEvent[] = [];
  recurringInstanceDates.map((date): void => {
    const createdEventInstance = {
      ...data,
      startDate: date,
      endDate: date,
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId,
      baseRecurringEventId,
      creatorId,
      admins: data.admins && data.admins.length ? data.admins : [creatorId],
      organization: organizationId,
      status: data.status,
    };

    recurringInstances.push(createdEventInstance);
  });

  //Bulk insertion in database
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
