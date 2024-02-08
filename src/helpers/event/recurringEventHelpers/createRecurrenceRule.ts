import type mongoose from "mongoose";
import { rrulestr } from "rrule";
import type { InterfaceRecurrenceRule } from "../../../models/RecurrenceRule";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_WEEKDAYS,
} from "../../../constants";
import { format } from "date-fns";

/**
 * This function generates the recurrenceRule document.
 * @param recurrenceRuleString - the rrule string containing the rules that the instances would follow.
 * @param recurrenceStartDate - start date of recurrence.
 * @param recurrenceEndDate - end date of recurrence.
 * @param organizationId - _id of the current organization.
 * @param baseRecurringEventId - _id of the base recurring event.
 * @param latestInstanceDate - start date of the last instance generated during this operation.
 * @remarks The following steps are followed:
 * 1. Create an rrule object from the rrule string.
 * 2. Get the fields for the RecurrenceRule document.
 * 3. Create the RecurrenceRuleDocument.
 * @returns The recurrence rule document.
 */

export const createRecurrenceRule = async (
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  recurrenceEndDate: Date | null,
  organizationId: string,
  baseRecurringEventId: string,
  latestInstanceDate: Date,
  session: mongoose.ClientSession,
): Promise<InterfaceRecurrenceRule> => {
  const recurrenceRuleObject = rrulestr(recurrenceRuleString);

  const { freq, byweekday } = recurrenceRuleObject.options;

  const weekDays: string[] = [];
  if (byweekday) {
    for (const weekday of byweekday) {
      weekDays.push(RECURRENCE_WEEKDAYS[weekday]);
    }
  }

  const formattedLatestInstanceDate = format(latestInstanceDate, "yyyy-MM-dd");
  const frequency = RECURRENCE_FREQUENCIES[freq];

  const recurrenceRule = await RecurrenceRule.create(
    [
      {
        organizationId,
        baseRecurringEventId,
        recurrenceRuleString,
        startDate: recurrenceStartDate,
        endDate: recurrenceEndDate,
        frequency,
        count: recurrenceRuleObject.options.count,
        weekDays,
        latestInstanceDate: formattedLatestInstanceDate,
      },
    ],
    { session },
  );

  return recurrenceRule[0].toObject();
};
