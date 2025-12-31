import type { z } from "zod";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { recurrenceInputSchema } from "~/src/graphql/inputs/RecurrenceInput";

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

	// Validate interval (only if interval is provided)
	if (
		recurrence.interval !== null &&
		recurrence.interval !== undefined &&
		recurrence.interval < 1
	) {
		errors.push("Recurrence interval must be at least 1");
	}

	// Validate that yearly events cannot be never-ending
	if (recurrence.frequency === "YEARLY" && recurrence.never) {
		errors.push(
			"Yearly events cannot be never-ending. Please specify an end date or count.",
		);
	}

	// Validate byDay format (for any frequency that uses it)
	if (recurrence.byDay) {
		const validDays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
		for (const day of recurrence.byDay) {
			// Extract day code - handle ordinal prefixes like "1MO", "-1SU"
			// The day code is always the last 2 characters
			const dayCode = day.slice(-2);
			if (!validDays.includes(dayCode)) {
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
