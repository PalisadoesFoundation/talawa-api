import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";

/**
 * Converts a recurrence rule into a human-readable description.
 *
 * Examples:
 * - "Daily"
 * - "Weekly on Monday"
 * - "Weekly on Monday, Wednesday, Friday"
 * - "Monthly on the 15th"
 * - "Monthly on the first Monday"
 * - "Yearly on January 1st"
 *
 * @param rule - The recurrence rule from the database
 * @returns - A human-readable description of the recurrence pattern
 */
export function formatRecurrenceDescription(
	rule: typeof recurrenceRulesTable.$inferSelect,
): string {
	const { frequency, interval = 1, byDay, byMonth, byMonthDay } = rule;

	// Helper to format ordinal numbers (1st, 2nd, 3rd, etc.)
	const getOrdinal = (num: number): string => {
		const absNum = Math.abs(num);
		const lastDigit = absNum % 10;
		const lastTwoDigits = absNum % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
			return `${num}th`;
		}

		switch (lastDigit) {
			case 1:
				return `${num}st`;
			case 2:
				return `${num}nd`;
			case 3:
				return `${num}rd`;
			default:
				return `${num}th`;
		}
	};

	// Helper to format day names
	const formatDayNames = (days: string[]): string => {
		const dayMap: Record<string, string> = {
			SU: "Sunday",
			MO: "Monday",
			TU: "Tuesday",
			WE: "Wednesday",
			TH: "Thursday",
			FR: "Friday",
			SA: "Saturday",
		};

		return days.map((day) => dayMap[day] || day).join(", ");
	};

	// Helper to format month names
	const formatMonthNames = (months: number[]): string => {
		const monthMap = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		return months
			.map((month) => monthMap[month - 1] || `Month ${month}`)
			.join(", ");
	};

	// Helper to format positional day (e.g., "first Monday", "last Friday")
	const formatPositionalDay = (byDayRule: string): string => {
		const dayMap: Record<string, string> = {
			SU: "Sunday",
			MO: "Monday",
			TU: "Tuesday",
			WE: "Wednesday",
			TH: "Thursday",
			FR: "Friday",
			SA: "Saturday",
		};

		// Extract ordinal (1MO -> 1, -1FR -> -1) and day (MO, FR)
		const match = byDayRule.match(/^(-?\d+)([A-Z]{2})$/);
		if (!match || !match[1] || !match[2]) {
			return byDayRule;
		}

		const ordinal = Number.parseInt(match[1], 10);
		const dayCode = match[2];
		const dayName = dayMap[dayCode] || dayCode;

		if (ordinal === 1) return `first ${dayName}`;
		if (ordinal === 2) return `second ${dayName}`;
		if (ordinal === 3) return `third ${dayName}`;
		if (ordinal === -1) return `last ${dayName}`;

		return `${getOrdinal(ordinal)} ${dayName}`;
	};

	// Base frequency text
	let baseText = "";
	if (interval === 1) {
		baseText = frequency.toLowerCase();
	} else {
		switch (frequency) {
			case "DAILY":
				baseText = `every ${interval} days`;
				break;
			case "WEEKLY":
				baseText = `every ${interval} weeks`;
				break;
			case "MONTHLY":
				baseText = `every ${interval} months`;
				break;
			case "YEARLY":
				baseText = `every ${interval} years`;
				break;
			default:
				baseText = `every ${interval} ${String(frequency).toLowerCase()}`;
		}
	}

	// Capitalize first letter
	baseText = baseText.charAt(0).toUpperCase() + baseText.slice(1);

	// Add specific day/date constraints
	switch (frequency) {
		case "DAILY":
			return baseText;

		case "WEEKLY":
			if (byDay && byDay.length > 0) {
				// Filter out positional indicators (like "1MO") and keep only day codes
				const simpleDays = byDay.filter((day) => /^[A-Z]{2}$/.test(day));
				if (simpleDays.length > 0) {
					return `${baseText} on ${formatDayNames(simpleDays)}`;
				}
			}
			return baseText;

		case "MONTHLY":
			// Handle positional days (e.g., "first Monday", "last Friday")
			if (byDay && byDay.length > 0) {
				const positionalDays = byDay.filter((day) =>
					/^-?\d+[A-Z]{2}$/.test(day),
				);
				if (positionalDays.length > 0) {
					const formattedDays = positionalDays.map(formatPositionalDay);
					return `${baseText} on the ${formattedDays.join(", ")}`;
				}
			}

			// Handle specific days of month
			if (byMonthDay && byMonthDay.length > 0) {
				const dayDescriptions = byMonthDay.map((day) => {
					if (day === -1) return "last day";
					return getOrdinal(day);
				});
				return `${baseText} on the ${dayDescriptions.join(", ")}`;
			}

			return baseText;

		case "YEARLY": {
			let yearlyText = baseText;

			// Add month specification
			if (byMonth && byMonth.length > 0) {
				yearlyText += ` in ${formatMonthNames(byMonth)}`;
			}

			// Add day specification
			if (byMonthDay && byMonthDay.length > 0) {
				const dayDescriptions = byMonthDay.map((day) => {
					if (day === -1) return "last day";
					return getOrdinal(day);
				});
				yearlyText += ` on the ${dayDescriptions.join(", ")}`;
			} else if (byDay && byDay.length > 0) {
				const positionalDays = byDay.filter((day) =>
					/^-?\d+[A-Z]{2}$/.test(day),
				);
				if (positionalDays.length > 0) {
					const formattedDays = positionalDays.map(formatPositionalDay);
					yearlyText += ` on the ${formattedDays.join(", ")}`;
				}
			}

			return yearlyText;
		}

		default:
			return baseText;
	}
}

/**
 * Gets a short recurrence label suitable for UI buttons or compact displays.
 *
 * Examples:
 * - "Daily"
 * - "Weekly"
 * - "Monthly"
 * - "Every 2 weeks"
 * - "Every 3 months"
 *
 * @param rule - The recurrence rule from the database
 * @returns - A short label describing the recurrence frequency
 */
export function getRecurrenceLabel(
	rule: typeof recurrenceRulesTable.$inferSelect,
): string {
	const { frequency, interval = 1 } = rule;

	if (interval === 1) {
		return frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase();
	}

	switch (frequency) {
		case "DAILY":
			return `Every ${interval} days`;
		case "WEEKLY":
			return `Every ${interval} weeks`;
		case "MONTHLY":
			return `Every ${interval} months`;
		case "YEARLY":
			return `Every ${interval} years`;
		default:
			return `Every ${interval} ${String(frequency).toLowerCase()}`;
	}
}
