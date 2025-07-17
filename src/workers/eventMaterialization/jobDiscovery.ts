import { and, eq, lt } from "drizzle-orm";
import { eventMaterializationWindowsTable } from "~/src/drizzle/tables/eventMaterializationWindows";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import {
	estimateInstanceCount,
	normalizeRecurrenceRule,
} from "~/src/utilities/recurringEventHelpers";
import type { MaterializationJob } from "./executionEngine";
import type { WorkerDependencies } from "./types";

/**
 * Job discovery and creation for materialization workloads
 * Uses unified approach: converts count-based events to end-date-based events
 */

export interface JobDiscoveryConfig {
	maxOrganizations: number;
	lookAheadMonths: number;
	priorityThreshold: number;
}

export interface DiscoveredWorkload {
	organizationId: string;
	windowConfig: typeof eventMaterializationWindowsTable.$inferSelect;
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
 * Discovers organizations and events that need materialization
 */
export async function discoverMaterializationWorkloads(
	config: JobDiscoveryConfig,
	deps: WorkerDependencies,
): Promise<DiscoveredWorkload[]> {
	const { logger } = deps;

	// Find organizations needing materialization
	const organizationWindows = await findOrganizationsNeedingWork(config, deps);

	if (organizationWindows.length === 0) {
		logger.info("No organizations need materialization work");
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
				`Failed to discover workload for organization ${windowConfig.organizationId}`,
				error,
			);
		}
	}

	// Sort by priority (highest first)
	workloads.sort((a, b) => b.priority - a.priority);

	logger.info(`Discovered ${workloads.length} materialization workloads`, {
		totalEvents: workloads.reduce(
			(sum, w) => sum + w.recurringEvents.length,
			0,
		),
		highPriorityWorkloads: workloads.filter((w) => w.priority > 7).length,
	});

	return workloads;
}

/**
 * Converts discovered workloads into executable materialization jobs with unified date-based approach
 */
export function createMaterializationJobs(
	workloads: DiscoveredWorkload[],
): MaterializationJob[] {
	const jobs: MaterializationJob[] = [];
	const now = new Date();

	for (const workload of workloads) {
		for (const event of workload.recurringEvents) {
			// Normalize the recurrence rule (convert count to end date)
			const normalizedRule = normalizeRecurrenceRule(event.recurrenceRule);

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
 * Calculates appropriate window end date for an event based on its end date (unified approach)
 */
function calculateWindowEndDateForEvent(
	normalizedRule: typeof recurrenceRulesTable.$inferSelect,
	windowConfig: typeof eventMaterializationWindowsTable.$inferSelect,
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
 * Finds organizations that need materialization work
 */
async function findOrganizationsNeedingWork(
	config: JobDiscoveryConfig,
	deps: WorkerDependencies,
): Promise<(typeof eventMaterializationWindowsTable.$inferSelect)[]> {
	const { drizzleClient } = deps;
	const now = new Date();

	const lookAheadDate = new Date(now);
	lookAheadDate.setMonth(lookAheadDate.getMonth() + config.lookAheadMonths);

	const lastProcessedThreshold = new Date(now);
	lastProcessedThreshold.setHours(lastProcessedThreshold.getHours() - 1);

	return await drizzleClient.query.eventMaterializationWindowsTable.findMany({
		where: and(
			eq(eventMaterializationWindowsTable.isEnabled, true),
			lt(eventMaterializationWindowsTable.currentWindowEndDate, lookAheadDate),
			lt(
				eventMaterializationWindowsTable.lastProcessedAt,
				lastProcessedThreshold,
			),
		),
		orderBy: [eventMaterializationWindowsTable.processingPriority],
		limit: config.maxOrganizations,
	});
}

/**
 * Discovers recurring events for an organization
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

	// Get recurring events
	const recurringEvents = await drizzleClient.query.eventsTable.findMany({
		where: and(
			eq(eventsTable.organizationId, organizationId),
			eq(eventsTable.isRecurringTemplate, true),
		),
	});

	// Get recurrence rules
	const recurrenceRules =
		await drizzleClient.query.recurrenceRulesTable.findMany({
			where: eq(recurrenceRulesTable.organizationId, organizationId),
		});

	const ruleMap = new Map(
		recurrenceRules.map((rule) => [rule.baseRecurringEventId, rule]),
	);

	const eventDetails = [];

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

	return eventDetails;
}

/**
 * Calculates priority for a workload
 */
function calculateWorkloadPriority(
	windowConfig: typeof eventMaterializationWindowsTable.$inferSelect,
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
 * Estimates workload duration
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
 * Creates default job discovery configuration
 */
export function createDefaultJobDiscoveryConfig(): JobDiscoveryConfig {
	return {
		maxOrganizations: 50,
		lookAheadMonths: 1,
		priorityThreshold: 5,
	};
}
