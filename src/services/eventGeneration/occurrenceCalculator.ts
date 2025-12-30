import type { eventsTable } from "~/src/drizzle/tables/events";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import type {
	CalculatedOccurrence,
	OccurrenceCalculationConfig,
	RecurrenceContext,
	ServiceDependencies,
} from "./types";

/**
 * Calculates the occurrence times for a recurring event based on its recurrence rule,
 * handling exceptions and various frequencies (daily, weekly, monthly, yearly).
 *
 * @param config - The configuration object containing the recurrence rule, base event, and time window.
 * @param logger - The logger for logging debug and informational messages.
 * @returns - An array of calculated occurrences, each with its start and end times and metadata.
 */
export function calculateInstanceOccurrences(
	config: OccurrenceCalculationConfig,
	logger: ServiceDependencies["logger"],
): CalculatedOccurrence[] {
	const { recurrenceRule, baseEvent, windowStart, windowEnd, exceptions } =
		config;

	if (!baseEvent.startAt || !baseEvent.endAt) {
		logger.warn(
			{
				baseEventId: baseEvent.id,
				startAt: baseEvent.startAt,
				endAt: baseEvent.endAt,
			},
			"Base event missing start or end time",
		);
		return [];
	}

	const context = buildRecurrenceContext(recurrenceRule, baseEvent, exceptions);
	const occurrences: CalculatedOccurrence[] = [];

	logger.debug(
		{
			baseEventStart: baseEvent.startAt.toISOString(),
			windowStart: windowStart.toISOString(),
			windowEnd: windowEnd.toISOString(),
			frequency: recurrenceRule.frequency,
			interval: recurrenceRule.interval,
			isNeverEnding: context.isNeverEnding,
			totalCount: context.totalCount,
		},
		"Starting occurrence calculation",
	);

	let currentDate = new Date(baseEvent.startAt);
	let iterationCount = 0;
	let sequenceNumber = 1;

	// For yearly events, create instances immediately without windowing
	if (recurrenceRule.frequency === "YEARLY") {
		while (
			recurrenceRule.recurrenceEndDate
				? currentDate <= recurrenceRule.recurrenceEndDate
				: sequenceNumber <= (context.totalCount || 1)
		) {
			if (
				shouldGenerateInstanceAtDate(
					currentDate,
					recurrenceRule,
					baseEvent.startAt,
				)
			) {
				const occurrence = createOccurrenceFromDate(
					currentDate,
					context,
					sequenceNumber,
				);
				occurrences.push(occurrence);
				sequenceNumber++;
			}
			currentDate.setFullYear(
				currentDate.getFullYear() + (recurrenceRule.interval || 1),
			);
		}
		return occurrences;
	}

	// Generate occurrences for other frequencies with windowing
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
			//  Check count limit BEFORE creating occurrence to include start date properly
			if (context.totalCount && sequenceNumber > context.totalCount) {
				logger.debug(
					`Stopping at sequence ${sequenceNumber}, reached count limit ${context.totalCount}`,
				);
				break;
			}

			// Only include instances that fall within our window
			if (currentDate >= windowStart) {
				const occurrence = createOccurrenceFromDate(
					currentDate,
					context,
					sequenceNumber,
				);
				occurrences.push(occurrence);
				logger.debug(
					`Created occurrence ${sequenceNumber} at ${currentDate.toISOString()}`,
				);
			}

			sequenceNumber++;
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

	logger.debug(
		{
			iterationCount,
			occurrencesGenerated: occurrences.length,
			sequenceNumber: sequenceNumber - 1,
			totalCount: context.totalCount,
		},
		"Occurrence calculation completed",
	);

	return occurrences;
}

