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
 * Creates instances of a recurring event up to a specified end date.
 *
 * @param args - The payload of the createEvent mutation, including event data and recurrence rule.
 * @param creatorId - The ID of the event creator.
 * @param organizationId - The ID of the organization to which the event belongs.
 * @param session - The MongoDB client session for transactional operations.
 * @returns The created instance of the recurring event.
 *
 * @see Parent file:
 * - `resolvers/Mutation/createEvent.ts`
 * - `resolvers/Query/eventsByOrganizationConnection.ts`
 *
 * @remarks
 * Steps performed by this function:
 * 1. If no recurrence rule is provided, defaults to weekly recurrence starting from a given date.
 * 2. Generates a recurrence rule string based on provided or default recurrence data.
 * 3. Creates a base recurring event template in the database.
 * 4. Retrieves dates for all recurring instances based on the recurrence rule.
 * 5. Saves the recurrence rule in the database for future reference.
 * 6. Generates and saves instances of recurring events based on the recurrence rule.
 */

export const createRecurringEvent = async (
  args: MutationCreateEventArgs,
  creatorId: string,
  organizationId: string,
  session: mongoose.ClientSession,
): Promise<InterfaceEvent> => {
  // Extract event data and recurrence rule information from arguments
  const { data } = args;
  let { recurrenceRuleData } = args;

  // Set a default weekly recurrence rule if none is provided
  if (!recurrenceRuleData) {
    recurrenceRuleData = {
      frequency: "WEEKLY",
      recurrenceStartDate: data.startDate,
      recurrenceEndDate: null,
    };
  }

  const { recurrenceStartDate, recurrenceEndDate } = recurrenceRuleData;

  // 1. Generate a string representation of the recurrence rule
  const recurrenceRuleString = generateRecurrenceRuleString(recurrenceRuleData);

  // 2.create a base recurring event first, based on which all the
  // recurring instances would be dynamically generated
  const baseRecurringEvent = await Event.create(
    [
      {
        ...data, // Spread event data from original arguments
        recurring: true,
        startDate: recurrenceStartDate,
        endDate: recurrenceEndDate,
        isBaseRecurringEvent: true,
        creatorId,
        admins: [creatorId],
        organization: organizationId,
      },
    ],
    { session }, // Use the provided session if available
  );

  // 3. get the dates for the recurringInstances, and the date of the last instance
  // to be generated in this operation (rest would be generated dynamically during query)
  const recurringInstanceDates = getRecurringInstanceDates(
    recurrenceRuleString,
    recurrenceStartDate,
    recurrenceEndDate,
  );

  // 4. Extract the date of the last created instance
  const latestInstanceDate =
    recurringInstanceDates[recurringInstanceDates.length - 1];

  // 5. Create a separate document to store the recurrence pattern details
  const recurrenceRule = await createRecurrenceRule(
    recurrenceRuleString,
    recurrenceStartDate,
    recurrenceEndDate,
    organizationId,
    baseRecurringEvent[0]?._id.toString(), // Get ID of the base event
    latestInstanceDate,
    session,
  );

  // 6. Generate all the recurring event instances based on the rule and dates
  const recurringEventInstance = await generateRecurringEventInstances({
    data, // Event data for all instances
    baseRecurringEventId: baseRecurringEvent[0]?._id.toString(), // Base event ID
    recurrenceRuleId: recurrenceRule?._id.toString(), // Recurrence rule ID
    recurringInstanceDates, // Array of dates for each instance
    creatorId,
    organizationId,
    session,
  });

  return recurringEventInstance;
};
