import type mongoose from "mongoose";
import type { InterfaceEvent } from "../../../models";
import { Event } from "../../../models";
import type { MutationCreateEventArgs } from "../../../types/generatedGraphQLTypes";
import {
  generateRecurrenceRuleString,
  getRecurringInstanceDates,
  createRecurrenceRule,
  generateRecurringEventInstances,
} from "../recurringEventHelpers";

/**
 * This function creates the instances of a recurring event upto a certain date.
 * @param args - payload of the createEvent mutation
 * @param creatorId - _id of the creator
 * @param organizationId - _id of the organization the events belongs to
 * @remarks The following steps are followed:
 * 1. Create a default recurrenceRuleData.
 * 2. Generate a recurrence rule string based on the recurrenceRuleData.
 * 3. Create a baseRecurringEvent on which recurring instances would be based.
 * 4. Get the dates for recurring instances.
 * 5. Create a recurrenceRule document.
 * 6. Generate recurring instances according to the recurrence rule.
 * @returns Created recurring event instance
 */

export const createRecurringEvent = async (
  args: MutationCreateEventArgs,
  creatorId: string,
  organizationId: string,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
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
    data?.endDate,
  );

  // create a base recurring event first, based on which all the
  // recurring instances would be dynamically generated
  const baseRecurringEvent = await Event.create(
    [
      {
        ...data,
        recurring: true,
        isBaseRecurringEvent: true,
        creatorId,
        admins: [creatorId],
        organization: organizationId,
      },
    ],
    { session },
  );

  // get the dates for the recurringInstances, and the date of the last instance
  // to be generated in this operation (rest would be generated dynamically during query)
  const recurringInstanceDates = getRecurringInstanceDates(
    recurrenceRuleString,
    data.startDate,
    data.endDate,
  );

  // get the date for the latest created instance
  const latestInstanceDate =
    recurringInstanceDates[recurringInstanceDates.length - 1];
  // create a recurrenceRule document that would contain the recurrence pattern
  const recurrenceRule = await createRecurrenceRule(
    recurrenceRuleString,
    data.startDate,
    data.endDate,
    organizationId,
    baseRecurringEvent[0]?._id.toString(),
    latestInstanceDate,
    session,
  );

  // generate the recurring instances and get an instance back
  const recurringEventInstance = await generateRecurringEventInstances({
    data,
    baseRecurringEventId: baseRecurringEvent[0]?._id.toString(),
    recurrenceRuleId: recurrenceRule?._id.toString(),
    recurringInstanceDates,
    creatorId,
    organizationId,
    session,
  });

  return recurringEventInstance;
};
