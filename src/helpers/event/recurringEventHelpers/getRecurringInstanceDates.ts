import { addMonths } from "date-fns";
import { rrulestr } from "rrule";
import { RECURRING_EVENT_INSTANCES_MONTH_LIMIT } from "../../../constants";

/**
 * This function generates the dates of recurrence for the recurring event.
 * @param recurrenceRuleString - the rrule string for the recurrenceRule.
 * @param recurrenceStartDate - the starting date from which we want to generate instances.
 * @param eventEndDate - the end date of the event
 * @param calendarDate - the last date of the current calendar month (To be used during query).
 * @remarks The following steps are followed:
 * 1. Limit the end date for instance creation.
 * 3. Get the dates for recurring instances.
 * @returns Dates for recurring instances to be generated during this operation.
 */

export function getRecurringInstanceDates(
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  eventEndDate: Date | null,
  calendarDate: Date = recurrenceStartDate
): Date[] {
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

  return recurringInstanceDates;
}
