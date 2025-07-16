import { and, eq, lt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type * as schema from "~/src/drizzle/schema";
import { eventMaterializationWindowsTable } from "~/src/drizzle/tables/eventMaterializationWindows";
import { materializedEventInstancesTable } from "~/src/drizzle/tables/materializedEventInstances";

/**
 * Worker responsible for cleaning up old materialized event instances.
 *
 * This worker:
 * - Removes materialized instances beyond the retention window
 * - Prevents database bloat from accumulating old instances
 * - Respects per-organization retention settings
 * - Provides cleanup statistics for monitoring
 */
export class EventCleanupWorker {
	constructor(
		private readonly drizzleClient: NodePgDatabase<typeof schema>,
		private readonly logger: FastifyBaseLogger,
	) {}

	/**
	 * Main cleanup method - processes all organizations' retention policies.
	 */
	async cleanupOldInstances(): Promise<{
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
				await this.drizzleClient.query.eventMaterializationWindowsTable.findMany(
					{
						where: eq(eventMaterializationWindowsTable.isEnabled, true),
						orderBy: [eventMaterializationWindowsTable.organizationId],
					},
				);

			this.logger.info(
				`Found ${organizationWindows.length} organizations for cleanup processing`,
			);

			// Process each organization individually
			for (const windowConfig of organizationWindows) {
				try {
					const deletedCount =
						await this.cleanupOrganizationInstances(windowConfig);

					stats.organizationsProcessed++;
					stats.instancesDeleted += deletedCount;
				} catch (error) {
					stats.errorsEncountered++;
					this.logger.error(
						`Failed to cleanup instances for organization ${windowConfig.organizationId}:`,
						error,
					);
					// Continue processing other organizations
				}
			}

			return stats;
		} catch (error) {
			this.logger.error("Failed to process instance cleanup:", error);
			throw error;
		}
	}

	/**
	 * Cleans up old instances for a specific organization.
	 */
	private async cleanupOrganizationInstances(
		windowConfig: typeof eventMaterializationWindowsTable.$inferSelect,
	): Promise<number> {
		const { organizationId, historyRetentionMonths } = windowConfig;

		// Calculate retention cutoff date
		const now = new Date();
		const retentionCutoffDate = new Date(now);
		retentionCutoffDate.setMonth(
			retentionCutoffDate.getMonth() - historyRetentionMonths,
		);

		this.logger.info(
			`Cleaning up instances for organization ${organizationId} ` +
				`older than ${retentionCutoffDate.toISOString()}`,
		);

		// Count instances that will be deleted (for logging)
		const instancesToDelete =
			await this.drizzleClient.query.materializedEventInstancesTable.findMany({
				where: and(
					eq(materializedEventInstancesTable.organizationId, organizationId),
					lt(
						materializedEventInstancesTable.actualEndTime,
						retentionCutoffDate,
					),
				),
				columns: { id: true },
			});

		if (instancesToDelete.length === 0) {
			this.logger.debug(
				`No old instances to cleanup for organization ${organizationId}`,
			);
			return 0;
		}

		// Delete old instances
		const result = await this.drizzleClient
			.delete(materializedEventInstancesTable)
			.where(
				and(
					eq(materializedEventInstancesTable.organizationId, organizationId),
					lt(
						materializedEventInstancesTable.actualEndTime,
						retentionCutoffDate,
					),
				),
			);

		const deletedCount = result.rowCount || 0;

		this.logger.info(
			`Cleaned up ${deletedCount} old instances for organization ${organizationId}`,
		);

		// Update retention start date in window config
		await this.updateRetentionStartDate(windowConfig.id, retentionCutoffDate);

		return deletedCount;
	}

	/**
	 * Updates the retention start date in the window configuration.
	 */
	private async updateRetentionStartDate(
		windowId: string,
		newRetentionStartDate: Date,
	): Promise<void> {
		await this.drizzleClient
			.update(eventMaterializationWindowsTable)
			.set({
				retentionStartDate: newRetentionStartDate,
			})
			.where(eq(eventMaterializationWindowsTable.id, windowId));

		this.logger.debug(`Updated retention start date for window ${windowId}`);
	}

	/**
	 * Manually cleans up instances for a specific organization.
	 */
	async cleanupSpecificOrganization(organizationId: string): Promise<{
		instancesDeleted: number;
		retentionCutoffDate: Date;
	}> {
		this.logger.info(
			`Manually cleaning up instances for organization ${organizationId}`,
		);

		// Get window configuration for this organization
		const windowConfig =
			await this.drizzleClient.query.eventMaterializationWindowsTable.findFirst(
				{
					where: eq(
						eventMaterializationWindowsTable.organizationId,
						organizationId,
					),
				},
			);

		if (!windowConfig) {
			throw new Error(
				`No materialization window found for organization ${organizationId}`,
			);
		}

		const instancesDeleted =
			await this.cleanupOrganizationInstances(windowConfig);

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
	 * Gets cleanup status for an organization.
	 */
	async getOrganizationCleanupStatus(organizationId: string): Promise<{
		totalInstances: number;
		instancesEligibleForCleanup: number;
		retentionCutoffDate: Date | null;
		lastCleanupDate: Date | null;
		retentionMonths: number;
	}> {
		// Get window configuration
		const windowConfig =
			await this.drizzleClient.query.eventMaterializationWindowsTable.findFirst(
				{
					where: eq(
						eventMaterializationWindowsTable.organizationId,
						organizationId,
					),
				},
			);

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
			await this.drizzleClient.query.materializedEventInstancesTable.findMany({
				where: eq(
					materializedEventInstancesTable.organizationId,
					organizationId,
				),
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
			await this.drizzleClient.query.materializedEventInstancesTable.findMany({
				where: and(
					eq(materializedEventInstancesTable.organizationId, organizationId),
					lt(
						materializedEventInstancesTable.actualEndTime,
						retentionCutoffDate,
					),
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
	 * Emergency cleanup method that removes ALL instances older than a specific date.
	 * Use with caution - this ignores per-organization retention settings.
	 */
	async emergencyCleanupBefore(cutoffDate: Date): Promise<{
		instancesDeleted: number;
		organizationsAffected: number;
	}> {
		this.logger.warn(
			`EMERGENCY CLEANUP: Deleting ALL instances before ${cutoffDate.toISOString()}`,
		);

		// Get affected organizations (for reporting)
		const affectedOrganizations =
			await this.drizzleClient.query.materializedEventInstancesTable.findMany({
				where: lt(materializedEventInstancesTable.actualEndTime, cutoffDate),
				columns: { organizationId: true },
			});

		const uniqueOrganizations = new Set(
			affectedOrganizations.map((instance) => instance.organizationId),
		);

		// Delete old instances
		const result = await this.drizzleClient
			.delete(materializedEventInstancesTable)
			.where(lt(materializedEventInstancesTable.actualEndTime, cutoffDate));

		const deletedCount = result.rowCount || 0;

		this.logger.warn(
			`EMERGENCY CLEANUP COMPLETED: Deleted ${deletedCount} instances ` +
				`across ${uniqueOrganizations.size} organizations`,
		);

		return {
			instancesDeleted: deletedCount,
			organizationsAffected: uniqueOrganizations.size,
		};
	}

	/**
	 * Gets overall cleanup statistics across all organizations.
	 */
	async getGlobalCleanupStatistics(): Promise<{
		totalOrganizations: number;
		totalInstances: number;
		totalInstancesEligibleForCleanup: number;
		oldestInstanceDate: Date | null;
		newestInstanceDate: Date | null;
		averageInstancesPerOrganization: number;
	}> {
		// Get all organizations with windows
		const organizations =
			await this.drizzleClient.query.eventMaterializationWindowsTable.findMany({
				columns: { organizationId: true, historyRetentionMonths: true },
			});

		// Get all instances
		const allInstances =
			await this.drizzleClient.query.materializedEventInstancesTable.findMany({
				columns: {
					organizationId: true,
					actualEndTime: true,
					materializedAt: true,
				},
			});

		// Calculate statistics
		const totalOrganizations = organizations.length;
		const totalInstances = allInstances.length;

		// Find oldest and newest instance dates
		const instanceDates = allInstances.map(
			(instance) => instance.actualEndTime,
		);
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
}
