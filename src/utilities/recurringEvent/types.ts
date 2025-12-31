import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";

/**
 * Determines if a recurrence rule represents a never-ending event.
 * A never-ending event is one that has neither a `count` nor an `endDate`.
 *
 * @param rule - The recurrence rule to check.
 * @returns `true` if the event is never-ending, otherwise `false`.
 */
export function isNeverEndingEvent(
	rule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	return !rule.count && !rule.recurrenceEndDate;
}

/**
 * Determines if a recurrence rule is count-based.
 * A count-based event is defined by a `count` of occurrences and does not have an `endDate`.
 *
 * @param rule - The recurrence rule to check.
 * @returns `true` if the event is count-based, otherwise `false`.
 */
export function isCountBasedEvent(
	rule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	return !!rule.count && !rule.recurrenceEndDate;
}

/**
 * Determines if a recurrence rule is end-date-based.
 * An end-date-based event is defined by an `endDate`. It may or may not also have a `count`,
 * in which case it would be considered a hybrid event.
 *
 * **Note**: This returns `true` for any event with a `recurrenceEndDate`, including hybrid events
 * that also have a `count`. For exclusive classification, use `getEventType()` instead.
 *
 * @example
 * // To check for end-date-only events (excluding hybrids):
 * const isEndDateOnly = rule.recurrenceEndDate && !rule.count;
 *
 * @param rule - The recurrence rule to check.
 * @returns `true` if the event has an end date (including hybrid events), otherwise `false`.
 */
export function isEndDateBasedEvent(
	rule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	return !!rule.recurrenceEndDate;
}

/**
 * Classifies a recurrence rule into one of four types: "NEVER_ENDING", "COUNT_BASED",
 * "END_DATE_BASED", or "HYBRID". This helps in understanding how the recurrence
 * is defined and constrained.
 *
 * @param rule - The recurrence rule to classify.
 * @returns - The classification of the event type as a string literal.
 */
export function getEventType(
	rule: typeof recurrenceRulesTable.$inferSelect,
): "NEVER_ENDING" | "COUNT_BASED" | "END_DATE_BASED" | "HYBRID" {
	if (isNeverEndingEvent(rule)) {
		return "NEVER_ENDING";
	}
	if (rule.count && rule.recurrenceEndDate) {
		return "HYBRID"; // Both count and end date
	}
	if (isCountBasedEvent(rule)) {
		return "COUNT_BASED";
	}
	return "END_DATE_BASED";
}
