import type mongoose from "mongoose";
import { format } from "date-fns";
import type { InterfaceEvent } from "../../../models";
import { Event, EventAttendee, User } from "../../../models";
import type { EventInput } from "../../../types/generatedGraphQLTypes";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";

/**
 * This function generates the recurring event instances.
 * @param data - the EventInput data provided in the args.
 * @param baseRecurringEventId - _id of the baseRecurringEvent.
 * @param recurrenceRuleId - _id of the recurrenceRule document containing the recurrence rule that the instances follow.
 * @param recurringInstanceDates - the dates of the recurring instances.
 * @param currentUserId - _id of the current user.
 * @param organizationId - _id of the current organization.
 * @remarks The following steps are followed:
 * 1. Generate the instances for each provided date.
 * 2. Insert the documents in the database.
 * 3. Associate the instances with the user.
 * 4. Cache the instances.
 * @returns A recurring instance generated during this operation.
 */

interface InterfaceGenerateRecurringInstances {
  data: EventInput;
  baseRecurringEventId: string;
  recurrenceRuleId: string;
  recurringInstanceDates: Date[];
  currentUserId: string;
  organizationId: string;
  session: mongoose.ClientSession;
}

interface InterfaceRecurringEvent extends EventInput {
  isBaseRecurringEvent: boolean;
  recurrenceRuleId: string;
  baseRecurringEventId: string;
  creatorId: string;
  admins: string[];
  organization: string;
}

export const generateRecurringEventInstances = async ({
  data,
  baseRecurringEventId,
  recurrenceRuleId,
  recurringInstanceDates,
  currentUserId,
  organizationId,
  session,
}: InterfaceGenerateRecurringInstances): Promise<InterfaceEvent> => {
  const recurringInstances: InterfaceRecurringEvent[] = [];
  recurringInstanceDates.map((date) => {
    const formattedInstanceDate = format(date, "yyyy-MM-dd");

    const createdEventInstance = {
      ...data,
      startDate: formattedInstanceDate,
      endDate: formattedInstanceDate,
      recurring: true,
      isBaseRecurringEvent: false,
      recurrenceRuleId: recurrenceRuleId,
      baseRecurringEventId: baseRecurringEventId,
      creatorId: currentUserId,
      admins: [currentUserId],
      organization: organizationId,
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
      userId: currentUserId,
      eventId: recurringEventInstance?._id.toString(),
    })
  );

  await EventAttendee.insertMany(eventAttendees, { session });

  const eventInstanceIds = recurringEventInstances.map((instance) =>
    instance._id.toString()
  );

  // update user event fields to include generated instances
  await User.updateOne(
    { _id: currentUserId },
    {
      $push: {
        eventAdmin: { $each: eventInstanceIds },
        createdEvents: { $each: eventInstanceIds },
        registeredEvents: { $each: eventInstanceIds },
      },
    },
    { session }
  );

  // cache the instances
  await Promise.all(
    recurringEventInstances.map((recurringEventInstance) =>
      cacheEvents([recurringEventInstance])
    )
  );

  return recurringEventInstances[0];
};
