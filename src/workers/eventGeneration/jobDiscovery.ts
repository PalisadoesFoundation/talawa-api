import { and, eq, inArray, lt } from "drizzle-orm";
import { eventGenerationWindowsTable } from "~/src/drizzle/tables/eventGenerationWindows";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import {
	estimateInstanceCount,
	normalizeRecurrenceRule,
} from "~/src/utilities/recurringEvent";
import type { EventGenerationJob } from "./executionEngine";
import type { WorkerDependencies } from "./types";

/**
 * Configuration for the job discovery process, defining limits and thresholds.
 */
export interface JobDiscoveryConfig {
	maxOrganizations: number;
	lookAheadMonths: number;
	priorityThreshold: number;
}

/**
 * Represents a discovered workload for a single organization, including all
 * recurring events that require EventGeneration.
 */
export interface DiscoveredWorkload {
	organizationId: string;
	windowConfig: typeof eventGenerationWindowsTable.$inferSelect;
	recurringEvents: Array<{
		eventId: string;
		eventName: string;
		ruleId: string;
		isNeverEnding: boolean;
		estimatedInstances: number;
		recurrenceRule: typeof recurrenceRulesTable.$inferSelect;
	}>;
	priority: number;
	estimatedDurationMs: number;
}

/**
 * Discovers organizations and their recurring events that require EventGeneration,
 * creating a prioritized list of workloads.
 *
 * @param config - The configuration for the job discovery process.
 * @param deps - The dependencies required for the worker, such as the database client and logger.
 * @returns - A promise that resolves to an array of discovered workloads, sorted by priority.
 */
export async function discoverEventGenerationWorkloads(
	config: JobDiscoveryConfig,
	deps: WorkerDependencies,
): Promise<DiscoveredWorkload[]> {
	const { logger } = deps;

	// Find organizations needing EventGeneration
	const organizationWindows = await findOrganizationsNeedingWork(config, deps);

	if (organizationWindows.length === 0) {
		logger.info("No organizations need EventGeneration work");
		return [];
	}

	const workloads: DiscoveredWorkload[] = [];

	// For each organization, discover their recurring events
	for (const windowConfig of organizationWindows) {
		try {
			const recurringEvents = await discoverRecurringEventsForOrganization(
				windowConfig.organizationId,
				deps,
			);

			if (recurringEvents.length === 0) {
				continue;
			}

			const priority = calculateWorkloadPriority(windowConfig, recurringEvents);
			const estimatedDuration = estimateWorkloadDuration(recurringEvents);

			workloads.push({
				organizationId: windowConfig.organizationId,
				windowConfig,
				recurringEvents,
				priority,
				estimatedDurationMs: estimatedDuration,
			});
		} catch (error) {
			logger.error(
				error,
				`Failed to discover workload for organization ${windowConfig.organizationId}`,
			);
		}
	}

	// Sort by priority (highest first)
	workloads.sort((a, b) => b.priority - a.priority);

	logger.info(
		{
			totalEvents: workloads.reduce(
				(sum, w) => sum + w.recurringEvents.length,
				0,
			),
			highPriorityWorkloads: workloads.filter((w) => w.priority > 7).length,
		},
		`Discovered ${workloads.length} EventGeneration workloads`,
	);

	return workloads;
}

/**
 * Converts a list of discovered workloads into an array of executable EventGeneration jobs.
 * This function uses a unified, date-based approach by normalizing recurrence rules.
 *
 * @param workloads - An array of discovered workloads to be converted.
 * @returns - An array of EventGeneration jobs ready for execution.
 */
