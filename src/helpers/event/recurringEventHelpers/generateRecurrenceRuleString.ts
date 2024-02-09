import { format } from "date-fns";
import type { RecurrenceRuleInput } from "../../../types/generatedGraphQLTypes";

/**
 * This function generates the recurrence rule (rrule) string.
 * @param recurrenceRuleData - the recurrenceRuleInput provided in the args.
 * @param recurrenceStartDate - start date of recurrence.
 * @param recurrenceEndDate - end date of recurrence.
 * @remarks The following steps are followed:
 * 1. Initiate an empty recurrenceRule string.
 * 2. Add the recurrence rules one by one.
 * @returns The recurrence rule string that would be used to create a valid rrule object.
 */

export const generateRecurrenceRuleString = (
  recurrenceRuleData: RecurrenceRuleInput,
  recurrenceStartDate: Date,
  recurrenceEndDate?: Date
): string => {
  // destructure the rules
  const { frequency, count, weekDays } = recurrenceRuleData;

  // recurrence start date
  // (not necessarily the start date of the first recurring instance)
  const formattedRecurrenceStartDate = format(
    recurrenceStartDate,
    "yyyyMMdd'T'HHmmss'Z'"
  );

  // date upto which instances would be generated
  const formattedRecurrenceEndDate = recurrenceEndDate
    ? format(recurrenceEndDate, "yyyyMMdd'T'HHmmss'Z'")
    : "";

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
