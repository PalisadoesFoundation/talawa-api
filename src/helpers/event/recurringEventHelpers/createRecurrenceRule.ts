import type mongoose from "mongoose";
import { rrulestr } from "rrule";
import type { InterfaceRecurrenceRule } from "../../../models/RecurrenceRule";
import { RecurrenceRule } from "../../../models/RecurrenceRule";
import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_WEEKDAYS,
} from "../../../constants";
import { format } from "date-fns";

export const createRecurrenceRule = async (
  recurrenceRuleString: string,
  recurrenceStartDate: Date,
  recurrenceEndDate: Date | null,
  organizationId: string,
  baseRecurringEventId: string,
  latestInstanceDate: Date,
  session: mongoose.ClientSession
): Promise<InterfaceRecurrenceRule> => {
  const recurrenceRuleObject = rrulestr(recurrenceRuleString as string);

  const weekDays: string[] = [];
  for (const weekday of recurrenceRuleObject.options.byweekday) {
    weekDays.push(RECURRENCE_WEEKDAYS[weekday]);
  }

  const formattedLatestInstanceDate = format(latestInstanceDate, "yyyy-MM-dd");
  const frequency = RECURRENCE_FREQUENCIES[recurrenceRuleObject.options.freq];

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
    { session }
  );

  return recurrenceRule[0].toObject();
};
