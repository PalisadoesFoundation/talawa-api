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
 * This function generates the dates of recurrence for the recurring event.
 * @param recurrenceRuleString - the rrule string for the recurrenceRule.
 * @param recurrenceStartDate - the starting date from which we want to generate instances.
 * @param eventEndDate - the end date of the event
 * @param queryUptoDate - the limit date to query recurrenceRules (To be used for dynamic instance generation during queries).
 * @remarks The following steps are followed:
 * 1. Get the date limit for instance generation based on its recurrence frequency.
 * 2. Get the dates for recurring event instances.
 * @returns Dates for recurring instances to be generated during this operation.
 */

export function getRecurringInstanceDates(
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  eventEndDate: Date | null,
  queryUptoDate: Date = recurrenceStartDate
): Date[] {
  // get the rrule object
  const recurrenceRuleObject: RRule = rrulestr(recurrenceRuleString);

  // get the recurrence frequency
  const { freq: recurrenceFrequency } = recurrenceRuleObject.options;

  // set limitEndDate according to the recurrence frequency
  // and queryUptoDate, which would default to recurrenceStartDate during createRecurringEvent mutation
  // and have a specific value during queries
  let limitEndDate = addYears(
    queryUptoDate,
    RECURRING_EVENT_INSTANCES_DAILY_LIMIT
  );

  if (recurrenceFrequency === Frequency.WEEKLY) {
    limitEndDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_WEEKLY_LIMIT
    );
  } else if (recurrenceFrequency === Frequency.MONTHLY) {
    limitEndDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_MONTHLY_LIMIT
    );
  } else if (recurrenceFrequency === Frequency.YEARLY) {
    limitEndDate = addYears(
      queryUptoDate,
      RECURRING_EVENT_INSTANCES_YEARLY_LIMIT
    );
  }

  // if the event has no endDate
  eventEndDate = eventEndDate || limitEndDate;

  // the date upto which we would generate the instances in this operation
  const generateUptoDate = new Date(
    Math.min(eventEndDate.getTime(), limitEndDate.getTime())
  );

  // get the dates of recurrence
  const recurringInstanceDates = recurrenceRuleObject.between(
    recurrenceStartDate,
    generateUptoDate,
    true
  );

  return recurringInstanceDates;
}
