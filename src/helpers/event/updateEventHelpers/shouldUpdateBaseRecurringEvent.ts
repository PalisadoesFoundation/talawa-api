export const shouldUpdateBaseRecurringEvent = (
  recurrenceRuleEndDate: string | null | undefined,
  baseRecurringEventEndDate: string | null | undefined,
): Boolean => {
  return (!recurrenceRuleEndDate && !baseRecurringEventEndDate) ||
    (recurrenceRuleEndDate &&
      baseRecurringEventEndDate &&
      recurrenceRuleEndDate === baseRecurringEventEndDate)
    ? true
    : false;
};