/**
 * Builds a recurrence context object containing pre-calculated values and exception maps
 * to optimize the occurrence calculation process.
 *
 * @param recurrenceRule - The recurrence rule for the event.
 * @param baseEvent - The base event template.
 * @param exceptions - An array of exceptions for the event.
 * @returns - A recurrence context object with all necessary pre-calculated data.
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
		// Try to extract the original instance start time from exception data
		// For time-based exceptions, the key should be the original start time
		const exceptionData = exception.exceptionData as Record<string, unknown>;
		if (exceptionData.originalInstanceStartTime) {
			const startTime = new Date(
				exceptionData.originalInstanceStartTime as string | number | Date,
			);
			exceptionsByTime.set(startTime.toISOString(), exception);
		}
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
 * Creates a calculated occurrence object from a given date, applying any relevant exceptions
 * from the recurrence context.
 *
 * @param currentDate - The date for which to create the occurrence.
 * @param context - The recurrence context containing duration, exceptions, and other metadata.
 * @param sequenceNumber - The sequence number of this occurrence in the series.
 * @returns - A calculated occurrence object with its original and actual start/end times.
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
 * Determines whether a recurring event instance should be generated on a specific date,
 * based on the recurrence rule and its frequency-specific constraints.
 *
 * @param date - The date to check.
 * @param recurrenceRule - The recurrence rule to apply.
 * @param startDate - The start date of the base event.
 * @returns `true` if an instance should be generated on the given date, otherwise `false`.
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
 * Checks if an instance should be generated for a daily recurring event on a given date.
 *
 * @param date - The date to check.
 * @param recurrenceRule - The daily recurrence rule.
 * @returns `true` if an instance should be generated, otherwise `false`.
 */
function shouldGenerateForDaily(
	_date: Date,
	_recurrenceRule: typeof recurrenceRulesTable.$inferSelect,
): boolean {
	// For daily events, no additional day filters needed
	return true;
}

/**
 * Checks if an instance should be generated for a weekly recurring event on a given date,
 * based on the `byDay` filter in the recurrence rule.
 *
 * @param date - The date to check.
 * @param recurrenceRule - The weekly recurrence rule.
 * @returns `true` if an instance should be generated, otherwise `false`.
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
 * Checks if an instance should be generated for a monthly recurring event on a given date,
 * handling complex patterns like "the first Friday of the month".
 *
 * @param date - The date to check.
 * @param recurrenceRule - The monthly recurrence rule.
 * @returns `true` if an instance should be generated, otherwise `false`.
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
 * Checks if an instance should be generated for a yearly recurring event on a given date,
 * based on `byMonth` and `byMonthDay` filters in the recurrence rule.
 *
 * @param date - The date to check.
 * @param recurrenceRule - The yearly recurrence rule.
 * @returns `true` if an instance should be generated, otherwise `false`.
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
 * Calculates the next potential occurrence date based on the event's frequency and interval.
 * This function correctly handles advancing the date for all supported frequency types.
 *
 * @param currentDate - The current occurrence date.
 * @param recurrenceRule - The recurrence rule for the event.
 * @returns - The date of the next potential occurrence.
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
			// For weekly events with byDay filter, move day by day to check each day
			// For weekly events without byDay, move by full weeks
			if (recurrenceRule.byDay?.length) {
				nextDate.setDate(nextDate.getDate() + 1);
			} else {
				nextDate.setDate(nextDate.getDate() + 7 * interval);
			}
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
			} else if (recurrenceRule.byMonthDay?.length) {
				// For monthly events with byMonthDay, we need to handle month transitions properly
				const currentMonth = nextDate.getMonth();
				const currentYear = nextDate.getFullYear();

				// Try moving to the next day first
				nextDate.setDate(nextDate.getDate() + 1);

				// If we've moved to a different month, skip to the correct month based on interval
				if (nextDate.getMonth() !== currentMonth) {
					nextDate.setFullYear(currentYear);
					nextDate.setMonth(currentMonth + interval);
					nextDate.setDate(1); // Start from the beginning of the target month
				}
			} else {
				// For monthly events without filters, move by months
				nextDate.setMonth(nextDate.getMonth() + interval);
			}
			break;

		case "YEARLY":
			// For yearly events with byMonth or byMonthDay, move month by month
			// For yearly events without these filters, move by full years
			if (recurrenceRule.byMonth?.length || recurrenceRule.byMonthDay?.length) {
				nextDate.setMonth(nextDate.getMonth() + 1);
			} else {
				nextDate.setFullYear(nextDate.getFullYear() + interval);
			}
			break;

		default:
			// Default to daily if frequency is unknown
			nextDate.setDate(nextDate.getDate() + interval);
			break;
	}

	return nextDate;
}

/**
 * Validates the configuration of a recurrence rule to ensure it has a valid frequency
 * and a positive interval.
 *
 * @param recurrenceRule - The recurrence rule to validate.
 * @returns `true` if the recurrence rule is valid, otherwise `false`.
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
