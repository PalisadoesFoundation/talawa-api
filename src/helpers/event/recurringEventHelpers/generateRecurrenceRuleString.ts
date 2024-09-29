import { RECURRENCE_WEEKDAYS_MAPPING } from "../../../constants";
import type { RecurrenceRuleInput } from "../../../types/generatedGraphQLTypes";
import { convertToRRuleDateString } from "../../../utilities/recurrenceDatesUtil";

/**
 * Generates a recurrence rule (RRULE) string based on the provided recurrence rule input.
 * @param recurrenceRuleData - The input data defining the recurrence rule.
 * @returns The generated recurrence rule string suitable for creating a valid RRULE object.
 * @remarks
 * This function performs the following steps:
 * 1. Extracts relevant fields from the recurrenceRuleData such as start date, end date, frequency, weekdays, interval, count, and week day occurrence in month.
 * 2. Converts start and end dates to string format suitable for RRULE properties.
 * 3. Constructs the RRULE string based on the extracted fields, using standard RRULE syntax.
 */
export const generateRecurrenceRuleString = (
  recurrenceRuleData: RecurrenceRuleInput,
): string => {
  // Destructure the recurrence rule data
  const {
    recurrenceStartDate,
    recurrenceEndDate,
    frequency,
    weekDays,
    interval,
    count,
    weekDayOccurenceInMonth,
  } = recurrenceRuleData;

  // Convert the start date to a string formatted for RRULE "DTSTART" property
  const recurrenceStartDateString =
    convertToRRuleDateString(recurrenceStartDate);

  // Convert the end date to a string formatted for RRULE "UNTIL" property, if provided
  let recurrenceEndDateString = "";
  if (recurrenceEndDate) {
    recurrenceEndDateString = convertToRRuleDateString(recurrenceEndDate);
  }

  // Map weekdays to their RRULE representation (e.g., "MO" for Monday)
  const recurrenceWeekDays = weekDays?.map((weekDay) => {
    if (weekDay) {
      return RECURRENCE_WEEKDAYS_MAPPING[weekDay];
    }
  });

  // Sort the weekDays array for consistent RRULE output
  recurrenceWeekDays?.sort();

  // String representing the days of the week the event would recur
  const weekDaysString = recurrenceWeekDays?.length
    ? recurrenceWeekDays.join(",")
    : "";

  // Initialize the recurrence rule string with mandatory "DTSTART" and "FREQ" properties
  let recurrenceRuleString = `DTSTART:${recurrenceStartDateString}\nRRULE:FREQ=${frequency}`;

  // Add optional RRULE properties based on the presence of corresponding data
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
