import type { z } from "zod";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { recurrenceInputSchema } from "~/src/graphql/inputs/RecurrenceInput";

/**
 * Converts a recurrence input object into an RRULE string compliant with RFC 5545.
 * This function constructs a recurrence rule string based on the provided frequency,
 * interval, end date, count, and other recurrence properties.
 *
 * @param recurrence - The recurrence input object, conforming to the recurrenceInputSchema.
 * @param startDate - The start date of the event, used for validation and context.
 * @returns - A full RRULE string, e.g., "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR".
 */
export const buildRRuleString = (
	recurrence: z.infer<typeof recurrenceInputSchema>,
	_startDate: Date,
): string => {
	let rrule = `FREQ=${recurrence.frequency}`;

	// Add interval
	if (recurrence.interval && recurrence.interval > 1) {
		rrule += `;INTERVAL=${recurrence.interval}`;
	}

	// Add end condition
	if (recurrence.endDate) {
		const endDateString = recurrence.endDate
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}/, "");
		rrule += `;UNTIL=${endDateString}`;
	} else if (recurrence.count) {
		rrule += `;COUNT=${recurrence.count}`;
	}
	// If recurrence.never is true, we don't add any end condition (infinite recurrence)

	// Add byDay (e.g., ["MO", "WE", "FR"])
	if (recurrence.byDay && recurrence.byDay.length > 0) {
		rrule += `;BYDAY=${recurrence.byDay.join(",")}`;
	}

	// Add byMonth (e.g., [1, 6, 12])
	if (recurrence.byMonth && recurrence.byMonth.length > 0) {
		rrule += `;BYMONTH=${recurrence.byMonth.join(",")}`;
	}

	// Add byMonthDay (e.g., [1, 15, -1])
	if (recurrence.byMonthDay && recurrence.byMonthDay.length > 0) {
		rrule += `;BYMONTHDAY=${recurrence.byMonthDay.join(",")}`;
	}

	return `RRULE:${rrule}`;
};

/**
 * Validates the recurrence input object against a set of rules to ensure its correctness.
 * This function checks for logical consistency, such as ensuring the end date is after the
 * start date, and validates the format of values like day codes and month numbers.
 *
 * @param recurrence - The recurrence input object to validate.
 * @param startDate - The start date of the event, used for validation against the end date.
 * @returns - An object containing a boolean `isValid` and an array of error strings.
 *          If `isValid` is true, the `errors` array will be empty.
 */
