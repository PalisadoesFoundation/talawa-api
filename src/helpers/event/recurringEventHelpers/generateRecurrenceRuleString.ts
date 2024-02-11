import { format } from "date-fns";
import type { RecurrenceRuleInput } from "../../../types/generatedGraphQLTypes";
import { adjustForTimezoneOffset } from "../../../utilities/recurrenceDatesUtil";

/**
 * This function generates the recurrence rule (rrule) string.
 * @param recurrenceRuleData - the recurrenceRuleInput provided in the args.
 * @param recurrenceStartDate - start date of recurrence.
 * @param recurrenceEndDate - end date of recurrence.
 * @remarks The following steps are followed:
 * 1. Adjust the start and end dates of recurrence for timezone offsets.
 * 2. Get the recurrence rules and make a recurrenceRuleString.
 * @returns The recurrence rule string that would be used to create a valid rrule object.
 */

export const generateRecurrenceRuleString = (
  recurrenceRuleData: RecurrenceRuleInput,
  recurrenceStartDate: Date,
  recurrenceEndDate?: Date
): string => {
  // adjust the dates according to the timezone offset
  recurrenceStartDate = adjustForTimezoneOffset(recurrenceStartDate);
  if (recurrenceEndDate) {
    recurrenceEndDate = adjustForTimezoneOffset(recurrenceEndDate);
  }

  // recurrence start date
  // (not necessarily the start date of the first recurring instance)
  let formattedRecurrenceStartDate = format(
    recurrenceStartDate,
    "yyyyMMdd'T'HHmmss'Z'"
  );

  // format it to be UTC midnight
  formattedRecurrenceStartDate = formattedRecurrenceStartDate.replace(
    /T\d{6}Z/,
    "T000000Z"
  );

  // date upto which instances would be generated
  let formattedRecurrenceEndDate = recurrenceEndDate
    ? format(recurrenceEndDate, "yyyyMMdd'T'HHmmss'Z'")
    : "";

  // format it to be UTC midnight
  formattedRecurrenceEndDate = formattedRecurrenceEndDate.replace(
    /T\d{6}Z/,
    "T000000Z"
  );

  // destructure the recurrence rules
  const { frequency, count, weekDays } = recurrenceRuleData;

  // string representing the days of the week the event would recur
  const weekDaysString = weekDays?.length ? weekDays.join(",") : "";

  // initiate recurrence rule string
  let recurrenceRuleString = `DTSTART:${formattedRecurrenceStartDate}\nRRULE:FREQ=${frequency}`;

  if (formattedRecurrenceEndDate) {
    recurrenceRuleString += `;UNTIL=${formattedRecurrenceEndDate}`;
  }
  if (count) {
    // maximum number of instances to create
    recurrenceRuleString += `;COUNT=${count}`;
  }
  if (weekDaysString) {
    recurrenceRuleString += `;BYDAY=${weekDaysString}`;
  }

  return recurrenceRuleString;
};
