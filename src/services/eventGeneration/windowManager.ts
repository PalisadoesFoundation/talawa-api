import { and, eq, lt } from "drizzle-orm";
import type { CreateGenerationWindowInput } from "~/src/drizzle/tables/eventGenerationWindows";
import { eventGenerationWindowsTable } from "~/src/drizzle/tables/eventGenerationWindows";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import type { ServiceDependencies, WindowManagerConfig } from "./types";

/**
 * Initializes the Generation window for a given organization, setting up the time frame
 * for which event instances will be generated and retained.
 *
 * @param input - The input object containing the organization ID.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to the newly created Generation window configuration.
 */
export async function initializeGenerationWindow(
	input: CreateGenerationWindowInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<typeof eventGenerationWindowsTable.$inferSelect> {
	try {
		const windowConfig = buildWindowConfiguration(input);

		// Attempt idempotent insert: if a window config already exists for this organization,
		// onConflictDoNothing will silently skip the insert and return an empty array.
		const [insertedConfig] = await drizzleClient
			.insert(eventGenerationWindowsTable)
			.values(windowConfig)
			.onConflictDoNothing({
				target: eventGenerationWindowsTable.organizationId,
			})
			.returning();

		// If insert was skipped due to conflict, fetch the existing config
		if (!insertedConfig) {
			const existingConfig =
				await drizzleClient.query.eventGenerationWindowsTable.findFirst({
					where: eq(
						eventGenerationWindowsTable.organizationId,
						input.organizationId,
					),
				});

			if (!existingConfig) {
				logger.error(
					`Failed to insert and return Generation window for organization ${input.organizationId}`,
				);
				throw new Error("Failed to initialize Generation window.");
			}

			logger.info(
				{
					hotWindowMonthsAhead: existingConfig.hotWindowMonthsAhead,
					historyRetentionMonths: existingConfig.historyRetentionMonths,
					currentWindowEndDate:
						existingConfig.currentWindowEndDate.toISOString(),
					retentionStartDate: existingConfig.retentionStartDate.toISOString(),
				},
				`Using existing Generation window for organization ${input.organizationId}`,
			);

			return existingConfig;
		}

		logger.info(
			{
				hotWindowMonthsAhead: insertedConfig.hotWindowMonthsAhead,
				historyRetentionMonths: insertedConfig.historyRetentionMonths,
				currentWindowEndDate: insertedConfig.currentWindowEndDate.toISOString(),
				retentionStartDate: insertedConfig.retentionStartDate.toISOString(),
			},
			`Generation window initialized for organization ${input.organizationId}`,
		);

		return insertedConfig;
	} catch (error) {
		logger.error(
			{ error },
			`Failed to initialize Generation window for organization ${input.organizationId}:`,
		);
		throw error;
	}
}

/**
 * Builds the complete window configuration object, applying fixed global defaults for
 * the Generation window and retention period.
 *
 * @param input - The initial input containing the organization ID.
 * @returns - A complete window configuration object with all required properties.
 */
function buildWindowConfiguration(
	input: CreateGenerationWindowInput,
): CreateGenerationWindowInput & {
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
 * Extends the Generation window for an organization by a specified number of months,
 * allowing for the generation of future event instances.
 *
 * @param organizationId - The ID of the organization whose window is to be extended.
 * @param additionalMonths - The number of months to extend the window by.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to the new end date of the Generation window.
 */
export async function extendGenerationWindow(
	organizationId: string,
	additionalMonths: number,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<Date> {
	try {
		const windowConfig =
			await drizzleClient.query.eventGenerationWindowsTable.findFirst({
				where: eq(eventGenerationWindowsTable.organizationId, organizationId),
			});

		if (!windowConfig) {
			throw new Error(
				`No Generation window found for organization ${organizationId}`,
			);
		}

		const newEndDate = new Date(windowConfig.currentWindowEndDate);
		newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

		await drizzleClient
			.update(eventGenerationWindowsTable)
			.set({
				currentWindowEndDate: newEndDate,
				hotWindowMonthsAhead:
					windowConfig.hotWindowMonthsAhead + additionalMonths,
			})
			.where(eq(eventGenerationWindowsTable.organizationId, organizationId));

		logger.info(
			{
				previousEndDate: windowConfig.currentWindowEndDate.toISOString(),
				newEndDate: newEndDate.toISOString(),
			},
			`Extended Generation window for organization ${organizationId} by ${additionalMonths} months`,
		);

		return newEndDate;
	} catch (error) {
		logger.error(
			{ error },
			`Failed to extend Generation window for organization ${organizationId}:`,
		);
		throw error;
	}
}

/**
 * Deletes old Generated instances that fall outside the defined retention window
 * for a given organization.
 *
 * @param organizationId - The ID of the organization for which to clean up instances.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to the number of deleted instances.
 */
export async function cleanupOldGeneratedInstances(
	organizationId: string,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<number> {
	try {
		const windowConfig =
			await drizzleClient.query.eventGenerationWindowsTable.findFirst({
				where: eq(eventGenerationWindowsTable.organizationId, organizationId),
			});

		if (!windowConfig) {
			logger.warn(
				`No Generation window found for organization ${organizationId}`,
			);
			return 0;
		}

		const result = await drizzleClient
			.delete(recurringEventInstancesTable)
			.where(
				and(
					eq(recurringEventInstancesTable.organizationId, organizationId),
					lt(
						recurringEventInstancesTable.actualEndTime,
						windowConfig.retentionStartDate,
					),
				),
			);

		const deletedCount = result.rowCount || 0;

		logger.info(
			{
				retentionStartDate: windowConfig.retentionStartDate.toISOString(),
				deletedCount,
			},
			`Cleaned up ${deletedCount} old Generated instances for organization ${organizationId}`,
		);

		return deletedCount;
	} catch (error) {
		logger.error(
			error,
			`Failed to cleanup old Generated instances for organization ${organizationId}:`,
		);
		throw error;
	}
}

/**
 * Retrieves cleanup statistics for an organization, including the total number of instances,
 * the number of instances within the retention window, and the number eligible for cleanup.
 *
 * @param organizationId - The ID of the organization to get stats for.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @returns - A promise that resolves to an object containing the cleanup statistics.
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
		await drizzleClient.query.eventGenerationWindowsTable.findFirst({
			where: eq(eventGenerationWindowsTable.organizationId, organizationId),
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
		drizzleClient.query.recurringEventInstancesTable
			.findMany({
				where: eq(recurringEventInstancesTable.organizationId, organizationId),
				columns: { id: true },
			})
			.then((result: { id: string }[]) => result.length),

		// Instances eligible for cleanup
		drizzleClient.query.recurringEventInstancesTable
			.findMany({
				where: and(
					eq(recurringEventInstancesTable.organizationId, organizationId),
					lt(
						recurringEventInstancesTable.actualEndTime,
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
 * Validates the configuration of a window manager to ensure all properties are within
 * acceptable ranges and formats.
 *
 * @param config - The window manager configuration object to validate.
 * @returns `true` if the configuration is valid, otherwise `false`.
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
