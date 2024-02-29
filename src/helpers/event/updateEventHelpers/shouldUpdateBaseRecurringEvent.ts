/**
 * This function checks whether the baseRecurringEvent should be updated.
 * @param recurrenceRuleEndDate - the end date of the recurrence rule.
 * @param baseRecurringEventEndDate - the end date of the base recurring event.
 * @returns true if the recurrence rule is the latest rule that the instances were following, false otherwise.
 */

export const shouldUpdateBaseRecurringEvent = (
  recurrenceRuleEndDate: string | null | undefined,
  baseRecurringEventEndDate: string | null | undefined,
): boolean => {
  // if the endDate matches then return true, otherwise false
  return (!recurrenceRuleEndDate && !baseRecurringEventEndDate) ||
    (recurrenceRuleEndDate &&
      baseRecurringEventEndDate &&
      recurrenceRuleEndDate === baseRecurringEventEndDate)
    ? true
    : false;
};
