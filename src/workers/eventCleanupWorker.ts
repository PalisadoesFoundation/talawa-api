import { and, eq, lt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type * as schema from "~/src/drizzle/schema";
import { eventGenerationWindowsTable } from "~/src/drizzle/tables/eventGenerationWindows";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";

/**
 * The main method for the cleanup worker, which processes all organizations
 * and removes instances that have passed their retention period.
 *
 * @returns - A promise that resolves to an object with statistics about the cleanup process.
 */
export async function cleanupOldInstances(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<{
	organizationsProcessed: number;
	instancesDeleted: number;
	errorsEncountered: number;
}> {
	const stats = {
		organizationsProcessed: 0,
		instancesDeleted: 0,
		errorsEncountered: 0,
	};

	try {
		// Get all organizations with materialization windows
		const organizationWindows =
			await drizzleClient.query.eventGenerationWindowsTable.findMany({
				where: eq(eventGenerationWindowsTable.isEnabled, true),
				orderBy: [eventGenerationWindowsTable.organizationId],
			});

		logger.info(
			`Found ${organizationWindows.length} organizations for cleanup processing`,
		);

		// Process each organization individually
		for (const windowConfig of organizationWindows) {
			try {
				const deletedCount = await cleanupOrganizationInstances(
					windowConfig,
					drizzleClient,
					logger,
				);

				stats.organizationsProcessed++;
				stats.instancesDeleted += deletedCount;
			} catch (error) {
				stats.errorsEncountered++;
				logger.error(
					error,
					`Failed to cleanup instances for organization ${windowConfig.organizationId}:`,
				);
				// Continue processing other organizations
			}
		}

		return stats;
	} catch (error) {
		logger.error(error, "Failed to process instance cleanup:");
		throw error;
	}
}

/**
 * Cleans up old materialized instances for a single, specific organization based on its
 * retention policy.
 *
 * @param windowConfig - The materialization window configuration for the organization.
 * @returns - A promise that resolves to the number of instances deleted for the organization.
 */
async function cleanupOrganizationInstances(
	windowConfig: typeof eventGenerationWindowsTable.$inferSelect,
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<number> {
	const { organizationId, historyRetentionMonths } = windowConfig;

	// Calculate retention cutoff date
	const now = new Date();
	const retentionCutoffDate = new Date(now);
	retentionCutoffDate.setMonth(
		retentionCutoffDate.getMonth() - historyRetentionMonths,
	);

	logger.info(
		`Cleaning up instances for organization ${organizationId} ` +
			`older than ${retentionCutoffDate.toISOString()}`,
	);

	// Count instances that will be deleted (for logging)
	const instancesToDelete =
		await drizzleClient.query.recurringEventInstancesTable.findMany({
			where: and(
				eq(recurringEventInstancesTable.organizationId, organizationId),
				lt(recurringEventInstancesTable.actualEndTime, retentionCutoffDate),
			),
			columns: { id: true },
		});

	if (instancesToDelete.length === 0) {
		logger.debug(
			`No old instances to cleanup for organization ${organizationId}`,
		);
		return 0;
	}

	// Delete old instances
	const result = await drizzleClient
		.delete(recurringEventInstancesTable)
		.where(
			and(
				eq(recurringEventInstancesTable.organizationId, organizationId),
				lt(recurringEventInstancesTable.actualEndTime, retentionCutoffDate),
			),
		);

	const deletedCount = result.rowCount || 0;

	logger.info(
		`Cleaned up ${deletedCount} old instances for organization ${organizationId}`,
	);

	// Update retention start date in window config
	await updateRetentionStartDate(
		windowConfig.id,
		retentionCutoffDate,
		drizzleClient,
		logger,
	);

	return deletedCount;
}

/**
 * Updates the retention start date in the window configuration for an organization.
 *
 * @param windowId - The ID of the window configuration to update.
 * @param newRetentionStartDate - The new retention start date to set.
 */
async function updateRetentionStartDate(
	windowId: string,
	newRetentionStartDate: Date,
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	await drizzleClient
		.update(eventGenerationWindowsTable)
		.set({
			retentionStartDate: newRetentionStartDate,
		})
		.where(eq(eventGenerationWindowsTable.id, windowId));

	logger.debug(`Updated retention start date for window ${windowId}`);
}

/**
 * Manually triggers a cleanup of old instances for a specific organization.
 *
 * @param organizationId - The ID of the organization to clean up.
 * @returns - A promise that resolves to an object containing the number of deleted instances
 *          and the retention cutoff date used.
 */
export async function cleanupSpecificOrganization(
	organizationId: string,
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<{
	instancesDeleted: number;
	retentionCutoffDate: Date;
}> {
	logger.info(
		`Manually cleaning up instances for organization ${organizationId}`,
	);

	// Get window configuration for this organization
	const windowConfig =
		await drizzleClient.query.eventGenerationWindowsTable.findFirst({
			where: eq(eventGenerationWindowsTable.organizationId, organizationId),
		});

	if (!windowConfig) {
		throw new Error(
			`No materialization window found for organization ${organizationId}`,
		);
	}

	const instancesDeleted = await cleanupOrganizationInstances(
		windowConfig,
		drizzleClient,
		logger,
	);

	// Calculate retention cutoff date for response
	const now = new Date();
	const retentionCutoffDate = new Date(now);
	retentionCutoffDate.setMonth(
		retentionCutoffDate.getMonth() - windowConfig.historyRetentionMonths,
	);

	return {
		instancesDeleted,
		retentionCutoffDate,
	};
}

/**
 * Retrieves the cleanup status for a specific organization, including the number of instances
 * eligible for cleanup and the current retention settings.
 *
 * @param organizationId - The ID of the organization to get the status for.
 * @returns - A promise that resolves to an object with the cleanup status details.
 */
export async function getOrganizationCleanupStatus(
	organizationId: string,
	drizzleClient: NodePgDatabase<typeof schema>,
): Promise<{
	totalInstances: number;
	instancesEligibleForCleanup: number;
	retentionCutoffDate: Date | null;
	lastCleanupDate: Date | null;
	retentionMonths: number;
}> {
	// Get window configuration
	const windowConfig =
		await drizzleClient.query.eventGenerationWindowsTable.findFirst({
			where: eq(eventGenerationWindowsTable.organizationId, organizationId),
		});

	if (!windowConfig) {
		return {
			totalInstances: 0,
			instancesEligibleForCleanup: 0,
			retentionCutoffDate: null,
			lastCleanupDate: null,
			retentionMonths: 0,
		};
	}

	// Count total instances
	const totalInstances =
		await drizzleClient.query.recurringEventInstancesTable.findMany({
			where: eq(recurringEventInstancesTable.organizationId, organizationId),
			columns: { id: true },
		});

	// Calculate retention cutoff date
	const now = new Date();
	const retentionCutoffDate = new Date(now);
	retentionCutoffDate.setMonth(
		retentionCutoffDate.getMonth() - windowConfig.historyRetentionMonths,
	);

	// Count instances eligible for cleanup
	const instancesEligibleForCleanup =
		await drizzleClient.query.recurringEventInstancesTable.findMany({
			where: and(
				eq(recurringEventInstancesTable.organizationId, organizationId),
				lt(recurringEventInstancesTable.actualEndTime, retentionCutoffDate),
			),
			columns: { id: true },
		});

	return {
		totalInstances: totalInstances.length,
		instancesEligibleForCleanup: instancesEligibleForCleanup.length,
		retentionCutoffDate,
		lastCleanupDate: windowConfig.retentionStartDate,
		retentionMonths: windowConfig.historyRetentionMonths,
	};
}

/**
 * Performs an emergency cleanup of all materialized instances older than a specified
 * cutoff date, across all organizations. This method should be used with caution as it
 * bypasses individual retention settings.
 *
 * @param cutoffDate - The date before which all instances will be deleted.
 * @returns - A promise that resolves to an object with the number of deleted instances
 *          and the number of affected organizations.
 */
export async function emergencyCleanupBefore(
	cutoffDate: Date,
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<{
	instancesDeleted: number;
	organizationsAffected: number;
}> {
	logger.warn(
		`EMERGENCY CLEANUP: Deleting ALL instances before ${cutoffDate.toISOString()}`,
	);

	// Get affected organizations (for reporting)
	const affectedOrganizations =
		await drizzleClient.query.recurringEventInstancesTable.findMany({
			where: lt(recurringEventInstancesTable.actualEndTime, cutoffDate),
			columns: { organizationId: true },
		});

	const uniqueOrganizations = new Set(
		affectedOrganizations.map((instance) => instance.organizationId),
	);

	// Delete old instances
	const result = await drizzleClient
		.delete(recurringEventInstancesTable)
		.where(lt(recurringEventInstancesTable.actualEndTime, cutoffDate));

	const deletedCount = result.rowCount || 0;

	logger.warn(
		`EMERGENCY CLEANUP COMPLETED: Deleted ${deletedCount} instances ` +
			`across ${uniqueOrganizations.size} organizations`,
	);

	return {
		instancesDeleted: deletedCount,
		organizationsAffected: uniqueOrganizations.size,
	};
}

/**
 * Retrieves global statistics about the cleanup process across all organizations,
 * including total instance counts and eligibility for cleanup.
 *
 * @returns - A promise that resolves to an object with the global cleanup statistics.
 */
export async function getGlobalCleanupStatistics(
	drizzleClient: NodePgDatabase<typeof schema>,
): Promise<{
	totalOrganizations: number;
	totalInstances: number;
	totalInstancesEligibleForCleanup: number;
	oldestInstanceDate: Date | null;
	newestInstanceDate: Date | null;
	averageInstancesPerOrganization: number;
}> {
	// Get all organizations with windows
	const organizations =
		await drizzleClient.query.eventGenerationWindowsTable.findMany({
			columns: { organizationId: true, historyRetentionMonths: true },
		});

	// Get all instances
	const allInstances =
		await drizzleClient.query.recurringEventInstancesTable.findMany({
			columns: {
				organizationId: true,
				actualEndTime: true,
				generatedAt: true,
			},
		});

	// Calculate statistics
	const totalOrganizations = organizations.length;
	const totalInstances = allInstances.length;

	// Find oldest and newest instance dates
	const instanceDates = allInstances.map((instance) => instance.actualEndTime);
	const oldestInstanceDate =
		instanceDates.length > 0
			? new Date(Math.min(...instanceDates.map((d) => d.getTime())))
			: null;
	const newestInstanceDate =
		instanceDates.length > 0
			? new Date(Math.max(...instanceDates.map((d) => d.getTime())))
			: null;

	// Count instances eligible for cleanup
	const now = new Date();
	let totalInstancesEligibleForCleanup = 0;

	for (const org of organizations) {
		const retentionCutoffDate = new Date(now);
		retentionCutoffDate.setMonth(
			retentionCutoffDate.getMonth() - org.historyRetentionMonths,
		);

		const orgEligibleInstances = allInstances.filter(
			(instance) =>
				instance.organizationId === org.organizationId &&
				instance.actualEndTime < retentionCutoffDate,
		);

		totalInstancesEligibleForCleanup += orgEligibleInstances.length;
	}

	const averageInstancesPerOrganization =
		totalOrganizations > 0
			? Math.round(totalInstances / totalOrganizations)
			: 0;

	return {
		totalOrganizations,
		totalInstances,
		totalInstancesEligibleForCleanup,
		oldestInstanceDate,
		newestInstanceDate,
		averageInstancesPerOrganization,
	};
}