export function createEventGenerationJobs(
	workloads: DiscoveredWorkload[],
): EventGenerationJob[] {
	const jobs: EventGenerationJob[] = [];
	const now = new Date();

	for (const workload of workloads) {
		for (const event of workload.recurringEvents) {
			// Normalize the recurrence rule (convert count to end date)
			const normalizedRule = normalizeRecurrenceRule(
				event.recurrenceRule as typeof recurrenceRulesTable.$inferSelect,
			);

			// Calculate window end date based on the normalized rule
			const windowEndDate = calculateWindowEndDateForEvent(
				normalizedRule,
				workload.windowConfig,
				now,
			);

			jobs.push({
				organizationId: workload.organizationId,
				baseRecurringEventId: event.eventId,
				windowStartDate: workload.windowConfig.currentWindowEndDate,
				windowEndDate,
			});
		}
	}

	return jobs;
}

/**
 * Calculates the appropriate window end date for a given event, using a unified approach
 * that considers the event's normalized end date.
 *
 * @param normalizedRule - The normalized recurrence rule, with count converted to an end date.
 * @param windowConfig - The EventGeneration window configuration for the organization.
 * @param now - The current date, used as a reference for calculations.
 * @returns - The calculated end date for the EventGeneration window.
 */
function calculateWindowEndDateForEvent(
	normalizedRule: typeof recurrenceRulesTable.$inferSelect,
	windowConfig: typeof eventGenerationWindowsTable.$inferSelect,
	now: Date,
): Date {
	// Default window end date (12 months from now)
	const defaultWindowEnd = new Date(now);
	defaultWindowEnd.setMonth(
		defaultWindowEnd.getMonth() + windowConfig.hotWindowMonthsAhead,
	);

	// If event has an end date (either original or calculated from count)
	if (normalizedRule.recurrenceEndDate) {
		// Add small buffer (1 week) to end date
		const endWithBuffer = new Date(normalizedRule.recurrenceEndDate);
		endWithBuffer.setDate(endWithBuffer.getDate() + 7);

		// Use the later of: event end date or default window
		// This ensures we never cut off events early, but extend when needed
		return endWithBuffer > defaultWindowEnd ? endWithBuffer : defaultWindowEnd;
	}

	// For never-ending events, use default window
	return defaultWindowEnd;
}

/**
 * Finds organizations that require EventGeneration work based on their current window
 * and processing status.
 *
 * @param config - The job discovery configuration.
 * @param deps - The worker dependencies.
 * @returns - A promise that resolves to an array of organization window configurations.
 */
async function findOrganizationsNeedingWork(
	config: JobDiscoveryConfig,
	deps: WorkerDependencies,
): Promise<(typeof eventGenerationWindowsTable.$inferSelect)[]> {
	const { drizzleClient } = deps;
	const now = new Date();

	const lookAheadDate = new Date(now);
	lookAheadDate.setMonth(lookAheadDate.getMonth() + config.lookAheadMonths);

	const lastProcessedThreshold = new Date(now);
	lastProcessedThreshold.setHours(lastProcessedThreshold.getHours() - 1);

	return await drizzleClient.query.eventGenerationWindowsTable.findMany({
		where: and(
			eq(eventGenerationWindowsTable.isEnabled, true),
			lt(eventGenerationWindowsTable.currentWindowEndDate, lookAheadDate),
			lt(eventGenerationWindowsTable.lastProcessedAt, lastProcessedThreshold),
		),
		orderBy: [eventGenerationWindowsTable.processingPriority],
		limit: config.maxOrganizations,
	});
}

/**
 * Discovers all recurring event templates for a given organization that may require
 * EventGeneration, fetching results in stable, paginated batches and joining each
 * event to its recurrence rule before returning the aggregated details.
 *
 * @param organizationId - The ID of the organization to discover events for.
 * @param deps - The worker dependencies.
 * @returns - A promise that resolves to an array of detailed recurring event information.
 */
async function discoverRecurringEventsForOrganization(
	organizationId: string,
	deps: WorkerDependencies,
): Promise<
	Array<{
		eventId: string;
		eventName: string;
		ruleId: string;
		isNeverEnding: boolean;
		estimatedInstances: number;
		recurrenceRule: typeof recurrenceRulesTable.$inferSelect;
	}>
