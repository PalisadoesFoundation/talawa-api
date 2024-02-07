import { addMonths } from "date-fns";
import { rrulestr } from "rrule";
import { RECURRING_EVENT_INSTANCES_MONTH_LIMIT } from "../../../constants";

export function getRecurringInstanceDates(
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  eventEndDate: Date | null,
  calendarDate: Date = recurrenceStartDate
): [Date[], Date] {
  const limitEndDate = addMonths(
    calendarDate,
    RECURRING_EVENT_INSTANCES_MONTH_LIMIT
    // generate instances upto these many months ahead
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