export const validateRecurrenceInput = (
	recurrence: z.infer<typeof recurrenceInputSchema>,
	startDate: Date,
): { isValid: boolean; errors: string[] } => {
	const errors: string[] = [];

	// Check if end date is after start date (only if endDate is provided)
	if (recurrence.endDate && recurrence.endDate <= startDate) {
		errors.push("Recurrence end date must be after event start date");
	}

	// Validate count (only if count is provided)
	if (
		recurrence.count !== null &&
		recurrence.count !== undefined &&
		recurrence.count < 1
	) {
		errors.push("Recurrence count must be at least 1");
	}

	// Validate that yearly events cannot be never-ending
	if (recurrence.frequency === "YEARLY" && recurrence.never) {
		errors.push(
			"Yearly events cannot be never-ending. Please specify an end date or count.",
		);
	}
	// Validate byDay format for weekly events
	if (recurrence.frequency === "WEEKLY" && recurrence.byDay) {
		const validDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
		for (const day of recurrence.byDay) {
			if (!validDays.includes(day)) {
				errors.push(`Invalid day code: ${day}`);
			}
		}
	}

	// Validate byMonth
	if (recurrence.byMonth) {
		for (const month of recurrence.byMonth) {
			if (month < 1 || month > 12) {
				errors.push(`Invalid month: ${month}`);
			}
		}
	}

	// Validate byMonthDay
	if (recurrence.byMonthDay) {
		for (const day of recurrence.byMonthDay) {
			if (day === 0 || day < -31 || day > 31) {
				errors.push(`Invalid month day: ${day}`);
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

// ==========================================
// Worker-level utility functions below
// ==========================================

/**
 * Normalizes a recurrence rule by converting a `count`-based rule to an `endDate`-based one.
 * This allows for uniform processing of events that have a defined end, whether specified
 * by a count of occurrences or a specific end date. If the rule is already `endDate`-based
 * or is infinite (never-ending), it is returned unchanged.
 *
 * @param rule - The recurrence rule from the database.
 * @returns - A normalized recurrence rule, where `count` has been converted to `recurrenceEndDate`.
 */
export function normalizeRecurrenceRule(
	rule: typeof recurrenceRulesTable.$inferSelect,
): typeof recurrenceRulesTable.$inferSelect {
	// If rule has count but no end date, convert count to end date
	if (rule.count && !rule.recurrenceEndDate) {
		const calculatedEndDate = calculateCompletionDateFromCount(
			rule.recurrenceStartDate,
			rule.count,
			rule.frequency,
			rule.interval || 1,
		);

		return {
			...rule,
			recurrenceEndDate: calculatedEndDate,
		};
	}

	// Return rule as-is if it already has end date or is never-ending
	return rule;
}

/**
 * Calculates the completion date of a recurrence that is defined by a `count`.
 * This function is used internally by `normalizeRecurrenceRule` to convert a count-based
 * recurrence into an end-date-based one. It can also be used for estimating the
 * duration of a recurring event.
 *
 * @param startDate - The start date of the recurrence.
 * @param count - The total number of occurrences.
 * @param frequency - The frequency of the recurrence (e.g., "DAILY", "WEEKLY").
 * @param interval - The interval between occurrences (default is 1).
 * @returns - The calculated date of the final occurrence.
 */
export function calculateCompletionDateFromCount(
	startDate: Date,
	count: number,
	frequency: string,
	interval = 1,
): Date {
	const completionDate = new Date(startDate);

	switch (frequency) {
		case "DAILY":
			completionDate.setDate(completionDate.getDate() + (count - 1) * interval);
			break;
		case "WEEKLY":
			completionDate.setDate(
				completionDate.getDate() + (count - 1) * interval * 7,
			);
			break;
		case "MONTHLY":
			completionDate.setMonth(
				completionDate.getMonth() + (count - 1) * interval,
			);
			break;
		case "YEARLY":
			completionDate.setFullYear(
				completionDate.getFullYear() + (count - 1) * interval,
			);
			break;
		default:
			// Default to daily if frequency is unknown
			completionDate.setDate(completionDate.getDate() + (count - 1) * interval);
	}

	return completionDate;
}

/**
 * Estimates the total number of instances that will be generated by a recurrence rule.
 * If the rule is based on a `count`, it returns the count. If it's based on an `endDate`,
 * it calculates the number of occurrences. For never-ending events, it estimates the
 * number of instances over a specified time window (default is 12 months).
 *
 * @param rule - The recurrence rule to estimate.
 * @param estimationWindowMonths - The number of months to use for estimation if the event is never-ending.
 * @returns - The estimated total number of instances.
 */
export function estimateInstanceCount(
	rule: typeof recurrenceRulesTable.$inferSelect,
	estimationWindowMonths = 12,
): number {
	// If has explicit count, use it
	if (rule.count) return rule.count;

	// If has end date, calculate based on duration
	if (rule.recurrenceEndDate) {
		const daysDiff = Math.ceil(
			(rule.recurrenceEndDate.getTime() - rule.recurrenceStartDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);
		const interval = rule.interval || 1;

		switch (rule.frequency) {
			case "DAILY":
				return Math.ceil(daysDiff / interval) + 1;
			case "WEEKLY":
				return Math.ceil(daysDiff / (7 * interval));
			case "MONTHLY":
				return Math.ceil(daysDiff / (30 * interval));
			case "YEARLY":
				return Math.ceil(daysDiff / (365 * interval));
			default:
				return Math.ceil(daysDiff / interval);
		}
	}

	// Never-ending: estimate based on window
	const interval = rule.interval || 1;
	const daysInWindow = estimationWindowMonths * 30;

	switch (rule.frequency) {
		case "DAILY":
			return Math.ceil(daysInWindow / interval);
		case "WEEKLY":
			return Math.ceil(daysInWindow / (7 * interval));
		case "MONTHLY":
			return Math.ceil(estimationWindowMonths / interval);
		case "YEARLY":
			return Math.ceil(estimationWindowMonths / 12 / interval);
		default:
			return Math.ceil(daysInWindow / interval);
	}
}

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
 * @param rule - The recurrence rule to check.
 * @returns `true` if the event has an end date, otherwise `false`.
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

/**
 * Applies calendar-style override logic for recurring event updates.
 * This function implements the following rules:
 * 1. If startAt is provided and byDay is not specified in recurrence,
 *    derive byDay from the new startAt day of week
 * 2. If byDay is explicitly provided in recurrence, use it as-is
 * 3. For monthly/yearly events, similar logic applies to byMonthDay/byMonth
 *
 * @param newStartAt - The new start time for the event (if provided)
 * @param originalRecurrence - The original recurrence rule from the database
 * @param inputRecurrence - The recurrence input from the user (if provided)
 * @returns - The updated recurrence configuration with proper overrides applied
 */
export function applyRecurrenceOverrides(
	newStartAt: Date | undefined,
	originalRecurrence: Pick<
		typeof recurrenceRulesTable.$inferSelect,
		| "frequency"
		| "interval"
		| "recurrenceEndDate"
		| "count"
		| "byDay"
		| "byMonth"
		| "byMonthDay"
	>,
	inputRecurrence?: z.infer<typeof recurrenceInputSchema>,
): z.infer<typeof recurrenceInputSchema> {
	// Start with the provided recurrence input or create from original
	const recurrence = inputRecurrence ?? {
		frequency: originalRecurrence.frequency,
		interval: originalRecurrence.interval,
		endDate: originalRecurrence.recurrenceEndDate ?? undefined,
		count: originalRecurrence.count ?? undefined,
		never: !originalRecurrence.recurrenceEndDate && !originalRecurrence.count,
		byDay: originalRecurrence.byDay ?? undefined,
		byMonth: originalRecurrence.byMonth ?? undefined,
		byMonthDay: originalRecurrence.byMonthDay ?? undefined,
	};

	// Override logic: startAt always wins if provided, otherwise use byDay
	if (newStartAt) {
		// If startAt is provided, derive byDay from it regardless of input byDay
		const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
		const dayIndex = newStartAt.getDay();

		if (dayIndex < 0 || dayIndex >= dayMap.length) {
			// This case should ideally not happen with valid Date objects
			throw new Error("Invalid day of week derived from startAt");
		}
		const newDayOfWeek = dayMap[dayIndex];

		if (newDayOfWeek) {
			if (recurrence.frequency === "WEEKLY") {
				// For weekly events, only override byDay if not explicitly provided in input
				if (!inputRecurrence?.byDay) {
					recurrence.byDay = [newDayOfWeek];
				}
			} else if (recurrence.frequency === "MONTHLY") {
				// For monthly events, if byDay was previously set, update it
				// Also set it if no byDay was originally set but we have a new start day
				if (
					!inputRecurrence?.byDay &&
					((originalRecurrence.byDay && originalRecurrence.byDay.length > 0) ||
						!originalRecurrence.byMonthDay)
				) {
					recurrence.byDay = [newDayOfWeek];
				}
			}
		}
	} else if (inputRecurrence?.byDay) {
		// If startAt is not provided but byDay is, use byDay
		recurrence.byDay = inputRecurrence.byDay;
	}

	// For monthly events, handle byMonthDay override logic
	if (
		newStartAt &&
		!inputRecurrence?.byMonthDay &&
		recurrence.frequency === "MONTHLY"
	) {
		// If byMonthDay was previously set and no new byMonthDay provided, update it
		if (
			originalRecurrence.byMonthDay &&
			originalRecurrence.byMonthDay.length > 0
		) {
			recurrence.byMonthDay = [newStartAt.getDate()];
		}
	}

	// If byMonthDay is explicitly provided in input, use it
	if (inputRecurrence?.byMonthDay) {
		recurrence.byMonthDay = inputRecurrence.byMonthDay;
	}

	// For yearly events, handle byMonth override logic
	if (
		newStartAt &&
		!inputRecurrence?.byMonth &&
		recurrence.frequency === "YEARLY"
	) {
		// If byMonth was previously set and no new byMonth provided, update it
		if (originalRecurrence.byMonth && originalRecurrence.byMonth.length > 0) {
			recurrence.byMonth = [newStartAt.getMonth() + 1]; // JavaScript months are 0-indexed
		}
	}

	// If byMonth is explicitly provided in input, use it
	if (inputRecurrence?.byMonth) {
		recurrence.byMonth = inputRecurrence.byMonth;
	}

	return recurrence;
}

/**
 * Calculates the estimated number of instances per month for a given frequency and interval.
 * This is useful for resource planning, performance estimations, and other calculations
 * where an average monthly occurrence rate is needed.
 *
 * @param frequency - The frequency of the recurrence (e.g., "DAILY", "WEEKLY").
 * @param interval - The interval between occurrences (default is 1).
 * @returns - The average number of instances expected in a month.
 */
export function calculateInstancesPerMonth(
	frequency: string,
	interval = 1,
): number {
	switch (frequency) {
		case "DAILY":
			return 30 / interval; // ~30 days per month
		case "WEEKLY":
			return 4.33 / interval; // ~4.33 weeks per month
		case "MONTHLY":
			return 1 / interval;
		case "YEARLY":
			return 1 / (12 * interval); // 1/12 of a year per month
		default:
			return 30 / interval; // Default to daily
	}
}

/**
 * Validates a recurrence rule from the database to ensure its configuration is valid.
 * This function checks for the presence of a valid frequency, ensures that the interval
 * and count are positive integers if they exist, and verifies that the end date is
 * after the start date.
 *
 * @param rule - The recurrence rule to validate.
 * @returns - An object with a boolean `isValid` and an array of error strings.
 */
export function validateRecurrenceRule(
	rule: typeof recurrenceRulesTable.$inferSelect,
): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check frequency
	if (!rule.frequency) {
		errors.push("Frequency is required");
	} else {
		const validFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
		if (!validFrequencies.includes(rule.frequency)) {
			errors.push(`Invalid frequency: ${rule.frequency}`);
		}
	}

	// Check interval
	if (
		rule.interval !== null &&
		rule.interval !== undefined &&
		rule.interval < 1
	) {
		errors.push("Interval must be at least 1");
	}

	// Check count
	if (rule.count !== null && rule.count !== undefined && rule.count < 1) {
		errors.push("Count must be at least 1");
	}

	// Check date logic
	if (
		rule.recurrenceEndDate &&
		rule.recurrenceEndDate <= rule.recurrenceStartDate
	) {
		errors.push("End date must be after start date");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