> {
	const { drizzleClient } = deps;
	const EVENT_BATCH_SIZE = 500;
	let offset = 0;
	const eventDetails = [];
	while (true) {
		const recurringEvents =
			(await drizzleClient.query.eventsTable.findMany({
				where: and(
					eq(eventsTable.organizationId, organizationId),
					eq(eventsTable.isRecurringEventTemplate, true),
				),
				orderBy: [eventsTable.id], // IMPORTANT (stable pagination)
				limit: EVENT_BATCH_SIZE,
				offset,
			})) ?? [];

		if (recurringEvents.length === 0) break;

		const eventIds = recurringEvents.map((e) => e.id);

		const recurrenceRules =
			await drizzleClient.query.recurrenceRulesTable.findMany({
				where: inArray(recurrenceRulesTable.baseRecurringEventId, eventIds),
			});
		const ruleMap = new Map(
			recurrenceRules.map((rule) => [rule.baseRecurringEventId, rule]),
		);
		for (const event of recurringEvents) {
			const rule = ruleMap.get(event.id);
			if (!rule) continue;

			const isNeverEnding = !rule.count && !rule.recurrenceEndDate;
			const estimatedInstances = estimateInstanceCount(rule);

			eventDetails.push({
				eventId: event.id,
				eventName: event.name || "Unnamed Event",
				ruleId: rule.id,
				isNeverEnding,
				estimatedInstances,
				recurrenceRule: rule,
			});
		}
		offset += recurringEvents.length;
	}

	return eventDetails;
}

/**
 * Calculates the priority of a EventGeneration workload based on factors like event type,
 * window urgency, and the number of events.
 *
 * @param windowConfig - The EventGeneration window configuration.
 * @param recurringEvents - An array of recurring events in the workload.
 * @returns - A numerical priority score, with higher values indicating higher priority.
 */
function calculateWorkloadPriority(
	windowConfig: typeof eventGenerationWindowsTable.$inferSelect,
	recurringEvents: Array<{
		isNeverEnding: boolean;
		estimatedInstances: number;
	}>,
): number {
	let priority = windowConfig.processingPriority || 5;

	// Never-ending events get higher priority
	const neverEndingCount = recurringEvents.filter(
		(e) => e.isNeverEnding,
	).length;
	if (neverEndingCount > 0) {
		priority += Math.min(neverEndingCount * 0.5, 2);
	}

	// Window urgency
	const now = new Date();
	const daysUntilWindowEnd =
		(windowConfig.currentWindowEndDate.getTime() - now.getTime()) /
		(1000 * 60 * 60 * 24);
	if (daysUntilWindowEnd < 7) {
		priority += ((7 - daysUntilWindowEnd) / 7) * 2;
	}

	// Size factor
	const totalEvents = recurringEvents.length;
	if (totalEvents > 10) {
		priority += Math.min(totalEvents / 50, 1);
	}

	return Math.min(priority, 10);
}

/**
 * Estimates the duration of a EventGeneration workload based on the number of events
 * and the total estimated instances to be created.
 *
 * @param recurringEvents - An array of recurring events in the workload.
 * @returns - The estimated duration of the workload in milliseconds.
 */
function estimateWorkloadDuration(
	recurringEvents: Array<{ estimatedInstances: number }>,
): number {
	const baseTime = 5000; // 5 seconds base
	const timePerEvent = 1000; // 1 second per event
	const timePerInstance = 10; // 10ms per instance

	const totalInstances = recurringEvents.reduce(
		(sum, e) => sum + e.estimatedInstances,
		0,
	);

	return (
		baseTime +
		recurringEvents.length * timePerEvent +
		totalInstances * timePerInstance
	);
}

/**
 * Creates a default configuration object for the job discovery process.
 *
 * @returns - A default job discovery configuration.
 */
export function createDefaultJobDiscoveryConfig(): JobDiscoveryConfig {
	return {
		maxOrganizations: 50,
		lookAheadMonths: 1,
		priorityThreshold: 5,
	};
}
