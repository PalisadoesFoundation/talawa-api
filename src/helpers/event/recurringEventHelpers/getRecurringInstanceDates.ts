import { addMonths } from "date-fns";
import { rrulestr } from "rrule";
import { RECURRING_EVENT_INSTANCES_MONTH_LIMIT } from "../../../constants";

/**
 * This function returns the dates for the recurring event instances.
 * @param recurrenceRuleString - the rrule string for the recurrenceRule.
 * @param recurrenceStartDate - the starting date from which we want to generate instances.
 * @param eventEndDate - the end date of the event
 * @param calendarDate - the last date of the current calendar month (To be used during query).
 * @remarks The following steps are followed:
 * 1. Limit the end date for instance creation.
 * 2. Getting the date upto which we would generate instances during this operation (leaving the rest for dynamic generation).
 * 3. Getting the dates for recurring instances.
 * @returns The recurring instance dates and the date of last instance generated during this operation.
 */

export function getRecurringInstanceDates(
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  eventEndDate: Date | null,
  calendarDate: Date = recurrenceStartDate
): [Date[], Date] {
  const limitEndDate = addMonths(
    calendarDate,
    RECURRING_EVENT_INSTANCES_MONTH_LIMIT
    // generate instances upto this many months ahead
    // leave the rest for dynamic generation during queries
  );

  eventEndDate = eventEndDate || limitEndDate;

  const generateUptoDate = new Date(
    Math.min(eventEndDate.getTime(), limitEndDate.getTime())
  );

  const recurrenceRuleObject = rrulestr(recurrenceRuleString);

  const recurringInstanceDates = recurrenceRuleObject.between(
    recurrenceStartDate,
    generateUptoDate,
    true
  );

  const latestInstanceDate =
    recurringInstanceDates[recurringInstanceDates.length - 1];

  return [recurringInstanceDates, latestInstanceDate];
}
