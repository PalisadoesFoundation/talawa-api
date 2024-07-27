import { addYears } from "date-fns";
import { Frequency, rrulestr } from "rrule";
import type { RRule } from "rrule";
import {
  RECURRING_EVENT_INSTANCES_DAILY_LIMIT,
  RECURRING_EVENT_INSTANCES_WEEKLY_LIMIT,
  RECURRING_EVENT_INSTANCES_MONTHLY_LIMIT,
  RECURRING_EVENT_INSTANCES_YEARLY_LIMIT,
} from "../../../constants";

/**
 * Generates dates of recurrence for the recurring event based on provided recurrence rules.
 * @param recurrenceRuleString - The rrule string defining the recurrence rules.
 * @param recurrenceStartDate - The starting date from which to generate instances.
 * @param recurrenceEndDate - The end date of the event.
 * @param queryUptoDate - The limit date for querying recurrence rules (used for dynamic instance generation during queries).
 * @remarks
 * This function performs the following steps:
 * 1. Determines the date limit for instance generation based on the recurrence frequency.
 * 2. Retrieves dates for recurring event instances within the specified limits.
 * @returns Dates for recurring instances to be generated during this operation.
 */
export function getRecurringInstanceDates(
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  recurrenceEndDate: Date | null,
  queryUptoDate: Date = recurrenceStartDate,
): Date[] {
  // Parse the rrule string to get the rrule object
  const recurrenceRuleObject: RRule = rrulestr(recurrenceRuleString);

  // Get the recurrence frequency from the rrule options
  const { freq: recurrenceFrequency } = recurrenceRuleObject.options;

  // Determine the limit end date based on recurrence frequency
  let limitEndDate = addYears(
    queryUptoDate,
    RECURRING_EVENT_INSTANCES_DAILY_LIMIT,
  );

  if (recurrenceFrequency === Frequency.WEEKLY) {
    limitEndDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_WEEKLY_LIMIT,
    );
  } else if (recurrenceFrequency === Frequency.MONTHLY) {
    limitEndDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_MONTHLY_LIMIT,
    );
  } else if (recurrenceFrequency === Frequency.YEARLY) {
    limitEndDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_YEARLY_LIMIT,
    );
  }

  // If the event has no specified end date, use the limit end date
  recurrenceEndDate = recurrenceEndDate || limitEndDate;

  // Determine the date up to which we will generate instances in this operation
  const generateUptoDate = new Date(
    Math.min(recurrenceEndDate.getTime(), limitEndDate.getTime()),
  );

  // Retrieve the dates of recurrence based on the rrule and limits
  const recurringInstanceDates = recurrenceRuleObject.between(
    recurrenceStartDate,
    generateUptoDate,
    true, // Inclusive of start date
  );

  return recurringInstanceDates;
}
