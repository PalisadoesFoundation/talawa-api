import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import {
	getFixedProcessingConfig,
	getOrganizationMaterializationStatus,
	getOrganizationsNeedingMaterialization,
	getProcessingStatistics,
	updateWindowAfterProcessing,
	validateWindowConfiguration,
	type WindowProcessingConfig,
	type WindowProcessingResult,
	type WorkerDependencies,
} from "~/src/workers/eventGeneration/windowManager";

// Mock dependencies
vi.mock("drizzle-orm", async () => {
	const actual = await vi.importActual("drizzle-orm");
	return {
		...actual,
		and: vi.fn(),
		eq: vi.fn(),
		lt: vi.fn(),
	};
});

describe("windowManager", () => {
	let mockDrizzleClient: NodePgDatabase<typeof schema>;
	let mockLogger: FastifyBaseLogger;
	let deps: WorkerDependencies;

	// Helper function to create complete mock window config
	const createMockWindowConfig = (overrides = {}) => ({
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		id: "window1",
		organizationId: "org1",
		hotWindowMonthsAhead: 12,
		historyRetentionMonths: 6,
		currentWindowEndDate: new Date("2024-01-01"),
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

	// Helper function to create mock materialized instance
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

	// Helper function to create mock event
	const createMockEvent = (overrides = {}) => ({
		name: "Event 1",
		id: "event1",
		createdAt: new Date("2024-01-01"),
		creatorId: "user1",
		description: null,
		updatedAt: new Date("2024-01-01"),
		updaterId: null,
		endAt: new Date("2024-01-02"),
		organizationId: "org1",
		isRecurringEventTemplate: true,
		instanceEndTime: null,
		startDate: new Date("2024-01-01"),
		endDate: new Date("2024-01-02"),
		startAt: new Date("2024-01-01"),
		allDay: false,
		location: null,
		latitude: null,
		longitude: null,
		isPublic: true,
		isRegisterable: false,
		isInviteOnly: false,
		attachmentsPolicy: "inherit",
		timezone: "UTC",
		recurrenceRule: null,
		recurrenceUntil: null,
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
				eventsTable: {
					findMany: vi.fn(),
				},
				recurringEventInstancesTable: {
					findMany: vi.fn(),
				},
			},
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(),
				})),
			})),
		} as unknown as NodePgDatabase<typeof schema>;

		deps = {
			drizzleClient: mockDrizzleClient,
			logger: mockLogger,
		};
	});

	describe("getOrganizationsNeedingMaterialization", () => {
		it("should get organizations needing materialization", async () => {
			const config: WindowProcessingConfig = {
				maxOrganizationsPerRun: 10,
				processingTimeoutHours: 1,
				priorityThresholdWeeks: 2,
			};

			const mockOrganizations = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					currentWindowEndDate: new Date("2024-01-15"),
					processingPriority: 8,
				}),
				createMockWindowConfig({
					id: "window2",
					organizationId: "org2",
					currentWindowEndDate: new Date("2024-01-20"),
					processingPriority: 5,
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockOrganizations);

			const result = await getOrganizationsNeedingMaterialization(config, deps);

			expect(result).toEqual(mockOrganizations);
			expect(mockLogger.debug).toHaveBeenCalledWith(
				{
					oneMonthFromNow: expect.any(String),
					processingTimeoutDate: expect.any(String),
					maxOrganizations: 10,
				},
				"Getting organizations needing materialization",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Found 2 organizations needing materialization processing",
			);
		});

		it("should handle no organizations needing materialization", async () => {
			const config: WindowProcessingConfig = {
				maxOrganizationsPerRun: 10,
				processingTimeoutHours: 1,
				priorityThresholdWeeks: 2,
			};

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue([]);

			const result = await getOrganizationsNeedingMaterialization(config, deps);

			expect(result).toEqual([]);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Found 0 organizations needing materialization processing",
			);
		});
	});

	describe("updateWindowAfterProcessing", () => {
		it("should update window after processing successfully", async () => {
			const windowId = "window1";
			const processingResult: WindowProcessingResult = {
				windowId: "window1",
				organizationId: "org1",
				instancesCreated: 5,
				eventsProcessed: 3,
				processingTime: 2000,
			};

			const mockCurrentWindow = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				hotWindowMonthsAhead: 12,
				configurationNotes: "Previous note",
				processingPriority: 5,
			});

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(mockCurrentWindow);

			await updateWindowAfterProcessing(windowId, processingResult, deps);

			expect(mockDrizzleClient.update).toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					windowId: "window1",
					organizationId: "org1",
					newWindowEndDate: expect.any(String),
					instancesCreated: 5,
					eventsProcessed: 3,
					processingTime: 2000,
				},
				"Updated materialization window",
			);
		});

		it("should throw error if window not found", async () => {
			const windowId = "nonexistent";
			const processingResult: WindowProcessingResult = {
				windowId: "nonexistent",
				organizationId: "org1",
				instancesCreated: 5,
				eventsProcessed: 3,
				processingTime: 2000,
			};

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(undefined);

			await expect(
				updateWindowAfterProcessing(windowId, processingResult, deps),
			).rejects.toThrow("Window configuration not found: nonexistent");
		});

		it("should build processing notes correctly", async () => {
			const windowId = "window1";
			const processingResult: WindowProcessingResult = {
				windowId: "window1",
				organizationId: "org1",
				instancesCreated: 10,
				eventsProcessed: 5,
				processingTime: 3000,
			};

			const mockCurrentWindow = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				hotWindowMonthsAhead: 12,
				configurationNotes: "Note 1\nNote 2\nNote 3\nNote 4",
				isEnabled: true,
				currentWindowEndDate: new Date("2024-01-01"),
				lastProcessedAt: new Date("2024-01-01"),
				processingPriority: 5,
			});

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(mockCurrentWindow);

			const mockSet = vi.fn().mockReturnThis();
			vi.mocked(mockDrizzleClient.update).mockReturnValue({
				set: mockSet,
				where: vi.fn(),
			} as unknown as ReturnType<typeof mockDrizzleClient.update>);

			await updateWindowAfterProcessing(windowId, processingResult, deps);

			expect(mockSet).toHaveBeenCalledWith({
				currentWindowEndDate: expect.any(Date),
				lastProcessedAt: expect.any(Date),
				lastProcessedInstanceCount: 10,
				configurationNotes: expect.stringContaining(
					"Processed 5 events, created 10 instances",
				),
			});
		});
	});

	describe("getOrganizationMaterializationStatus", () => {
		it("should get organization materialization status", async () => {
			const organizationId = "org1";

			const mockWindowConfig = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				lastProcessedAt: new Date("2024-01-01"),
				processingPriority: 7,
				currentWindowEndDate: new Date("2024-12-31"),
				isEnabled: true,
			});

			const mockRecurringEvents = [
				createMockEvent({ id: "event1" }),
				createMockEvent({ id: "event2" }),
			];

			const mockMaterializedInstances = [
				createMockMaterializedInstance({ id: "instance1" }),
				createMockMaterializedInstance({ id: "instance2" }),
				createMockMaterializedInstance({ id: "instance3" }),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(mockWindowConfig);
			vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockResolvedValue(
				mockRecurringEvents,
			);
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue(mockMaterializedInstances);

			const result = await getOrganizationMaterializationStatus(
				organizationId,
				deps,
			);

			expect(result).toEqual({
				windowConfig: mockWindowConfig,
				recurringEventsCount: 2,
				materializedInstancesCount: 3,
				lastProcessedAt: new Date("2024-01-01"),
				needsProcessing: expect.any(Boolean),
				processingPriority: 7,
			});
		});

		it("should handle organization with no window config", async () => {
			const organizationId = "org1";

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findFirst,
			).mockResolvedValue(undefined);
			vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockResolvedValue(
				[],
			);
			vi.mocked(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).mockResolvedValue([]);

			const result = await getOrganizationMaterializationStatus(
				organizationId,
				deps,
			);

			expect(result).toEqual({
				windowConfig: null,
				recurringEventsCount: 0,
				materializedInstancesCount: 0,
				lastProcessedAt: null,
				needsProcessing: true,
				processingPriority: 5,
			});
		});
	});

	describe("validateWindowConfiguration", () => {
		it("should validate correct window configuration", () => {
			const windowConfig = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				isEnabled: true,
				hotWindowMonthsAhead: 12,
				maxInstancesPerRun: 100,
				processingPriority: 5,
				currentWindowEndDate: new Date(),
				lastProcessedAt: new Date(),
			});

			const result = validateWindowConfiguration(windowConfig);

			expect(result).toEqual({
				isValid: true,
				errors: [],
			});
		});

		it("should validate incorrect window configuration", () => {
			const windowConfig = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				isEnabled: false,
				hotWindowMonthsAhead: 0,
				maxInstancesPerRun: 0,
				processingPriority: 15,
				currentWindowEndDate: new Date(),
				lastProcessedAt: new Date(),
			});

			const result = validateWindowConfiguration(windowConfig);

			expect(result).toEqual({
				isValid: false,
				errors: [
					"Window is not enabled for processing",
					"Hot window months ahead must be at least 1",
					"Max instances per run must be at least 1",
					"Processing priority must be between 1 and 10",
				],
			});
		});

		it("should validate processing priority bounds", () => {
			const windowConfig1 = createMockWindowConfig({
				id: "window1",
				organizationId: "org1",
				isEnabled: true,
				hotWindowMonthsAhead: 12,
				maxInstancesPerRun: 100,
				processingPriority: 0,
				currentWindowEndDate: new Date(),
				lastProcessedAt: new Date(),
			});

			const windowConfig2 = createMockWindowConfig({
				id: "window2",
				organizationId: "org2",
				isEnabled: true,
				hotWindowMonthsAhead: 12,
				maxInstancesPerRun: 100,
				processingPriority: 11,
				currentWindowEndDate: new Date(),
				lastProcessedAt: new Date(),
			});

			const result1 = validateWindowConfiguration(windowConfig1);
			const result2 = validateWindowConfiguration(windowConfig2);

			expect(result1.isValid).toBe(false);
			expect(result1.errors).toContain(
				"Processing priority must be between 1 and 10",
			);
			expect(result2.isValid).toBe(false);
			expect(result2.errors).toContain(
				"Processing priority must be between 1 and 10",
			);
		});
	});

	describe("getProcessingStatistics", () => {
		it("should get processing statistics", async () => {
			const mockAllWindows = [
				createMockWindowConfig({
					id: "window1",
					isEnabled: true,
					lastProcessedInstanceCount: 10,
					lastProcessedAt: new Date("2024-01-01"),
					currentWindowEndDate: new Date("2024-12-31"),
				}),
				createMockWindowConfig({
					id: "window2",
					isEnabled: false,
					lastProcessedInstanceCount: 5,
					lastProcessedAt: new Date("2024-01-02"),
					currentWindowEndDate: new Date("2024-12-31"),
				}),
			];

			const mockEnabledWindows = [
				createMockWindowConfig({
					id: "window1",
					lastProcessedInstanceCount: 10,
					lastProcessedAt: new Date("2024-01-01"),
					currentWindowEndDate: new Date("2024-01-15"), // Within one month
				}),
			];

			vi.mocked(mockDrizzleClient.query.eventGenerationWindowsTable.findMany)
				.mockResolvedValueOnce(mockAllWindows)
				.mockResolvedValueOnce(mockEnabledWindows);

			const result = await getProcessingStatistics(deps);

			expect(result).toEqual({
				totalOrganizations: 2,
				enabledOrganizations: 1,
				organizationsNeedingProcessing: 1,
				averageInstancesPerRun: 10,
				lastProcessingRun: new Date("2024-01-01"),
			});
		});

		it("should handle no organizations", async () => {
			vi.mocked(mockDrizzleClient.query.eventGenerationWindowsTable.findMany)
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			const result = await getProcessingStatistics(deps);

			expect(result).toEqual({
				totalOrganizations: 0,
				enabledOrganizations: 0,
				organizationsNeedingProcessing: 0,
				averageInstancesPerRun: 0,
				lastProcessingRun: null,
			});
		});

		it("should handle organizations with no instance counts", async () => {
			const futureDate = new Date();
			futureDate.setMonth(futureDate.getMonth() + 2); // 2 months in the future

			const mockAllWindows = [
				createMockWindowConfig({
					id: "window1",
					isEnabled: true,
					lastProcessedInstanceCount: null,
					lastProcessedAt: null,
					currentWindowEndDate: futureDate,
				}),
			];

			const mockEnabledWindows = [
				createMockWindowConfig({
					id: "window1",
					lastProcessedInstanceCount: null,
					lastProcessedAt: null,
					currentWindowEndDate: futureDate,
				}),
			];

			vi.mocked(mockDrizzleClient.query.eventGenerationWindowsTable.findMany)
				.mockResolvedValueOnce(mockAllWindows)
				.mockResolvedValueOnce(mockEnabledWindows);

			const result = await getProcessingStatistics(deps);

			expect(result).toEqual({
				totalOrganizations: 1,
				enabledOrganizations: 1,
				organizationsNeedingProcessing: 0,
				averageInstancesPerRun: 0,
				lastProcessingRun: null,
			});
		});
	});

	describe("getFixedProcessingConfig", () => {
		it("should return fixed processing config", () => {
			const config = getFixedProcessingConfig();

			expect(config).toEqual({
				maxOrganizationsPerRun: 50,
				processingTimeoutHours: 1,
				priorityThresholdWeeks: 2,
			});
		});
	});
});
