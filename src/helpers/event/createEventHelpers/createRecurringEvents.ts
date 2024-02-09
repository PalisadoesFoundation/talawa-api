import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event, EventAttendee, User } from "../../../models";
import type { MutationCreateEventArgs } from "../../../types/generatedGraphQLTypes";
import {
  generateRecurrenceRuleString,
  getRecurringInstanceDates,
  createRecurrenceRule,
  generateRecurringEventInstances,
} from "../recurringEventHelpers";
import { cacheEvents } from "../../../services/EventCache/cacheEvents";
import { format } from "date-fns";

/**
 * This function creates the instances of a recurring event upto a certain date.
 * @param args - payload of the createEvent mutation
 * @param currentUserId - _id of the current user
 * @param organizationId - _id of the organization the events belongs to
 * @remarks The following steps are followed:
 * 1. Create a default recurrenceRuleData.
 * 2. Generate a recurrence rule string based on the recurrenceRuleData.
 * 3. Create a baseRecurringEvent on which recurring instances would be based.
 * 4. Get the dates for recurring instances.
 * 5. Create a recurrenceRule document.
 * 6. Generate recurring instances according to the recurrence rule.
 * 7. Associate the instances with the user
 * 8. Cache the instances.
 * @returns Created recurring event instances
 */

export const createRecurringEvents = async (
  args: MutationCreateEventArgs,
  currentUserId: string,
  organizationId: string,
  session: mongoose.ClientSession
): Promise<InterfaceEvent[]> => {
  const { data } = args;
  let { recurrenceRuleData } = args;

  if (!recurrenceRuleData) {
    // create a default weekly recurrence rule
    recurrenceRuleData = {
      frequency: "WEEKLY",
    };
  }

  // generate a recurrence rule string which would be used to generate rrule object
  // and get recurrence dates
  const recurrenceRuleString = generateRecurrenceRuleString(
    recurrenceRuleData,
    data?.startDate,
    data?.endDate
  );

  const formattedStartDate = format(data.startDate, "yyyy-MM-dd");
  let formattedEndDate = undefined;
  if (data.endDate) {
    formattedEndDate = format(data.endDate, "yyyy-MM-dd");
  }

  // create a base recurring event first, based on which all the
  // recurring instances would be dynamically generated
  const baseRecurringEvent = await Event.create(
    [
      {
        ...data,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        recurring: true,
        isBaseRecurringEvent: true,
        creatorId: currentUserId,
        admins: [currentUserId],
        organization: organizationId,
      },
    ],
    { session }
  );

  // get the dates for the recurringInstances, and the date of the last instance
  // to be generated in this operation (rest would be generated dynamically during query)
  const [recurringInstanceDates, latestInstanceDate] =
    getRecurringInstanceDates(
      recurrenceRuleString,
      data.startDate,
      data.endDate
    );

  // create a recurrenceRule document that would contain the recurrence pattern
  const recurrenceRule = await createRecurrenceRule(
    recurrenceRuleString,
    data.startDate,
    data.endDate,
    organizationId.toString(),
    baseRecurringEvent[0]?._id.toString(),
    latestInstanceDate,
    session
  );

  // generate the recurring instances
  const recurringEventInstances = await generateRecurringEventInstances({
    data,
    baseRecurringEventId: baseRecurringEvent[0]?._id.toString(),
    recurrenceRuleId: recurrenceRule?._id.toString(),
    recurringInstanceDates,
    currentUserId: currentUserId.toString(),
    organizationId: organizationId.toString(),
    session,
  });

  // associate the instances with the user
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

  return recurringEventInstances;
};
