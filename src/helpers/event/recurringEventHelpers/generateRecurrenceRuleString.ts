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
  recurrenceEndDate?: Date,
): string => {
  // Initiate an empty recurrenceRule string
  let recurrenceRuleString = "";

  const formattedRecurrenceStartDate = format(
    recurrenceStartDate,
    "yyyyMMdd'T'HHmmss'Z'",
  );

  recurrenceRuleString += "DTSTART:";
  // recurrence start date
  // (not necessarily the start date of the first recurring instance)
  recurrenceRuleString += `${formattedRecurrenceStartDate}\n`;

  // add recurrence rules one by one
  recurrenceRuleString += "RRULE:";

  // frequency of recurrence
  // (defaulting to "WEEKLY" if recurrenceRule is not provided)
  recurrenceRuleString += "FREQ=";
  recurrenceRuleString += `${recurrenceRuleData.frequency}`;

  if (recurrenceEndDate) {
    const formattedRecurrenceEndDate = format(
      recurrenceEndDate,
      "yyyyMMdd'T'HHmmss'Z'",
    );

    recurrenceRuleString += ";UNTIL=";

    // date upto which instances would be generated
    recurrenceRuleString += `${formattedRecurrenceEndDate}`;
  }

  if (recurrenceRuleData.count) {
    recurrenceRuleString += ";COUNT=";

    // maximum number of instances to create
    recurrenceRuleString += `${recurrenceRuleData.count}`;
  }

  if (recurrenceRuleData.weekdays && recurrenceRuleData.weekdays?.length) {
    recurrenceRuleString += ";BYDAY=";

    // add the days of the week the event would recur
    for (const weekDay of recurrenceRuleData.weekdays) {
      recurrenceRuleString += `${weekDay},`;
    }

    recurrenceRuleString = recurrenceRuleString.slice(0, -1);
  }

  return recurrenceRuleString;
};
