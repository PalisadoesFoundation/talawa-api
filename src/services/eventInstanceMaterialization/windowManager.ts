import { and, eq, lt } from "drizzle-orm";
import type { CreateMaterializationWindowInput } from "~/src/drizzle/tables/eventMaterializationWindows";
import { eventMaterializationWindowsTable } from "~/src/drizzle/tables/eventMaterializationWindows";
import { materializedEventInstancesTable } from "~/src/drizzle/tables/materializedEventInstances";
import type { ServiceDependencies, WindowManagerConfig } from "./types";

/**
 * Initializes materialization window for an organization.
 * Uses 12-month default for never-ending events.
 */
export async function initializeMaterializationWindow(
	input: CreateMaterializationWindowInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<typeof eventMaterializationWindowsTable.$inferSelect> {
	try {
		const windowConfig = buildWindowConfiguration(input);

		const [insertedConfig] = await drizzleClient
			.insert(eventMaterializationWindowsTable)
			.values(windowConfig)
			.returning();

		if (!insertedConfig) {
			logger.error(
				`Failed to insert and return materialization window for organization ${input.organizationId}`,
			);
			throw new Error("Failed to initialize materialization window.");
		}

		logger.info(
			`Materialization window initialized for organization ${input.organizationId}`,
			{
				hotWindowMonthsAhead: insertedConfig.hotWindowMonthsAhead,
				historyRetentionMonths: insertedConfig.historyRetentionMonths,
				currentWindowEndDate: insertedConfig.currentWindowEndDate.toISOString(),
				retentionStartDate: insertedConfig.retentionStartDate.toISOString(),
			},
		);

		return insertedConfig;
	} catch (error) {
		logger.error(
			`Failed to initialize materialization window for organization ${input.organizationId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Builds window configuration with proper defaults and calculated dates
 */
function buildWindowConfiguration(
	input: CreateMaterializationWindowInput,
): CreateMaterializationWindowInput & {
	currentWindowEndDate: Date;
	retentionStartDate: Date;
} {
	const now = new Date();
	// Fixed global settings - not configurable per organization
	const monthsAhead = 12; // Fixed 12 months for all organizations
	const retentionMonths = 3; // Fixed 3 months retention

	const currentWindowEndDate = new Date(now);
	currentWindowEndDate.setMonth(currentWindowEndDate.getMonth() + monthsAhead);

	const retentionStartDate = new Date(now);
	retentionStartDate.setMonth(retentionStartDate.getMonth() - retentionMonths);

	return {
		...input,
		hotWindowMonthsAhead: monthsAhead,
		historyRetentionMonths: retentionMonths,
		currentWindowEndDate,
		retentionStartDate,
		processingPriority: 5, // Fixed priority
		maxInstancesPerRun: 1000, // Fixed limit
	};
}

/**
 * Extends materialization window forward by specified months
 */
export async function extendMaterializationWindow(
	organizationId: string,
	additionalMonths: number,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<Date> {
	try {
		const windowConfig =
			await drizzleClient.query.eventMaterializationWindowsTable.findFirst({
				where: eq(
					eventMaterializationWindowsTable.organizationId,
					organizationId,
				),
			});

		if (!windowConfig) {
			throw new Error(
				`No materialization window found for organization ${organizationId}`,
			);
		}

		const newEndDate = new Date(windowConfig.currentWindowEndDate);
		newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

		await drizzleClient
			.update(eventMaterializationWindowsTable)
			.set({
				currentWindowEndDate: newEndDate,
				hotWindowMonthsAhead:
					windowConfig.hotWindowMonthsAhead + additionalMonths,
			})
			.where(
				eq(eventMaterializationWindowsTable.organizationId, organizationId),
			);

		logger.info(
			`Extended materialization window for organization ${organizationId} by ${additionalMonths} months`,
			{
				previousEndDate: windowConfig.currentWindowEndDate.toISOString(),
				newEndDate: newEndDate.toISOString(),
			},
		);

		return newEndDate;
	} catch (error) {
		logger.error(
			`Failed to extend materialization window for organization ${organizationId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Cleans up old materialized instances beyond the retention window.
 */
export async function cleanupOldMaterializedInstances(
	organizationId: string,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<number> {
	try {
		const windowConfig =
			await drizzleClient.query.eventMaterializationWindowsTable.findFirst({
				where: eq(
					eventMaterializationWindowsTable.organizationId,
					organizationId,
				),
			});

		if (!windowConfig) {
			logger.warn(
				`No materialization window found for organization ${organizationId}`,
			);
			return 0;
		}

		const result = await drizzleClient
			.delete(materializedEventInstancesTable)
			.where(
				and(
					eq(materializedEventInstancesTable.organizationId, organizationId),
					lt(
						materializedEventInstancesTable.actualEndTime,
						windowConfig.retentionStartDate,
					),
				),
			);

		const deletedCount = result.rowCount || 0;

		logger.info(
			`Cleaned up ${deletedCount} old materialized instances for organization ${organizationId}`,
			{
				retentionStartDate: windowConfig.retentionStartDate.toISOString(),
				deletedCount,
			},
		);

		return deletedCount;
	} catch (error) {
		logger.error(
			`Failed to cleanup old materialized instances for organization ${organizationId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Gets cleanup statistics for an organization
 */
export async function getCleanupStats(
	organizationId: string,
	drizzleClient: ServiceDependencies["drizzleClient"],
): Promise<{
	totalInstances: number;
	instancesInRetentionWindow: number;
	instancesEligibleForCleanup: number;
	retentionStartDate: Date | null;
}> {
	const windowConfig =
		await drizzleClient.query.eventMaterializationWindowsTable.findFirst({
			where: eq(
				eventMaterializationWindowsTable.organizationId,
				organizationId,
			),
		});

	if (!windowConfig) {
		return {
			totalInstances: 0,
			instancesInRetentionWindow: 0,
			instancesEligibleForCleanup: 0,
			retentionStartDate: null,
		};
	}

	const [totalInstances, instancesEligibleForCleanup] = await Promise.all([
		// Total instances
		drizzleClient.query.materializedEventInstancesTable
			.findMany({
				where: eq(
					materializedEventInstancesTable.organizationId,
					organizationId,
				),
				columns: { id: true },
			})
			.then((result: { id: string }[]) => result.length),

		// Instances eligible for cleanup
		drizzleClient.query.materializedEventInstancesTable
			.findMany({
				where: and(
					eq(materializedEventInstancesTable.organizationId, organizationId),
					lt(
						materializedEventInstancesTable.actualEndTime,
						windowConfig.retentionStartDate,
					),
				),
				columns: { id: true },
			})
			.then((result: { id: string }[]) => result.length),
	]);

	return {
		totalInstances,
		instancesInRetentionWindow: totalInstances - instancesEligibleForCleanup,
		instancesEligibleForCleanup,
		retentionStartDate: windowConfig.retentionStartDate,
	};
}

/**
 * Validates window configuration
 */
export function validateWindowConfig(config: WindowManagerConfig): boolean {
	if (!config.organizationId) {
		return false;
	}

	if (config.hotWindowMonthsAhead && config.hotWindowMonthsAhead < 1) {
		return false;
	}

	if (config.historyRetentionMonths && config.historyRetentionMonths < 0) {
		return false;
	}

	if (
		config.processingPriority &&
		(config.processingPriority < 1 || config.processingPriority > 10)
	) {
		return false;
	}

	if (config.maxInstancesPerRun && config.maxInstancesPerRun < 1) {
		return false;
	}

	return true;
}

// Removed adaptive window sizing - using fixed global settings
