import type { InferSelectModel } from "drizzle-orm";
import type { z } from "zod";
import type { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { recurrenceInputSchema } from "~/src/graphql/inputs/RecurrenceInput";

/**
 * Represents a virtual event instance (computed on-demand)
 */
export type VirtualEventInstance = InferSelectModel<typeof eventsTable> & {
	// Override these fields for virtual instances
	id: string; // Virtual ID like "base-id:2024-01-08T10:00:00Z"
	startAt: Date;
	endAt: Date;
	instanceStartTime: Date;
	recurringEventId: string;
	isRecurringTemplate: false;
	// Computed fields
	isVirtualInstance: true;
	baseEventId: string;
	hasExceptions: boolean;
};

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
 * Generate virtual event instances for a given time window
 * This is the core inheritance function - instances inherit from template
 */
export const generateVirtualInstances = (
	baseEvent: InferSelectModel<typeof eventsTable>,
	recurrenceRule: InferSelectModel<typeof recurrenceRulesTable>,
	windowStart: Date,
	windowEnd: Date,
	exceptions: InferSelectModel<typeof eventExceptionsTable>[] = [],
): VirtualEventInstance[] => {
	const instances: VirtualEventInstance[] = [];

	if (!baseEvent.isRecurringTemplate) {
		return instances; // Not a recurring event
	}

	if (!baseEvent.startAt || !baseEvent.endAt) {
		return instances; // Invalid recurring event without dates
	}

	const startDate = new Date(baseEvent.startAt);
	const endDate = new Date(baseEvent.endAt);
	const duration = endDate.getTime() - startDate.getTime();

	// Basic frequency handling - enhanced version
	let currentDate = new Date(
		Math.max(startDate.getTime(), windowStart.getTime()),
	);
	let instanceCount = 0;

	// For infinite recurrence (never-ending), use a reasonable safety limit
	// For count-based recurrence, use the specified count
	const maxInstances = recurrenceRule.count || 1000; // Increased safety limit for infinite events

	while (currentDate <= windowEnd && instanceCount < maxInstances) {
		// Check if we should generate an instance at this date
		if (shouldGenerateInstance(currentDate, recurrenceRule, startDate)) {
			const instanceStartTime = new Date(currentDate);
			const instanceEndTime = new Date(currentDate.getTime() + duration);

			// Check if this instance has exceptions
			const instanceException = exceptions.find(
				(ex) => ex.instanceStartTime.getTime() === instanceStartTime.getTime(),
			);

			// Create virtual instance with inheritance
			const virtualInstance: VirtualEventInstance = {
				// Inherit all fields from base event
				...baseEvent,
				// Override with virtual instance data
				id: `${baseEvent.id}:${instanceStartTime.toISOString()}`,
				startAt: instanceStartTime,
				endAt: instanceEndTime,
				instanceStartTime: instanceStartTime,
				recurringEventId: baseEvent.id,
				isRecurringTemplate: false,
				// Virtual instance metadata
				isVirtualInstance: true,
				baseEventId: baseEvent.id,
				hasExceptions: !!instanceException,
			};

			// Apply exceptions if they exist
			if (instanceException?.exceptionData) {
				Object.assign(virtualInstance, instanceException.exceptionData);
			}

			instances.push(virtualInstance);
			instanceCount++;
		}

		// Move to next potential date based on frequency
		currentDate = getNextDate(currentDate, recurrenceRule);

		// Safety check to prevent infinite loops (especially important for never-ending events)
		if (instanceCount > 1000) break;
	}

	return instances;
};

/**
 * Check if we should generate an instance at the given date
 */
const shouldGenerateInstance = (
	date: Date,
	recurrenceRule: InferSelectModel<typeof recurrenceRulesTable>,
	startDate: Date,
): boolean => {
	// Check if date is before start date
	if (date < startDate) return false;

	// Check if we have an end date and we're past it
	// For never-ending events, recurrenceEndDate will be null, so this check is skipped
	if (
		recurrenceRule.recurrenceEndDate &&
		date > recurrenceRule.recurrenceEndDate
	) {
		return false;
	}

	// Check byDay filter for weekly events
	if (recurrenceRule.frequency === "WEEKLY" && recurrenceRule.byDay) {
		const dayNames = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
		const dayOfWeek = dayNames[date.getDay()];
		if (!dayOfWeek || !recurrenceRule.byDay.includes(dayOfWeek)) {
			return false;
		}
	}

	// Check byMonth filter
	if (recurrenceRule.byMonth) {
		const month = date.getMonth() + 1; // getMonth() returns 0-11
		if (!recurrenceRule.byMonth.includes(month)) {
			return false;
		}
	}

	// Check byMonthDay filter
	if (recurrenceRule.byMonthDay) {
		const dayOfMonth = date.getDate();
		if (!recurrenceRule.byMonthDay.includes(dayOfMonth)) {
			return false;
		}
	}

	return true;
};

/**
 * Get the next date based on frequency and interval
 */
const getNextDate = (
	currentDate: Date,
	recurrenceRule: InferSelectModel<typeof recurrenceRulesTable>,
): Date => {
	const nextDate = new Date(currentDate);
	const interval = recurrenceRule.interval || 1;

	switch (recurrenceRule.frequency) {
		case "DAILY":
			nextDate.setDate(nextDate.getDate() + interval);
			break;
		case "WEEKLY":
			nextDate.setDate(nextDate.getDate() + 7 * interval);
			break;
		case "MONTHLY":
			nextDate.setMonth(nextDate.getMonth() + interval);
			break;
		case "YEARLY":
			nextDate.setFullYear(nextDate.getFullYear() + interval);
			break;
	}

	return nextDate;
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

/**
 * Utility to determine if an event ID represents a virtual instance
 */
export const isVirtualEventId = (eventId: string): boolean => {
	return (
		eventId.includes(":") && eventId.includes("T") && eventId.includes("Z")
	);
};

/**
 * Extract base event ID from virtual instance ID
 */
export const getBaseEventId = (virtualEventId: string): string => {
	if (!isVirtualEventId(virtualEventId)) {
		return virtualEventId; // Already a base ID
	}
	const parts = virtualEventId.split(":");
	return parts[0] || virtualEventId;
};

/**
 * Extract instance start time from virtual instance ID
 */
export const getInstanceStartTime = (virtualEventId: string): Date | null => {
	if (!isVirtualEventId(virtualEventId)) {
		return null; // Not a virtual instance
	}
	const parts = virtualEventId.split(":");
	const timeString = parts.slice(1).join(":");
	return timeString ? new Date(timeString) : null;
};
