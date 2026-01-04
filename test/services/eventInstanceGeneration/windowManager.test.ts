import { faker } from "@faker-js/faker";
import { and, eq, lt } from "drizzle-orm";
import { afterEach, expect, type Mock, suite, test, vi } from "vitest";
import type { CreateGenerationWindowInput } from "~/src/drizzle/tables/eventGenerationWindows";
import { eventGenerationWindowsTable } from "~/src/drizzle/tables/eventGenerationWindows";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import type {
	ServiceDependencies,
	WindowManagerConfig,
} from "~/src/services/eventGeneration/types";
import {
	cleanupOldGeneratedInstances,
	extendGenerationWindow,
	getCleanupStats,
	initializeGenerationWindow,
	validateWindowConfig,
} from "~/src/services/eventGeneration/windowManager";

afterEach(() => {
	vi.clearAllMocks();
});

suite("windowManager", () => {
	const mockLogger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	} as unknown as ServiceDependencies["logger"];

	const mockDrizzleClient = {
		query: {
			eventGenerationWindowsTable: {
				findFirst: vi.fn(),
			},
			recurringEventInstancesTable: {
				findMany: vi.fn(),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(),
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn(),
		})),
	} as unknown as ServiceDependencies["drizzleClient"];

	const mockOrganizationId = faker.string.uuid();
	const mockUserId = faker.string.uuid();

	suite("initializeGenerationWindow", () => {
		test("successfully initializes Generation window", async () => {
			const input: CreateGenerationWindowInput = {
				organizationId: mockOrganizationId,
				createdById: mockUserId,
			};

			const mockInsertedConfig = {
				id: faker.string.uuid(),
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				currentWindowEndDate: new Date("2026-01-01T00:00:00Z"),
				retentionStartDate: new Date("2024-10-01T00:00:00Z"),
				processingPriority: 5,
				maxInstancesPerRun: 1000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockInsertChain = {
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockInsertedConfig]),
				})),
			};

			(mockDrizzleClient.insert as Mock).mockReturnValue(mockInsertChain);

			const result = await initializeGenerationWindow(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual(mockInsertedConfig);
			expect(mockDrizzleClient.insert).toHaveBeenCalledWith(
				eventGenerationWindowsTable,
			);
			expect(mockInsertChain.values).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: mockOrganizationId,
					hotWindowMonthsAhead: 12,
					historyRetentionMonths: 3,
					processingPriority: 5,
					maxInstancesPerRun: 1000,
				}),
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					hotWindowMonthsAhead: 12,
					historyRetentionMonths: 3,
				}),
				`Generation window initialized for organization ${mockOrganizationId}`,
			);
		});

		test("throws error when insertion fails", async () => {
			const input: CreateGenerationWindowInput = {
				organizationId: mockOrganizationId,
				createdById: mockUserId,
			};

			const mockInsertChain = {
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([]),
				})),
			};

			(mockDrizzleClient.insert as Mock).mockReturnValue(mockInsertChain);

			await expect(
				initializeGenerationWindow(input, mockDrizzleClient, mockLogger),
			).rejects.toThrow("Failed to initialize Generation window.");

			expect(mockLogger.error).toHaveBeenCalledWith(
				`Failed to insert and return Generation window for organization ${mockOrganizationId}`,
			);
		});

		test("handles database errors gracefully", async () => {
			(mockDrizzleClient.insert as Mock).mockReset();
			const input: CreateGenerationWindowInput = {
				organizationId: mockOrganizationId,
				createdById: mockUserId,
			};

			const dbError = new Error("Database connection failed");
			(mockDrizzleClient.insert as Mock).mockImplementation(() => {
				throw dbError;
			});

			await expect(
				initializeGenerationWindow(input, mockDrizzleClient, mockLogger),
			).rejects.toThrow("Database connection failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ error: dbError },
				`Failed to initialize Generation window for organization ${mockOrganizationId}:`,
			);
		});
	});

	suite("extendGenerationWindow", () => {
		test("successfully extends Generation window", async () => {
			const additionalMonths = 6;
			const mockExistingConfig = {
				id: faker.string.uuid(),
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				currentWindowEndDate: new Date("2026-01-01T00:00:00Z"),
				retentionStartDate: new Date("2024-10-01T00:00:00Z"),
				processingPriority: 5,
				maxInstancesPerRun: 1000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockUpdateChain = {
				set: vi.fn(() => ({
					where: vi.fn(),
				})),
			};

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(mockExistingConfig);
			(mockDrizzleClient.update as Mock).mockReturnValue(mockUpdateChain);

			const result = await extendGenerationWindow(
				mockOrganizationId,
				additionalMonths,
				mockDrizzleClient,
				mockLogger,
			);

			const expectedNewEndDate = new Date("2026-07-01T00:00:00Z");
			expect(result).toEqual(expectedNewEndDate);
			expect(mockDrizzleClient.update).toHaveBeenCalledWith(
				eventGenerationWindowsTable,
			);
			expect(mockUpdateChain.set).toHaveBeenCalledWith({
				currentWindowEndDate: expectedNewEndDate,
				hotWindowMonthsAhead:
					mockExistingConfig.hotWindowMonthsAhead + additionalMonths,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					previousEndDate:
						mockExistingConfig.currentWindowEndDate.toISOString(),
					newEndDate: expectedNewEndDate.toISOString(),
				},
				`Extended Generation window for organization ${mockOrganizationId} by ${additionalMonths} months`,
			);
		});

		test("throws error when window config is not found", async () => {
			const additionalMonths = 6;

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(null);

			await expect(
				extendGenerationWindow(
					mockOrganizationId,
					additionalMonths,
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow(
				`No Generation window found for organization ${mockOrganizationId}`,
			);
		});

		test("handles database errors gracefully", async () => {
			const additionalMonths = 6;
			const dbError = new Error("Database connection failed");

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockRejectedValue(dbError);

			await expect(
				extendGenerationWindow(
					mockOrganizationId,
					additionalMonths,
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow("Database connection failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.any(Error),
				}),
				`Failed to extend Generation window for organization ${mockOrganizationId}:`,
			);
		});
	});

	suite("cleanupOldGeneratedInstances", () => {
		test("successfully cleans up old instances", async () => {
			const mockWindowConfig = {
				id: faker.string.uuid(),
				organizationId: mockOrganizationId,
				retentionStartDate: new Date("2024-10-01T00:00:00Z"),
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				currentWindowEndDate: new Date("2026-01-01T00:00:00Z"),
				processingPriority: 5,
				maxInstancesPerRun: 1000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockDeleteResult = { rowCount: 25 };
			const mockDeleteChain = {
				where: vi.fn().mockResolvedValue(mockDeleteResult),
			};

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(mockWindowConfig);
			(mockDrizzleClient.delete as Mock).mockReturnValue(mockDeleteChain);

			const result = await cleanupOldGeneratedInstances(
				mockOrganizationId,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toBe(25);
			expect(mockDrizzleClient.delete).toHaveBeenCalledWith(
				recurringEventInstancesTable,
			);
			expect(mockDeleteChain.where).toHaveBeenCalledWith(
				and(
					eq(recurringEventInstancesTable.organizationId, mockOrganizationId),
					lt(
						recurringEventInstancesTable.actualEndTime,
						mockWindowConfig.retentionStartDate,
					),
				),
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					retentionStartDate: mockWindowConfig.retentionStartDate.toISOString(),
					deletedCount: 25,
				},
				`Cleaned up ${25} old Generated instances for organization ${mockOrganizationId}`,
			);
		});

		test("returns 0 when no window config found", async () => {
			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(null);

			const result = await cleanupOldGeneratedInstances(
				mockOrganizationId,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toBe(0);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				`No Generation window found for organization ${mockOrganizationId}`,
			);
		});

		test("handles null rowCount in delete result", async () => {
			const mockWindowConfig = {
				id: faker.string.uuid(),
				organizationId: mockOrganizationId,
				retentionStartDate: new Date("2024-10-01T00:00:00Z"),
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				currentWindowEndDate: new Date("2026-01-01T00:00:00Z"),
				processingPriority: 5,
				maxInstancesPerRun: 1000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockDeleteResult = { rowCount: null };
			const mockDeleteChain = {
				where: vi.fn().mockResolvedValue(mockDeleteResult),
			};

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(mockWindowConfig);
			(mockDrizzleClient.delete as Mock).mockReturnValue(mockDeleteChain);

			const result = await cleanupOldGeneratedInstances(
				mockOrganizationId,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toBe(0);
		});

		test("handles database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockRejectedValue(dbError);

			await expect(
				cleanupOldGeneratedInstances(
					mockOrganizationId,
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow("Database connection failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				dbError,
				`Failed to cleanup old Generated instances for organization ${mockOrganizationId}:`,
			);
		});
	});

	suite("getCleanupStats", () => {
		test("returns cleanup stats when window config exists", async () => {
			const mockWindowConfig = {
				id: faker.string.uuid(),
				organizationId: mockOrganizationId,
				retentionStartDate: new Date("2024-10-01T00:00:00Z"),
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				currentWindowEndDate: new Date("2026-01-01T00:00:00Z"),
				processingPriority: 5,
				maxInstancesPerRun: 1000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockTotalInstances = Array.from({ length: 100 }, () => ({
				id: faker.string.uuid(),
			}));
			const mockEligibleInstances = Array.from({ length: 25 }, () => ({
				id: faker.string.uuid(),
			}));

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(mockWindowConfig);
			(mockDrizzleClient.query.recurringEventInstancesTable.findMany as Mock)
				.mockResolvedValueOnce(mockTotalInstances)
				.mockResolvedValueOnce(mockEligibleInstances);

			const result = await getCleanupStats(
				mockOrganizationId,
				mockDrizzleClient,
			);

			expect(result).toEqual({
				totalInstances: 100,
				instancesInRetentionWindow: 75,
				instancesEligibleForCleanup: 25,
				retentionStartDate: mockWindowConfig.retentionStartDate,
			});
		});

		test("returns default stats when no window config found", async () => {
			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(null);

			const result = await getCleanupStats(
				mockOrganizationId,
				mockDrizzleClient,
			);

			expect(result).toEqual({
				totalInstances: 0,
				instancesInRetentionWindow: 0,
				instancesEligibleForCleanup: 0,
				retentionStartDate: null,
			});
		});

		test("handles database queries with proper filters", async () => {
			const mockWindowConfig = {
				id: faker.string.uuid(),
				organizationId: mockOrganizationId,
				retentionStartDate: new Date("2024-10-01T00:00:00Z"),
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				currentWindowEndDate: new Date("2026-01-01T00:00:00Z"),
				processingPriority: 5,
				maxInstancesPerRun: 1000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst as Mock
			).mockResolvedValue(mockWindowConfig);
			(mockDrizzleClient.query.recurringEventInstancesTable.findMany as Mock)
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			await getCleanupStats(mockOrganizationId, mockDrizzleClient);

			expect(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(
					recurringEventInstancesTable.organizationId,
					mockOrganizationId,
				),
				columns: { id: true },
			});

			expect(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).toHaveBeenCalledWith({
				where: and(
					eq(recurringEventInstancesTable.organizationId, mockOrganizationId),
					lt(
						recurringEventInstancesTable.actualEndTime,
						mockWindowConfig.retentionStartDate,
					),
				),
				columns: { id: true },
			});
		});
	});

	suite("validateWindowConfig", () => {
		test("returns true for valid window config", () => {
			const validConfig: WindowManagerConfig = {
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				processingPriority: 5,
				maxInstancesPerRun: 1000,
			};

			const result = validateWindowConfig(validConfig);

			expect(result).toBe(true);
		});

		test("returns false for config without organization ID", () => {
			const invalidConfig: WindowManagerConfig = {
				organizationId: "",
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				processingPriority: 5,
				maxInstancesPerRun: 1000,
			};

			const result = validateWindowConfig(invalidConfig);

			expect(result).toBe(false);
		});

		test("returns true for config with hot window months 0 (falsy values are not validated)", () => {
			const configWithZeroMonths: WindowManagerConfig = {
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 0,
				historyRetentionMonths: 3,
				processingPriority: 5,
				maxInstancesPerRun: 1000,
			};

			const result = validateWindowConfig(configWithZeroMonths);

			expect(result).toBe(true);
		});

		test("returns false for config with negative retention months", () => {
			const invalidConfig: WindowManagerConfig = {
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: -1,
				processingPriority: 5,
				maxInstancesPerRun: 1000,
			};

			const result = validateWindowConfig(invalidConfig);

			expect(result).toBe(false);
		});

		test("returns false for config with invalid processing priority", () => {
			const invalidConfig: WindowManagerConfig = {
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				processingPriority: 11,
				maxInstancesPerRun: 1000,
			};

			const result = validateWindowConfig(invalidConfig);

			expect(result).toBe(false);
		});

		test("returns true for config with max instances per run 0 (falsy values are not validated)", () => {
			const configWithZeroInstances: WindowManagerConfig = {
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				processingPriority: 5,
				maxInstancesPerRun: 0,
			};

			const result = validateWindowConfig(configWithZeroInstances);

			expect(result).toBe(true);
		});

		test("returns true for config with minimal required fields", () => {
			const minimalConfig: WindowManagerConfig = {
				organizationId: mockOrganizationId,
			};

			const result = validateWindowConfig(minimalConfig);

			expect(result).toBe(true);
		});

		test("returns true for config with valid boundary values", () => {
			const boundaryConfig: WindowManagerConfig = {
				organizationId: mockOrganizationId,
				hotWindowMonthsAhead: 1,
				historyRetentionMonths: 0,
				processingPriority: 1,
				maxInstancesPerRun: 1,
			};

			const result = validateWindowConfig(boundaryConfig);

			expect(result).toBe(true);
		});
	});
});
