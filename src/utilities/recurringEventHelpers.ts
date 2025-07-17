import type { z } from "zod";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { recurrenceInputSchema } from "~/src/graphql/inputs/RecurrenceInput";

/**
 * Converts recurrence input to RRULE string following RFC 5545
 */
export const buildRRuleString = (
	recurrence: z.infer<typeof recurrenceInputSchema>,
	startDate: Date,
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
 * Validates recurrence input
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
	if (recurrence.count && recurrence.count < 1) {
		errors.push("Recurrence count must be at least 1");
	}

	// No validation needed for never option - it's just a boolean flag

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
 * Normalizes recurrence rule by converting count to end date for unified processing.
 * This enables treating all bounded events (count-based or end-date-based) uniformly.
 *
 * @param rule - The original recurrence rule
 * @returns Normalized rule with calculated end date if count-based
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
 * Calculates when a count-based recurrence will complete.
 * Used internally by normalizeRecurrenceRule and can be used for estimations.
 *
 * @param startDate - When the recurrence starts
 * @param count - Number of occurrences
 * @param frequency - Recurrence frequency (DAILY, WEEKLY, MONTHLY, YEARLY)
 * @param interval - Interval between occurrences (default: 1)
 * @returns Date when the final occurrence will happen
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
 * Estimates the total number of instances for a recurrence rule.
 * For never-ending events, estimates based on a 12-month window.
 *
 * @param rule - The recurrence rule
 * @param estimationWindowMonths - For never-ending events, how many months to estimate (default: 12)
 * @returns Estimated number of instances
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
				return Math.ceil(daysDiff / interval);
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
 *
 * @param rule - The recurrence rule to check
 * @returns True if the event never ends (no count and no end date)
 */
export function isNeverEndingEvent(
	rule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	return !rule.count && !rule.recurrenceEndDate;
}

/**
 * Determines if a recurrence rule is count-based (has count but no end date).
 *
 * @param rule - The recurrence rule to check
 * @returns True if the event is count-based
 */
export function isCountBasedEvent(
	rule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	return !!rule.count && !rule.recurrenceEndDate;
}

/**
 * Determines if a recurrence rule is end-date-based (has end date, may or may not have count).
 *
 * @param rule - The recurrence rule to check
 * @returns True if the event has an end date
 */
export function isEndDateBasedEvent(
	rule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	return !!rule.recurrenceEndDate;
}

/**
 * Gets the event type classification for a recurrence rule.
 *
 * @param rule - The recurrence rule to classify
 * @returns Event type classification
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
 * Calculates estimated instances per month for a frequency.
 * Useful for resource planning and efficiency calculations.
 *
 * @param frequency - Recurrence frequency
 * @param interval - Interval between occurrences
 * @returns Average instances per month
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
 * Validates that a recurrence rule has valid configuration.
 * This is for database-level recurrence rules, different from GraphQL input validation above.
 *
 * @param rule - The recurrence rule to validate
 * @returns Object with validation result and any errors
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
