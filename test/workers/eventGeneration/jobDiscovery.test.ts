import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import {
	createDefaultJobDiscoveryConfig,
	createEventGenerationJobs,
	type DiscoveredWorkload,
	discoverEventGenerationWorkloads,
	type JobDiscoveryConfig,
} from "~/src/workers/eventGeneration/jobDiscovery";
import type { WorkerDependencies } from "~/src/workers/eventGeneration/types";

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

vi.mock("~/src/utilities/recurringEvent", () => ({
	estimateInstanceCount: vi.fn(),
	normalizeRecurrenceRule: vi.fn(),
}));

import {
	estimateInstanceCount,
	normalizeRecurrenceRule,
} from "~/src/utilities/recurringEvent";

describe("jobDiscovery", () => {
	let mockDrizzleClient: NodePgDatabase<typeof schema>;
	let mockLogger: FastifyBaseLogger;
	let deps: WorkerDependencies;

	// Helper function to create mock window config with all required properties
	const createMockWindowConfig = (overrides = {}) => ({
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		id: "window1",
		organizationId: "org1",
		hotWindowMonthsAhead: 12,
		historyRetentionMonths: 6,
		currentWindowEndDate: new Date("2024-12-31"), // Far future to avoid urgency bonus
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

	// Helper function to create mock event with all required properties
	const createMockEvent = (overrides = {}) => ({
		createdAt: new Date("2024-01-01"),
		name: "Event 1",
		id: "event1",
		creatorId: "user1",
		description: null,
		updatedAt: new Date("2024-01-01"),
		updaterId: null,
		organizationId: "org1",
		isRecurringEventTemplate: true,
		instanceEndTime: null,
		startDate: new Date("2024-01-01"),
		endDate: new Date("2024-01-02"),
		startAt: new Date("2024-01-01"),
		endAt: new Date("2024-01-02"),
		allDay: false,
		location: null,
		latitude: null,
		longitude: null,
		attendees: [],
		isPublic: true,
		isRegisterable: false,
		isInviteOnly: false,
		...overrides,
	});

	// Helper function to create mock recurrence rule with all required properties
	const createMockRecurrenceRule = (overrides = {}) => ({
		createdAt: new Date("2024-01-01"),
		id: "rule1",
		creatorId: "user1",
		updatedAt: new Date("2024-01-01"),
		updaterId: null,
		organizationId: "org1",
		recurrenceRuleString: "FREQ=DAILY",
		frequency: "DAILY" as const,
		interval: 1,
		count: null,
		recurrenceStartDate: new Date("2024-01-01"),
		recurrenceEndDate: null,
		weekDays: null,
		bySetPos: null,
		baseRecurringEventId: "event1",
		originalSeriesId: "event1",
		latestInstanceDate: new Date("2024-01-01"), // Set to a date instead of null
		byDay: null,
		byMonth: null,
		byMonthDay: null,
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
				},
				eventsTable: {
					findMany: vi.fn(),
				},
				recurrenceRulesTable: {
					findMany: vi.fn(),
				},
			},
		} as unknown as NodePgDatabase<typeof schema>;

		deps = {
			drizzleClient: mockDrizzleClient,
			logger: mockLogger,
		};
	});

	describe("discoverEventGenerationWorkloads", () => {
		it("should discover workloads successfully", async () => {
			const config: JobDiscoveryConfig = {
				maxOrganizations: 10,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			};

			const mockWindowConfigs = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					processingPriority: 7,
				}),
				createMockWindowConfig({
					id: "window2",
					organizationId: "org2",
					processingPriority: 5,
				}),
			];

			const mockEvents = [
				createMockEvent({
					id: "event1",
					name: "Event 1",
					organizationId: "org1",
				}),
				createMockEvent({
					id: "event2",
					name: "Event 2",
					organizationId: "org1",
				}),
			];

			const mockRecurrenceRules = [
				createMockRecurrenceRule({
					id: "rule1",
					baseRecurringEventId: "event1",
					organizationId: "org1",
					count: null,
					recurrenceEndDate: null,
				}),
				createMockRecurrenceRule({
					id: "rule2",
					baseRecurringEventId: "event2",
					organizationId: "org1",
					count: 10,
					recurrenceEndDate: null,
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockWindowConfigs);
			vi.mocked(mockDrizzleClient.query.eventsTable.findMany)
				.mockResolvedValueOnce(mockEvents) // org1 has events
				.mockResolvedValueOnce([]); // org2 has no events
			vi.mocked(mockDrizzleClient.query.recurrenceRulesTable.findMany)
				.mockResolvedValueOnce(mockRecurrenceRules) // org1 has rules
				.mockResolvedValueOnce([]); // org2 has no rules
			vi.mocked(estimateInstanceCount).mockReturnValue(5);

			const result = await discoverEventGenerationWorkloads(config, deps);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				organizationId: "org1",
				windowConfig: mockWindowConfigs[0],
				recurringEvents: [
					{
						eventId: "event1",
						eventName: "Event 1",
						ruleId: "rule1",
						isNeverEnding: true,
						estimatedInstances: 5,
						recurrenceRule: mockRecurrenceRules[0],
					},
					{
						eventId: "event2",
						eventName: "Event 2",
						ruleId: "rule2",
						isNeverEnding: false,
						estimatedInstances: 5,
						recurrenceRule: mockRecurrenceRules[1],
					},
				],
				priority: expect.any(Number),
				estimatedDurationMs: expect.any(Number),
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					totalEvents: 2,
					highPriorityWorkloads: expect.any(Number),
				},
				"Discovered 1 EventGeneration workloads",
			);
		});
		it("should skip recurring events without rules", async () => {
			const config: JobDiscoveryConfig = {
				maxOrganizations: 10,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			};

			const mockWindowConfigs = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					processingPriority: 7,
				}),
			];

			const mockEvents = [
				createMockEvent({
					id: "event1",
					name: "Event 1",
					organizationId: "org1",
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockWindowConfigs);

			vi.mocked(mockDrizzleClient.query.eventsTable.findMany)
				.mockResolvedValueOnce(mockEvents)
				.mockResolvedValueOnce([]);

			vi.mocked(
				mockDrizzleClient.query.recurrenceRulesTable.findMany,
			).mockResolvedValueOnce([]); // no rules

			const result = await discoverEventGenerationWorkloads(config, deps);

			expect(result).toHaveLength(0);
		});

		it("should handle no organizations needing work", async () => {
			const config: JobDiscoveryConfig = {
				maxOrganizations: 10,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			};

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue([]);

			const result = await discoverEventGenerationWorkloads(config, deps);

			expect(result).toHaveLength(0);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"No organizations need EventGeneration work",
			);
		});

		it("should handle organizations with no recurring events", async () => {
			const config: JobDiscoveryConfig = {
				maxOrganizations: 10,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			};

			const mockWindowConfigs = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					processingPriority: 7,
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockWindowConfigs);
			vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockResolvedValue(
				[],
			);
			vi.mocked(
				mockDrizzleClient.query.recurrenceRulesTable.findMany,
			).mockResolvedValue([]);

			const result = await discoverEventGenerationWorkloads(config, deps);

			expect(result).toHaveLength(0);
		});

		it("should handle errors when discovering workloads", async () => {
			const config: JobDiscoveryConfig = {
				maxOrganizations: 10,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			};

			const mockWindowConfigs = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					processingPriority: 7,
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockWindowConfigs);
			vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockRejectedValue(
				new Error("Database error"),
			);

			const result = await discoverEventGenerationWorkloads(config, deps);

			expect(result).toHaveLength(0);
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.any(Error),
				"Failed to discover workload for organization org1",
			);
		});

		it("should sort workloads by priority", async () => {
			// Mock the current date to control the priority calculation
			const mockNow = new Date("2024-06-01");
			vi.setSystemTime(mockNow);

			const config: JobDiscoveryConfig = {
				maxOrganizations: 10,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			};

			// Database query orders by processingPriority ASC, so org1 (1) comes before org2 (3)
			const mockWindowConfigs = [
				createMockWindowConfig({
					id: "window1",
					organizationId: "org1",
					processingPriority: 1, // Much lower base priority
				}),
				createMockWindowConfig({
					id: "window2",
					organizationId: "org2",
					processingPriority: 3, // Higher base priority to ensure org2 comes first
				}),
			];

			const mockEvents = [
				createMockEvent({
					id: "event1",
					name: "Event 1",
					organizationId: "org1",
				}),
				createMockEvent({
					id: "event2",
					name: "Event 2",
					organizationId: "org2",
				}),
			];

			const mockRecurrenceRules = [
				createMockRecurrenceRule({
					id: "rule1",
					baseRecurringEventId: "event1",
					organizationId: "org1",
					count: 10, // Not never-ending
					recurrenceEndDate: null,
				}),
				createMockRecurrenceRule({
					id: "rule2",
					baseRecurringEventId: "event2",
					organizationId: "org2",
					count: null, // Never-ending event to increase priority
					recurrenceEndDate: null,
				}),
			];

			vi.mocked(
				mockDrizzleClient.query.eventGenerationWindowsTable.findMany,
			).mockResolvedValue(mockWindowConfigs);

			vi.mocked(mockDrizzleClient.query.eventsTable.findMany as unknown as Mock)
				.mockResolvedValueOnce([mockEvents[0]])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([mockEvents[1]])
				.mockResolvedValueOnce([]);

			vi.mocked(
				mockDrizzleClient.query.recurrenceRulesTable
					.findMany as unknown as Mock,
			)
				.mockResolvedValueOnce([mockRecurrenceRules[0]])
				.mockResolvedValueOnce([mockRecurrenceRules[1]]);

			vi.mocked(estimateInstanceCount).mockReturnValue(5);

			const result = await discoverEventGenerationWorkloads(config, deps);

			expect(result).toHaveLength(2);

			// Since org2 has a never-ending event and higher base priority, it should come first
			expect(result[0]?.organizationId).toBe("org2"); // Higher priority should come first
			expect(result[1]?.organizationId).toBe("org1");

			// Clean up system time
			vi.useRealTimers();
		});

		describe("createEventGenerationJobs", () => {
			it("should create materialization jobs from workloads", () => {
				const mockWorkloads: DiscoveredWorkload[] = [
					{
						organizationId: "org1",
						windowConfig: createMockWindowConfig({
							id: "window1",
							organizationId: "org1",
							processingPriority: 7,
						}),
						recurringEvents: [
							{
								eventId: "event1",
								eventName: "Event 1",
								ruleId: "rule1",
								isNeverEnding: true,
								estimatedInstances: 5,
								recurrenceRule: createMockRecurrenceRule({
									id: "rule1",
									baseRecurringEventId: "event1",
									organizationId: "org1",
									count: null,
									recurrenceEndDate: null,
								}),
							},
							{
								eventId: "event2",
								eventName: "Event 2",
								ruleId: "rule2",
								isNeverEnding: false,
								estimatedInstances: 3,
								recurrenceRule: createMockRecurrenceRule({
									id: "rule2",
									baseRecurringEventId: "event2",
									organizationId: "org1",
									count: 10,
									recurrenceEndDate: new Date("2024-12-31"),
								}),
							},
						],
						priority: 7,
						estimatedDurationMs: 10000,
					},
				];

				const mockNormalizedRule = createMockRecurrenceRule({
					id: "rule1",
					baseRecurringEventId: "event1",
					organizationId: "org1",
					count: null,
					recurrenceEndDate: new Date("2024-12-31"),
				});

				vi.mocked(normalizeRecurrenceRule).mockReturnValue(mockNormalizedRule);

				const result = createEventGenerationJobs(mockWorkloads);

				expect(result).toHaveLength(2);
				expect(result[0]).toEqual({
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-12-31"),
					windowEndDate: expect.any(Date),
				});
				expect(result[1]).toEqual({
					organizationId: "org1",
					baseRecurringEventId: "event2",
					windowStartDate: new Date("2024-12-31"),
					windowEndDate: expect.any(Date),
				});
			});

			it("should handle empty workloads", () => {
				const result = createEventGenerationJobs([]);

				expect(result).toHaveLength(0);
			});

			it("should handle workloads with no recurring events", () => {
				const mockWorkloads: DiscoveredWorkload[] = [
					{
						organizationId: "org1",
						windowConfig: createMockWindowConfig({
							id: "window1",
							organizationId: "org1",
							processingPriority: 7,
						}),
						recurringEvents: [],
						priority: 7,
						estimatedDurationMs: 10000,
					},
				];

				const result = createEventGenerationJobs(mockWorkloads);

				expect(result).toHaveLength(0);
			});
		});

		describe("createDefaultJobDiscoveryConfig", () => {
			it("should create default config with expected values", () => {
				const config = createDefaultJobDiscoveryConfig();

				expect(config).toEqual({
					maxOrganizations: 50,
					lookAheadMonths: 1,
					priorityThreshold: 5,
				});
			});
		});
	});
});
