import { RECURRENCE_WEEKDAYS_MAPPING } from "../../../constants";
import type { RecurrenceRuleInput } from "../../../types/generatedGraphQLTypes";
import { convertToRRuleDateString } from "../../../utilities/recurrenceDatesUtil";

/**
 * This function generates the recurrence rule (rrule) string.
 * @param recurrenceRuleData - the recurrenceRuleInput provided in the args.
 * @param recurrenceStartDate - start date of recurrence.
 * @param recurrenceEndDate - end date of recurrence.
 * @remarks The following steps are followed:
 * 1. Get the date strings for start and end of recurrence.
 * 2. Get the recurrence rules and make a recurrenceRuleString.
 * @returns The recurrence rule string that would be used to create a valid rrule object.
 */

export const generateRecurrenceRuleString = (
  recurrenceRuleData: RecurrenceRuleInput,
  recurrenceStartDate: Date,
  recurrenceEndDate?: Date,
): string => {
  // get the start date string for rrule's "DTSTART" property
  const recurrenceStartDateString =
    convertToRRuleDateString(recurrenceStartDate);

  // get the end date string for rrule's "UNTIL" property
  let recurrenceEndDateString = "";
  if (recurrenceEndDate) {
    recurrenceEndDateString = convertToRRuleDateString(recurrenceEndDate);
  }

  // destructure the recurrence rules
  const { frequency, weekDays, interval, count, weekDayOccurenceInMonth } =
    recurrenceRuleData;

  // get weekdays for recurrence rule string, i.e. "MO", "TU", etc.
  const recurrenceWeekDays = weekDays?.map((weekDay) => {
    if (weekDay) {
      return RECURRENCE_WEEKDAYS_MAPPING[weekDay];
    }
  });

  // string representing the days of the week the event would recur
  const weekDaysString = recurrenceWeekDays?.length
    ? recurrenceWeekDays.join(",")
    : "";

  // initiate recurrence rule string
  let recurrenceRuleString = `DTSTART:${recurrenceStartDateString}\nRRULE:FREQ=${frequency}`;

  if (recurrenceEndDateString) {
    recurrenceRuleString += `;UNTIL=${recurrenceEndDateString}`;
  }

  if (interval) {
    // interval of recurrence
    recurrenceRuleString += `;INTERVAL=${interval}`;
  }

  if (count) {
    // maximum number of instances to generate
    recurrenceRuleString += `;COUNT=${count}`;
  }

  if (weekDayOccurenceInMonth) {
    // occurence of week day in month
    // i.e. 1 = first monday, 3 = third monday, -1 = last monday
    recurrenceRuleString += `;BYSETPOS=${weekDayOccurenceInMonth}`;
  }

  if (weekDaysString) {
    recurrenceRuleString += `;BYDAY=${weekDaysString}`;
  }

  return recurrenceRuleString;
};
