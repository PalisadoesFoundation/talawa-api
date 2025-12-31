import type { z } from "zod";
import type { recurrenceInputSchema } from "~/src/graphql/inputs/RecurrenceInput";

/**
 * Converts a recurrence input object into an RRULE string compliant with RFC 5545.
 * This function constructs a recurrence rule string based on the provided frequency,
 * interval, end date, count, and other recurrence properties.
 *
 * @param recurrence - The recurrence input object, conforming to the recurrenceInputSchema.
 * @param _startDate - Reserved for future use; currently unused but maintained for API compatibility.
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
