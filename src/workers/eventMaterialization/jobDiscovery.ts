import { and, eq, lt } from "drizzle-orm";
import { eventMaterializationWindowsTable } from "~/src/drizzle/tables/eventMaterializationWindows";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { MaterializationJob } from "./executionEngine";
import type { WorkerDependencies } from "./types";

/**
 * Job discovery and creation for materialization workloads
 * Handles finding work that needs to be done and converting it to executable jobs
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
 * Converts discovered workloads into executable materialization jobs
 */
export function createMaterializationJobs(
	workloads: DiscoveredWorkload[],
): MaterializationJob[] {
	const jobs: MaterializationJob[] = [];
	const now = new Date();

	for (const workload of workloads) {
		const windowEndDate = new Date(now);
		windowEndDate.setMonth(
			windowEndDate.getMonth() + workload.windowConfig.hotWindowMonthsAhead,
		);

		for (const event of workload.recurringEvents) {
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
 * Estimates instance count for a recurrence rule
 */
function estimateInstanceCount(
	rule: typeof recurrenceRulesTable.$inferSelect,
): number {
	if (rule.count) return rule.count;

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
				return 100;
		}
	}

	// Never-ending: estimate for 12 months
	const interval = rule.interval || 1;
	switch (rule.frequency) {
		case "DAILY":
			return Math.ceil(365 / interval);
		case "WEEKLY":
			return Math.ceil(52 / interval);
		case "MONTHLY":
			return Math.ceil(12 / interval);
		case "YEARLY":
			return Math.ceil(1 / interval);
		default:
			return 100;
	}
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
