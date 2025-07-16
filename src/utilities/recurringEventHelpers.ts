import type { z } from "zod";
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
