import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import {
	cleanupOldInstances,
	cleanupSpecificOrganization,
	emergencyCleanupBefore,
	getGlobalCleanupStatistics,
	getOrganizationCleanupStatus,
} from "~/src/workers/eventCleanupWorker";

// Mock drizzle-orm
vi.mock("drizzle-orm", async () => {
	const actual = await vi.importActual("drizzle-orm");
	return {
		...actual,
		and: vi.fn(),
		eq: vi.fn(),
		lt: vi.fn(),
	};
});

describe("eventCleanupWorker", () => {
	let mockDrizzleClient: NodePgDatabase<typeof schema>;
	let mockLogger: FastifyBaseLogger;

	// Helper function to create complete mock window config
	const createMockWindowConfig = (overrides = {}) => ({
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		id: "window1",
		organizationId: "org1",
		hotWindowMonthsAhead: 12,
		historyRetentionMonths: 6,
		currentWindowEndDate: new Date("2024-12-31"),
		retentionStartDate: new Date("2024-01-01"),
		processingPriority: 5,
		isEnabled: true,
		lastProcessedAt: new Date("2024-01-01"),
		lastProcessedInstanceCount: 0,
		maxInstancesPerRun: 1000,
		configurationNotes: null,
		lastUpdatedById: null,
		createdById: "user1",
		...overrides,
	});

	// Helper function to create complete mock materialized instance
	const createMockMaterializedInstance = (overrides = {}) => ({
		id: "instance1",
		organizationId: "org1",
		baseRecurringEventId: "event1",
		originalSeriesId: "event1",
		recurrenceRuleId: "rule1",
		originalInstanceStartTime: new Date("2024-01-01"),
		actualStartTime: new Date("2024-01-01"),
		actualEndTime: new Date("2024-01-02"),
		isCancelled: false,
		generatedAt: new Date("2024-01-01"),
		lastUpdatedAt: null,
		version: "1",
		sequenceNumber: 1,
		totalCount: null,
		...overrides,
	});

	beforeEach(() => {
		vi.clearAllMocks();

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		mockDrizzleClient = {
			query: {
				eventGenerationWindowsTable: {
					findMany: vi.fn(),
					findFirst: vi.fn(),
				},
				recurringEventInstancesTable: {
					findMany: vi.fn(),
				},
			},
			delete: vi.fn(() => ({
				where: vi.fn(() => ({
					rowCount: 5,
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(),
				})),
			})),
		} as unknown as NodePgDatabase<typeof schema>;
	});

	describe("cleanupOldInstances", () => {
		it("should cleanup old instances successfully", async () => {
			const mockWindowConfigs = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					historyRetentionMonths: 6,
					isEnabled: true,
				}),
				createMockWindowConfig({
					id: "window2",
					organizationId: "org2",
					historyRetentionMonths: 3,
					isEnabled: true,
				}),
			];

			const mockInstances = [
				createMockMaterializedInstance({ id: "instance1" }),
				createMockMaterializedInstance({ id: "instance2" }),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockWindowConfigs);
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue(mockInstances);

			const result = await cleanupOldInstances(mockDrizzleClient, mockLogger);

			expect(result).toEqual({
				organizationsProcessed: 2,
				instancesDeleted: 10, // 5 per organization
				errorsEncountered: 0,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Found 2 organizations for cleanup processing",
			);
		});

		it("should handle errors for individual organizations", async () => {
			const mockWindowConfigs = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					historyRetentionMonths: 6,
					isEnabled: true,
				}),
				createMockWindowConfig({
					id: "window2",
					organizationId: "org2",
					historyRetentionMonths: 3,
					isEnabled: true,
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockWindowConfigs);
			vi.mocked(mockDrizzleClient.query.recurringEventInstancesTable.findMany)
				.mockResolvedValueOnce([
					createMockMaterializedInstance({ id: "instance1" }),
				])
				.mockRejectedValueOnce(new Error("Database error"));

			const result = await cleanupOldInstances(mockDrizzleClient, mockLogger);

			expect(result).toEqual({
				organizationsProcessed: 1,
				instancesDeleted: 5,
				errorsEncountered: 1,
			});
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Failed to cleanup instances for organization org2:",
				expect.any(Error),
			);
		});

		it("should handle no organizations", async () => {
			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue([]);

			const result = await cleanupOldInstances(mockDrizzleClient, mockLogger);

			expect(result).toEqual({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Found 0 organizations for cleanup processing",
			);
		});

		it("should handle database errors", async () => {
			const error = new Error("Database connection failed");
			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockRejectedValue(error);

			await expect(
				cleanupOldInstances(mockDrizzleClient, mockLogger),
			).rejects.toThrow("Database connection failed");
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Failed to process instance cleanup:",
				error,
			);
		});
	});

	describe("cleanupSpecificOrganization", () => {
		it("should cleanup specific organization successfully", async () => {
			const mockWindowConfig = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				historyRetentionMonths: 6,
				isEnabled: true,
			});

			const mockInstances = [
				createMockMaterializedInstance({ id: "instance1" }),
				createMockMaterializedInstance({ id: "instance2" }),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(mockWindowConfig);
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue(mockInstances);

			const result = await cleanupSpecificOrganization(
				"org1",
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				instancesDeleted: 5,
				retentionCutoffDate: expect.any(Date),
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manually cleaning up instances for organization org1",
			);
		});

		it("should throw error if organization not found", async () => {
			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(undefined);

			await expect(
				cleanupSpecificOrganization("org1", mockDrizzleClient, mockLogger),
			).rejects.toThrow(
				"No materialization window found for organization org1",
			);
		});
	});

	describe("getOrganizationCleanupStatus", () => {
		it("should return cleanup status for organization", async () => {
			const mockWindowConfig = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				historyRetentionMonths: 6,
				isEnabled: true,
				retentionStartDate: new Date("2024-01-01"),
			});

			const mockTotalInstances = [
				createMockMaterializedInstance({ id: "instance1" }),
				createMockMaterializedInstance({ id: "instance2" }),
				createMockMaterializedInstance({ id: "instance3" }),
			];

			const mockEligibleInstances = [
				createMockMaterializedInstance({ id: "instance1" }),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(mockWindowConfig);
			vi.mocked(mockDrizzleClient.query.recurringEventInstancesTable.findMany)
				.mockResolvedValueOnce(mockTotalInstances)
				.mockResolvedValueOnce(mockEligibleInstances);

			const result = await getOrganizationCleanupStatus(
				"org1",
				mockDrizzleClient,
			);

			expect(result).toEqual({
				totalInstances: 3,
				instancesEligibleForCleanup: 1,
				retentionCutoffDate: expect.any(Date),
				lastCleanupDate: new Date("2024-01-01"),
				retentionMonths: 6,
			});
		});

		it("should return empty status if organization not found", async () => {
			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(undefined);

			const result = await getOrganizationCleanupStatus(
				"org1",
				mockDrizzleClient,
			);

			expect(result).toEqual({
				totalInstances: 0,
				instancesEligibleForCleanup: 0,
				retentionCutoffDate: null,
				lastCleanupDate: null,
				retentionMonths: 0,
			});
		});
	});

	describe("emergencyCleanupBefore", () => {
		it("should perform emergency cleanup successfully", async () => {
			const cutoffDate = new Date("2024-01-01");
			const mockInstances = [
				createMockMaterializedInstance({
					id: "instance1",
					organizationId: "org1",
				}),
				createMockMaterializedInstance({
					id: "instance2",
					organizationId: "org1",
				}),
				createMockMaterializedInstance({
					id: "instance3",
					organizationId: "org2",
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue(mockInstances);

			const result = await emergencyCleanupBefore(
				cutoffDate,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				instancesDeleted: 5,
				organizationsAffected: 2,
			});
			expect(mockLogger.warn).toHaveBeenCalledWith(
				`EMERGENCY CLEANUP: Deleting ALL instances before ${cutoffDate.toISOString()}`,
			);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"EMERGENCY CLEANUP COMPLETED: Deleted 5 instances across 2 organizations",
			);
		});

		it("should handle no instances to cleanup", async () => {
			const cutoffDate = new Date("2024-01-01");
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue([]);

			const result = await emergencyCleanupBefore(
				cutoffDate,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				instancesDeleted: 5,
				organizationsAffected: 0,
			});
		});
	});

	describe("getGlobalCleanupStatistics", () => {
		it("should return global cleanup statistics", async () => {
			const mockOrganizations = [
				createMockWindowConfig({
					organizationId: "org1",
					historyRetentionMonths: 6,
				}),
				createMockWindowConfig({
					organizationId: "org2",
					historyRetentionMonths: 3,
				}),
			];

			const mockInstances = [
				createMockMaterializedInstance({
					id: "instance1",
					organizationId: "org1",
					actualEndTime: new Date("2024-01-01"),
					generatedAt: new Date("2024-01-01"),
				}),
				createMockMaterializedInstance({
					id: "instance2",
					organizationId: "org1",
					actualEndTime: new Date("2024-06-01"),
					generatedAt: new Date("2024-06-01"),
				}),
				createMockMaterializedInstance({
					id: "instance3",
					organizationId: "org2",
					actualEndTime: new Date("2024-03-01"),
					generatedAt: new Date("2024-03-01"),
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockOrganizations);
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue(mockInstances);

			const result = await getGlobalCleanupStatistics(mockDrizzleClient);

			expect(result).toEqual({
				totalOrganizations: 2,
				totalInstances: 3,
				totalInstancesEligibleForCleanup: expect.any(Number),
				oldestInstanceDate: new Date("2024-01-01"),
				newestInstanceDate: new Date("2024-06-01"),
				averageInstancesPerOrganization: 2,
			});
		});

		it("should handle no organizations", async () => {
			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue([]);
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue([]);

			const result = await getGlobalCleanupStatistics(mockDrizzleClient);

			expect(result).toEqual({
				totalOrganizations: 0,
				totalInstances: 0,
				totalInstancesEligibleForCleanup: 0,
				oldestInstanceDate: null,
				newestInstanceDate: null,
				averageInstancesPerOrganization: 0,
			});
		});

		it("should handle no instances", async () => {
			const mockOrganizations = [
				createMockWindowConfig({
					organizationId: "org1",
					historyRetentionMonths: 6,
				}),
				createMockWindowConfig({
					organizationId: "org2",
					historyRetentionMonths: 3,
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockOrganizations);
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue([]);

			const result = await getGlobalCleanupStatistics(mockDrizzleClient);

			expect(result).toEqual({
				totalOrganizations: 2,
				totalInstances: 0,
				totalInstancesEligibleForCleanup: 0,
				oldestInstanceDate: null,
				newestInstanceDate: null,
				averageInstancesPerOrganization: 0,
			});
		});
	});
});
