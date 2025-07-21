import { and, eq, lt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type * as schema from "~/src/drizzle/schema";
import { eventGenerationWindowsTable } from "~/src/drizzle/tables/eventGenerationWindows";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";

/**
 * Worker dependencies for window management functions
 */
export interface WorkerDependencies {
	drizzleClient: NodePgDatabase<typeof schema>;
	logger: FastifyBaseLogger;
}

/**
 * Configuration for window processing
 */
export interface WindowProcessingConfig {
	maxOrganizationsPerRun: number;
	processingTimeoutHours: number;
	priorityThresholdWeeks: number;
}

/**
 * Result of window processing
 */
export interface WindowProcessingResult {
	windowId: string;
	organizationId: string;
	instancesCreated: number;
	eventsProcessed: number;
	processingTime: number;
}

/**
 * Gets organizations that need materialization processing.
 * This includes organizations where:
 * - Window end date is approaching (less than 1 month ahead)
 * - Haven't been processed recently
 * - Are enabled for materialization
 * - Special handling for never-ending events (more frequent processing)
 */
export async function getOrganizationsNeedingMaterialization(
	config: WindowProcessingConfig,
	deps: WorkerDependencies,
): Promise<(typeof eventGenerationWindowsTable.$inferSelect)[]> {
	const { maxOrganizationsPerRun, processingTimeoutHours } = config;
	const { drizzleClient, logger } = deps;

	const now = new Date();
	const oneMonthFromNow = new Date(now);
	oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

	const processingTimeoutDate = new Date(now);
	processingTimeoutDate.setHours(
		processingTimeoutDate.getHours() - processingTimeoutHours,
	);

	logger.debug("Getting organizations needing materialization", {
		oneMonthFromNow: oneMonthFromNow.toISOString(),
		processingTimeoutDate: processingTimeoutDate.toISOString(),
		maxOrganizations: maxOrganizationsPerRun,
	});

	const organizations =
		await drizzleClient.query.eventGenerationWindowsTable.findMany({
			where: and(
				eq(eventGenerationWindowsTable.isEnabled, true),
				// Window end is approaching (needs extension)
				lt(eventGenerationWindowsTable.currentWindowEndDate, oneMonthFromNow),
				// Haven't processed recently (prevent excessive processing)
				lt(eventGenerationWindowsTable.lastProcessedAt, processingTimeoutDate),
			),
			orderBy: [eventGenerationWindowsTable.processingPriority], // High priority first
			limit: maxOrganizationsPerRun,
		});

	logger.info(
		`Found ${organizations.length} organizations needing materialization processing`,
	);

	return organizations;
}

/**
 * Updates the materialization window after successful processing.
 */
export async function updateWindowAfterProcessing(
	windowId: string,
	processingResult: WindowProcessingResult,
	deps: WorkerDependencies,
): Promise<void> {
	const { drizzleClient, logger } = deps;
	const now = new Date();

	// Get current window config to calculate new end date
	const currentWindow =
		await drizzleClient.query.eventGenerationWindowsTable.findFirst({
			where: eq(eventGenerationWindowsTable.id, windowId),
		});

	if (!currentWindow) {
		throw new Error(`Window configuration not found: ${windowId}`);
	}

	// Calculate new window end date
	const newWindowEndDate = new Date(now);
	newWindowEndDate.setMonth(
		newWindowEndDate.getMonth() + currentWindow.hotWindowMonthsAhead,
	);

	// Update window configuration with processing stats
	await drizzleClient
		.update(eventGenerationWindowsTable)
		.set({
			currentWindowEndDate: newWindowEndDate,
			lastProcessedAt: now,
			lastProcessedInstanceCount: processingResult.instancesCreated,
			// Store processing metrics in configuration notes
			configurationNotes: buildProcessingNotes(currentWindow, processingResult),
		})
		.where(eq(eventGenerationWindowsTable.id, windowId));

	logger.info("Updated materialization window", {
		windowId,
		organizationId: processingResult.organizationId,
		newWindowEndDate: newWindowEndDate.toISOString(),
		instancesCreated: processingResult.instancesCreated,
		eventsProcessed: processingResult.eventsProcessed,
		processingTime: processingResult.processingTime,
	});
}

/**
 * Builds processing notes for window configuration
 */
function buildProcessingNotes(
	currentWindow: typeof eventGenerationWindowsTable.$inferSelect,
	processingResult: WindowProcessingResult,
): string {
	const previousNotes = currentWindow.configurationNotes || "";
	const timestamp = new Date().toISOString();

	const newNote =
		`[${timestamp}] Processed ${processingResult.eventsProcessed} events, ` +
		`created ${processingResult.instancesCreated} instances in ${processingResult.processingTime}ms`;

	// Keep last 5 processing notes to avoid unbounded growth
	const notes = previousNotes
		.split("\n")
		.filter((note) => note.trim())
		.slice(-4);
	notes.push(newNote);

	return notes.join("\n");
}

/**
 * Gets materialization status for an organization.
 */
export async function getOrganizationMaterializationStatus(
	organizationId: string,
	deps: WorkerDependencies,
): Promise<{
	windowConfig: typeof eventGenerationWindowsTable.$inferSelect | null;
	recurringEventsCount: number;
	materializedInstancesCount: number;
	lastProcessedAt: Date | null;
	needsProcessing: boolean;
	processingPriority: number;
}> {
	const { drizzleClient } = deps;

	// Get window configuration
	const windowConfig =
		await drizzleClient.query.eventGenerationWindowsTable.findFirst({
			where: eq(eventGenerationWindowsTable.organizationId, organizationId),
		});

	// Count recurring events
	const recurringEvents = await drizzleClient.query.eventsTable.findMany({
		where: and(
			eq(eventsTable.organizationId, organizationId),
			eq(eventsTable.isRecurringEventTemplate, true),
		),
		columns: { id: true },
	});

	// Count materialized instances
	const materializedInstances =
		await drizzleClient.query.recurringEventInstancesTable.findMany({
			where: eq(recurringEventInstancesTable.organizationId, organizationId),
			columns: { id: true },
		});

	// Determine if processing is needed
	const needsProcessing = calculateNeedsProcessing(windowConfig || null);

	return {
		windowConfig: windowConfig || null,
		recurringEventsCount: recurringEvents.length,
		materializedInstancesCount: materializedInstances.length,
		lastProcessedAt: windowConfig?.lastProcessedAt || null,
		needsProcessing,
		processingPriority: windowConfig?.processingPriority || 5,
	};
}

/**
 * Calculates if an organization needs processing based on window configuration
 */
function calculateNeedsProcessing(
	windowConfig: typeof eventGenerationWindowsTable.$inferSelect | null,
): boolean {
	if (!windowConfig) {
		return true; // No window config means needs setup
	}

	const now = new Date();
	const oneMonthFromNow = new Date(now);
	oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

	// Check if window end is approaching
	const windowEndApproaching =
		windowConfig.currentWindowEndDate < oneMonthFromNow;

	// Check if hasn't been processed recently (more than 1 hour ago)
	const oneHourAgo = new Date(now);
	oneHourAgo.setHours(oneHourAgo.getHours() - 1);
	const notProcessedRecently =
		!windowConfig.lastProcessedAt || windowConfig.lastProcessedAt < oneHourAgo;

	return windowEndApproaching && notProcessedRecently;
}

/**
 * Validates window configuration for processing
 */
export function validateWindowConfiguration(
	windowConfig: typeof eventGenerationWindowsTable.$inferSelect,
): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!windowConfig.isEnabled) {
		errors.push("Window is not enabled for processing");
	}

	if (windowConfig.hotWindowMonthsAhead < 1) {
		errors.push("Hot window months ahead must be at least 1");
	}

	if (windowConfig.maxInstancesPerRun < 1) {
		errors.push("Max instances per run must be at least 1");
	}

	if (
		windowConfig.processingPriority < 1 ||
		windowConfig.processingPriority > 10
	) {
		errors.push("Processing priority must be between 1 and 10");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Gets processing statistics for all organizations
 */
export async function getProcessingStatistics(
	deps: WorkerDependencies,
): Promise<{
	totalOrganizations: number;
	enabledOrganizations: number;
	organizationsNeedingProcessing: number;
	averageInstancesPerRun: number;
	lastProcessingRun: Date | null;
}> {
	const { drizzleClient } = deps;

	const [allWindows, enabledWindows] = await Promise.all([
		drizzleClient.query.eventGenerationWindowsTable.findMany({
			columns: {
				id: true,
				isEnabled: true,
				lastProcessedInstanceCount: true,
				lastProcessedAt: true,
				currentWindowEndDate: true,
			},
		}),
		drizzleClient.query.eventGenerationWindowsTable.findMany({
			where: eq(eventGenerationWindowsTable.isEnabled, true),
			columns: {
				id: true,
				lastProcessedInstanceCount: true,
				lastProcessedAt: true,
				currentWindowEndDate: true,
			},
		}),
	]);

	const now = new Date();
	const oneMonthFromNow = new Date(now);
	oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

	const organizationsNeedingProcessing = enabledWindows.filter(
		(window: { currentWindowEndDate: Date }) =>
			window.currentWindowEndDate < oneMonthFromNow,
	).length;

	const instanceCounts = enabledWindows
		.map(
			(window: { lastProcessedInstanceCount: number | null }) =>
				window.lastProcessedInstanceCount || 0,
		)
		.filter((count: number) => count > 0);

	const averageInstancesPerRun =
		instanceCounts.length > 0
			? instanceCounts.reduce((sum: number, count: number) => sum + count, 0) /
				instanceCounts.length
			: 0;

	const lastProcessingRun =
		enabledWindows
			.map((window: { lastProcessedAt: Date | null }) => window.lastProcessedAt)
			.filter((date: Date | null): date is Date => date !== null)
			.sort((a: Date, b: Date) => b.getTime() - a.getTime())[0] || null;

	return {
		totalOrganizations: allWindows.length,
		enabledOrganizations: enabledWindows.length,
		organizationsNeedingProcessing,
		averageInstancesPerRun: Math.round(averageInstancesPerRun),
		lastProcessingRun,
	};
}

/**
 * Returns fixed processing configuration - no dynamic adjustment
 */
export function getFixedProcessingConfig(): WindowProcessingConfig {
	return {
		maxOrganizationsPerRun: 50,
		processingTimeoutHours: 1,
		priorityThresholdWeeks: 2,
	};
}
