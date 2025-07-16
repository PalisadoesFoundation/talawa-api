import type { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type {
	CalculatedOccurrence,
	OccurrenceCalculationConfig,
	RecurrenceContext,
	ServiceDependencies,
} from "./types";

/**
 * Calculates instance occurrence times based on recurrence rules and exceptions.
 * Handles daily, weekly, monthly, and yearly frequencies with proper exception handling.
 */
export function calculateInstanceOccurrences(
	config: OccurrenceCalculationConfig,
	logger: ServiceDependencies["logger"],
): CalculatedOccurrence[] {
	const { recurrenceRule, baseEvent, windowStart, windowEnd, exceptions } =
		config;

	if (!baseEvent.startAt || !baseEvent.endAt) {
		logger.warn("Base event missing start or end time", {
			baseEventId: baseEvent.id,
			startAt: baseEvent.startAt,
			endAt: baseEvent.endAt,
		});
		return [];
	}

	const context = buildRecurrenceContext(recurrenceRule, baseEvent, exceptions);
	const occurrences: CalculatedOccurrence[] = [];

	logger.debug("Starting occurrence calculation", {
		baseEventStart: baseEvent.startAt.toISOString(),
		windowStart: windowStart.toISOString(),
		windowEnd: windowEnd.toISOString(),
		frequency: recurrenceRule.frequency,
		interval: recurrenceRule.interval,
		isNeverEnding: context.isNeverEnding,
		totalCount: context.totalCount,
	});

	let currentDate = new Date(baseEvent.startAt);
	let iterationCount = 0;
	let sequenceNumber = 1;

	// Generate occurrences
	while (currentDate <= windowEnd && iterationCount < context.maxIterations) {
		iterationCount++;

		// Check if we should generate an instance at this date
		if (
			shouldGenerateInstanceAtDate(
				currentDate,
				recurrenceRule,
				baseEvent.startAt,
			)
		) {
			// Only include instances that fall within our window
			if (currentDate >= windowStart) {
				const occurrence = createOccurrenceFromDate(
					currentDate,
					context,
					sequenceNumber,
				);
				occurrences.push(occurrence);
			}

			sequenceNumber++;

			// If we have a count limit and reached it, stop
			if (context.totalCount && sequenceNumber > context.totalCount) {
				break;
			}
		}

		// Move to next potential date based on frequency
		currentDate = getNextOccurrenceDate(currentDate, recurrenceRule);
	}

	// If we need to calculate total count (endDate but no count), set it now
	if (context.shouldCalculateTotalCount) {
		const finalTotalCount = occurrences.length;
		// Update all occurrences with the calculated total count
		for (const occurrence of occurrences) {
			occurrence.totalCount = finalTotalCount;
		}
	}

	logger.debug("Occurrence calculation completed", {
		iterationCount,
		occurrencesGenerated: occurrences.length,
		sequenceNumber: sequenceNumber - 1,
		totalCount: context.totalCount,
	});

	return occurrences;
}

/**
 * Builds the recurrence context with pre-calculated values and exception maps
 */
function buildRecurrenceContext(
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
	baseEvent: typeof eventsTable.$inferSelect,
	exceptions: (typeof eventExceptionsTable.$inferSelect)[],
): RecurrenceContext {
	const eventDuration =
		(baseEvent.endAt?.getTime() ?? 0) - (baseEvent.startAt?.getTime() ?? 0);

	// Calculate total count for finite series
	const totalCount = recurrenceRule.count || null;
	const shouldCalculateTotalCount =
		!recurrenceRule.count && !!recurrenceRule.recurrenceEndDate;
	const isNeverEnding =
		!recurrenceRule.count && !recurrenceRule.recurrenceEndDate;

	// Create exception lookup for fast access
	const exceptionsByTime = new Map<
		string,
		typeof eventExceptionsTable.$inferSelect
	>();
	for (const exception of exceptions) {
		exceptionsByTime.set(exception.instanceStartTime.toISOString(), exception);
	}

	// Safety limit to prevent infinite loops
	const maxIterations = isNeverEnding ? 10000 : 1000;

	return {
		eventDuration,
		totalCount,
		shouldCalculateTotalCount,
		isNeverEnding,
		exceptionsByTime,
		maxIterations,
	};
}

/**
 * Creates a calculated occurrence from a date using the recurrence context
 */
function createOccurrenceFromDate(
	currentDate: Date,
	context: RecurrenceContext,
	sequenceNumber: number,
): CalculatedOccurrence {
	const originalStartTime = new Date(currentDate);
	let actualStartTime = new Date(currentDate);
	let actualEndTime = new Date(currentDate.getTime() + context.eventDuration);
	let isCancelled = false;

	// Check for exceptions that modify this instance
	const exception = context.exceptionsByTime.get(
		originalStartTime.toISOString(),
	);
	if (exception?.exceptionData) {
		const exceptionData = exception.exceptionData as Record<string, unknown>;

		// Apply time changes from exception
		if (exceptionData.startAt) {
			actualStartTime = new Date(
				exceptionData.startAt as string | number | Date,
			);
		}
		if (exceptionData.endAt) {
			actualEndTime = new Date(exceptionData.endAt as string | number | Date);
		}
		if (exceptionData.isCancelled) {
			isCancelled = exceptionData.isCancelled as boolean;
		}
	}

	return {
		originalStartTime,
		actualStartTime,
		actualEndTime,
		isCancelled,
		sequenceNumber,
		totalCount: context.totalCount,
	};
}

/**
 * Determines if an instance should be generated at the given date.
 * Handles never-ending events and complex monthly patterns properly.
 */
export function shouldGenerateInstanceAtDate(
	date: Date,
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
	startDate: Date,
): boolean {
	// Must be on or after the start date
	if (date < startDate) {
		return false;
	}

	// For never-ending events (recurrenceEndDate is null), skip end date check
	if (
		recurrenceRule.recurrenceEndDate &&
		date > recurrenceRule.recurrenceEndDate
	) {
		return false;
	}

	// Check frequency-specific filters
	switch (recurrenceRule.frequency) {
		case "DAILY":
			return shouldGenerateForDaily(date, recurrenceRule);
		case "WEEKLY":
			return shouldGenerateForWeekly(date, recurrenceRule);
		case "MONTHLY":
			return shouldGenerateForMonthly(date, recurrenceRule);
		case "YEARLY":
			return shouldGenerateForYearly(date, recurrenceRule);
		default:
			return true;
	}
}

/**
 * Checks if a date should generate an instance for daily frequency
 */
function shouldGenerateForDaily(
	date: Date,
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	// For daily events, no additional day filters needed
	return true;
}

/**
 * Checks if a date should generate an instance for weekly frequency
 */
function shouldGenerateForWeekly(
	date: Date,
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	// Check byDay filter for weekly events
	if (recurrenceRule.byDay?.length) {
		const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
		const dayOfWeek = dayNames[date.getDay()];
		if (!dayOfWeek || !recurrenceRule.byDay.includes(dayOfWeek)) {
			return false;
		}
	}
	return true;
}

/**
 * Checks if a date should generate an instance for monthly frequency
 */
function shouldGenerateForMonthly(
	date: Date,
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	// Handle complex monthly patterns (like "first Friday of each month")
	if (recurrenceRule.byDay?.length) {
		const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
		const dayOfWeek = dayNames[date.getDay()];
		const dayOfMonth = date.getDate();

		for (const byDayRule of recurrenceRule.byDay) {
			const ruleDay = byDayRule.slice(-2);
			const ordinal = Number.parseInt(byDayRule.slice(0, -2), 10);

			if (ruleDay === dayOfWeek) {
				const weekOfMonth = Math.floor((dayOfMonth - 1) / 7) + 1;
				if (weekOfMonth === ordinal) {
					return true;
				}
			}
		}
		return false;
	}
	if (recurrenceRule.byMonthDay?.length) {
		// Only byMonthDay is specified (no byDay)
		const dayOfMonth = date.getDate();
		if (!recurrenceRule.byMonthDay.includes(dayOfMonth)) {
			return false;
		}
	}
	return true;
}

/**
 * Checks if a date should generate an instance for yearly frequency
 */
function shouldGenerateForYearly(
	date: Date,
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	// Check byMonth filter for yearly events
	if (recurrenceRule.byMonth && recurrenceRule.byMonth.length > 0) {
		const month = date.getMonth() + 1; // getMonth() returns 0-11
		if (!recurrenceRule.byMonth.includes(month)) {
			return false;
		}
	}

	// Check byMonthDay filter for yearly events
	if (recurrenceRule.byMonthDay && recurrenceRule.byMonthDay.length > 0) {
		const dayOfMonth = date.getDate();
		if (!recurrenceRule.byMonthDay.includes(dayOfMonth)) {
			return false;
		}
	}

	return true;
}

/**
 * Gets the next occurrence date based on frequency and interval.
 * Enhanced to properly handle all frequency types.
 */
export function getNextOccurrenceDate(
	currentDate: Date,
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
): Date {
	const nextDate = new Date(currentDate);
	const interval = recurrenceRule.interval || 1;

	switch (recurrenceRule.frequency) {
		case "DAILY":
			nextDate.setDate(nextDate.getDate() + interval);
			break;

		case "WEEKLY":
			// For weekly events, always move by full weeks
			nextDate.setDate(nextDate.getDate() + 7 * interval);
			break;

		case "MONTHLY":
			if (recurrenceRule.byDay?.length) {
				nextDate.setMonth(nextDate.getMonth() + interval);
				const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
				const byDayRule = recurrenceRule.byDay[0];
				if (byDayRule) {
					const ruleDay = byDayRule.slice(-2);
					const targetDay = dayNames.indexOf(ruleDay);
					const ordinal = Number.parseInt(byDayRule.slice(0, -2), 10);

					nextDate.setDate(1); // Start of the month
					const firstDayOfMonth = nextDate.getDay();
					let dayOfMonth = (targetDay - firstDayOfMonth + 7) % 7;
					dayOfMonth += (ordinal - 1) * 7 + 1;

					nextDate.setDate(dayOfMonth);
				}
			} else {
				// For monthly events, move by months
				nextDate.setMonth(nextDate.getMonth() + interval);
			}
			break;

		case "YEARLY":
			// For yearly events, move by years
			nextDate.setFullYear(nextDate.getFullYear() + interval);
			break;

		default:
			// Default to daily if frequency is unknown
			nextDate.setDate(nextDate.getDate() + interval);
			break;
	}

	return nextDate;
}

/**
 * Validates recurrence rule configuration
 */
export function validateRecurrenceRule(
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	if (!recurrenceRule.frequency) {
		return false;
	}

	const validFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
	if (!validFrequencies.includes(recurrenceRule.frequency)) {
		return false;
	}

	if (recurrenceRule.interval && recurrenceRule.interval < 1) {
		return false;
	}

	return true;
}
