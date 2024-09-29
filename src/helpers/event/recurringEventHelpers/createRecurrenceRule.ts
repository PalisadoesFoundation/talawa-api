import type mongoose from "mongoose";
import { rrulestr } from "rrule";
import type { InterfaceRecurrenceRule } from "../../../models";
import { RecurrenceRule } from "../../../models";
import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_WEEKDAYS,
} from "../../../constants";

/**
 * Creates a recurrence rule document based on the provided parameters.
 * @param recurrenceRuleString - The string representation of the recurrence rule (RRULE).
 * @param recurrenceStartDate - The start date of recurrence.
 * @param recurrenceEndDate - The end date of recurrence, if specified.
 * @param organizationId - The unique identifier of the organization to which the recurrence rule belongs.
 * @param baseRecurringEventId - The ID of the base recurring event this rule is associated with.
 * @param latestInstanceDate - The start date of the last instance generated during this operation.
 * @param session - The MongoDB client session for transactional operations.
 * @remarks
 * This function performs the following steps:
 * 1. Parses the recurrenceRuleString into an rrule object using rrule string.
 * 2. Extracts relevant fields from the rrule object such as frequency, weekdays, interval, etc.
 * 3. Creates a new RecurrenceRule document in the database with the extracted fields.
 * @returns The created recurrence rule document.
 */
export const createRecurrenceRule = async (
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  recurrenceEndDate: Date | null,
  organizationId: string,
  baseRecurringEventId: string,
  latestInstanceDate: Date,
  session: mongoose.ClientSession,
): Promise<InterfaceRecurrenceRule> => {
  // Parse the recurrenceRuleString into an rrule object
  const recurrenceRuleObject = rrulestr(recurrenceRuleString);

  // Extract necessary fields from the rrule object
  const { freq, byweekday, interval, count, bysetpos } =
    recurrenceRuleObject.options;

  // Map rrule frequency to human-readable string
  const frequency = RECURRENCE_FREQUENCIES[freq];

  // Map rrule weekdays to human-readable strings
  const weekDays: string[] = [];
  if (byweekday) {
    for (const weekday of byweekday) {
      weekDays.push(RECURRENCE_WEEKDAYS[weekday]);
    }
  }

  // Extract the week day occurrence in month if available
  let weekDayOccurenceInMonth = undefined;
  if (bysetpos?.length) {
    weekDayOccurenceInMonth = bysetpos[0];
  }

  // Create the RecurrenceRule document in the database
  const recurrenceRule = await RecurrenceRule.create(
    [
      {
        organizationId,
        baseRecurringEventId,
        recurrenceRuleString,
        recurrenceStartDate,
        recurrenceEndDate,
        frequency,
        weekDays,
        interval,
        count,
        weekDayOccurenceInMonth,
        latestInstanceDate,
      },
    ],
    { session },
  );

  // Return the created recurrence rule document
  return recurrenceRule[0].toObject();
};
