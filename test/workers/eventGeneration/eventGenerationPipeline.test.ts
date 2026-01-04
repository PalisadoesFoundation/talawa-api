import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import {
	createDefaultWorkerConfig,
	runMaterializationWorker,
	runSingleOrganizationWorker,
	type WorkerConfig,
} from "~/src/workers/eventGeneration/eventGenerationPipeline";

// Mock dependencies
vi.mock("~/src/workers/eventGeneration/executionEngine", () => ({
	executeBatchEventGeneration: vi.fn(),
}));

vi.mock("~/src/workers/eventGeneration/jobDiscovery", () => ({
	createDefaultJobDiscoveryConfig: vi.fn(),
	createEventGenerationJobs: vi.fn(),
	discoverEventGenerationWorkloads: vi.fn(),
}));

vi.mock("~/src/workers/eventGeneration/postProcessor", () => ({
	createDefaultPostProcessingConfig: vi.fn(),
	executePostProcessing: vi.fn(),
}));

import { executeBatchEventGeneration } from "~/src/workers/eventGeneration/executionEngine";
import {
	createDefaultJobDiscoveryConfig,
	createEventGenerationJobs,
	discoverEventGenerationWorkloads,
} from "~/src/workers/eventGeneration/jobDiscovery";
import {
	createDefaultPostProcessingConfig,
	executePostProcessing,
} from "~/src/workers/eventGeneration/postProcessor";

describe("materializationPipeline", () => {
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

	beforeEach(() => {
		vi.clearAllMocks();

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		mockDrizzleClient = {} as NodePgDatabase<typeof schema>;
	});

	describe("runMaterializationWorker", () => {
		it("should run materialization worker successfully", async () => {
			const config: WorkerConfig = {
				maxConcurrentJobs: 5,
				maxOrganizations: 10,
				enablePostProcessing: true,
			};

			const mockWorkloads = [
				{
					organizationId: "org1",
					windowConfig: createMockWindowConfig(),
					recurringEvents: [],
					priority: 7,
					estimatedDurationMs: 10000,
				},
			];

			const mockJobs = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			const mockExecutionResult = {
				success: true,
				data: [
					{
						organizationId: "org1",
						eventId: "event1",
						instancesCreated: 5,
						executionTimeMs: 1000,
					},
				],
				metrics: {
					organizationsProcessed: 1,
					instancesCreated: 5,
					errorsEncountered: 0,
					startTime: Date.now(),
					endTime: Date.now(),
					eventsProcessed: 1,
				},
				resourceUsage: {
					memoryUsageMB: 0,
					cpuUsagePercent: 0,
					databaseConnections: 1,
					processingThroughput: 5,
				},
			};

			const mockPostProcessResult = {
				cleanupPerformed: true,
				errors: [],
				windowsUpdated: 1,
			};

			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockResolvedValue(
				mockWorkloads,
			);
			vi.mocked(createEventGenerationJobs).mockReturnValue(mockJobs);
			vi.mocked(executeBatchEventGeneration).mockResolvedValue(
				mockExecutionResult,
			);
			vi.mocked(createDefaultPostProcessingConfig).mockReturnValue({
				enableCleanup: true,
			});
			vi.mocked(executePostProcessing).mockResolvedValue(mockPostProcessResult);

			const result = await runMaterializationWorker(
				config,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 1,
				instancesCreated: 5,
				windowsUpdated: 1,
				errorsEncountered: 0,
				processingTimeMs: expect.any(Number),
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					maxConcurrentJobs: 5,
					maxOrganizations: 10,
				},
				"Starting materialization worker run",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Created 1 materialization jobs from 1 workloads",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.any(Object),
				"Materialization worker completed",
			);
		});

		it("should handle no workloads discovered", async () => {
			const config: WorkerConfig = {
				maxConcurrentJobs: 5,
				maxOrganizations: 10,
				enablePostProcessing: true,
			};

			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockResolvedValue([]);

			const result = await runMaterializationWorker(
				config,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: expect.any(Number),
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"No materialization work discovered",
			);
		});

		it("should handle execution failure", async () => {
			const config: WorkerConfig = {
				maxConcurrentJobs: 5,
				maxOrganizations: 10,
				enablePostProcessing: true,
			};

			const mockWorkloads = [
				{
					organizationId: "org1",
					windowConfig: createMockWindowConfig(),
					recurringEvents: [],
					priority: 7,
					estimatedDurationMs: 10000,
				},
			];

			const mockJobs = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			const mockExecutionResult = {
				success: false,
				data: null,
				error: "Execution failed",
				metrics: {
					organizationsProcessed: 0,
					instancesCreated: 0,
					errorsEncountered: 1,
					startTime: Date.now(),
					endTime: Date.now(),
					eventsProcessed: 0,
				},
				resourceUsage: {
					memoryUsageMB: 0,
					cpuUsagePercent: 0,
					databaseConnections: 0,
					processingThroughput: 0,
				},
			};

			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockResolvedValue(
				mockWorkloads,
			);
			vi.mocked(createEventGenerationJobs).mockReturnValue(mockJobs);
			vi.mocked(executeBatchEventGeneration).mockResolvedValue(
				mockExecutionResult,
			);

			const result = await runMaterializationWorker(
				config,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 1,
				processingTimeMs: expect.any(Number),
			});
			expect(mockLogger.error).toHaveBeenCalledWith(
				{
					error: "Execution failed",
				},
				"Batch execution failed",
			);
		});

		it("should skip post-processing when disabled", async () => {
			const config: WorkerConfig = {
				maxConcurrentJobs: 5,
				maxOrganizations: 10,
				enablePostProcessing: false,
			};

			const mockWorkloads = [
				{
					organizationId: "org1",
					windowConfig: createMockWindowConfig(),
					recurringEvents: [],
					priority: 7,
					estimatedDurationMs: 10000,
				},
			];

			const mockJobs = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			const mockExecutionResult = {
				success: true,
				data: [
					{
						organizationId: "org1",
						eventId: "event1",
						instancesCreated: 5,
						executionTimeMs: 1000,
					},
				],
				metrics: {
					organizationsProcessed: 1,
					instancesCreated: 5,
					errorsEncountered: 0,
					startTime: Date.now(),
					endTime: Date.now(),
					eventsProcessed: 1,
				},
				resourceUsage: {
					memoryUsageMB: 0,
					cpuUsagePercent: 0,
					databaseConnections: 1,
					processingThroughput: 5,
				},
			};

			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockResolvedValue(
				mockWorkloads,
			);
			vi.mocked(createEventGenerationJobs).mockReturnValue(mockJobs);
			vi.mocked(executeBatchEventGeneration).mockResolvedValue(
				mockExecutionResult,
			);

			const result = await runMaterializationWorker(
				config,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 1,
				instancesCreated: 5,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: expect.any(Number),
			});
			expect(executePostProcessing).not.toHaveBeenCalled();
		});

		it("should handle worker errors", async () => {
			const config: WorkerConfig = {
				maxConcurrentJobs: 5,
				maxOrganizations: 10,
				enablePostProcessing: true,
			};

			const error = new Error("Worker failed");
			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockRejectedValue(error);

			const result = await runMaterializationWorker(
				config,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 1,
				processingTimeMs: expect.any(Number),
			});
			expect(mockLogger.error).toHaveBeenCalledWith(
				{ error },
				"Materialization worker failed",
			);
		});
	});

	describe("runSingleOrganizationWorker", () => {
		it("should run single organization worker successfully", async () => {
			const organizationId = "org1";

			const mockWorkloads = [
				{
					organizationId: "org1",
					windowConfig: createMockWindowConfig(),
					recurringEvents: [],
					priority: 7,
					estimatedDurationMs: 10000,
				},
				{
					organizationId: "org2",
					windowConfig: createMockWindowConfig(),
					recurringEvents: [],
					priority: 5,
					estimatedDurationMs: 5000,
				},
			];

			const mockJobs = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			const mockExecutionResult = {
				success: true,
				data: [
					{
						organizationId: "org1",
						eventId: "event1",
						instancesCreated: 3,
						executionTimeMs: 1000,
					},
				],
				metrics: {
					organizationsProcessed: 1,
					instancesCreated: 3,
					errorsEncountered: 0,
					startTime: Date.now(),
					endTime: Date.now(),
					eventsProcessed: 1,
				},
				resourceUsage: {
					memoryUsageMB: 0,
					cpuUsagePercent: 0,
					databaseConnections: 1,
					processingThroughput: 3,
				},
			};

			const mockPostProcessResult = {
				cleanupPerformed: true,
				errors: [],
				windowsUpdated: 1,
			};

			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockResolvedValue(
				mockWorkloads,
			);
			vi.mocked(createEventGenerationJobs).mockReturnValue(mockJobs);
			vi.mocked(executeBatchEventGeneration).mockResolvedValue(
				mockExecutionResult,
			);
			vi.mocked(createDefaultPostProcessingConfig).mockReturnValue({
				enableCleanup: true,
			});
			vi.mocked(executePostProcessing).mockResolvedValue(mockPostProcessResult);

			const result = await runSingleOrganizationWorker(
				organizationId,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 1,
				instancesCreated: 3,
				windowsUpdated: 1,
				errorsEncountered: 0,
				processingTimeMs: expect.any(Number),
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Processing specific organization: org1",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					errorsEncountered: expect.any(Number),
					instancesCreated: expect.any(Number),
					organizationsProcessed: expect.any(Number),
					processingTimeMs: expect.any(Number),
					windowsUpdated: expect.any(Number),
				},
				"Completed processing for organization org1",
			);
		});

		it("should handle organization not found", async () => {
			const organizationId = "org1";

			const mockWorkloads = [
				{
					organizationId: "org2",
					windowConfig: createMockWindowConfig(),
					recurringEvents: [],
					priority: 5,
					estimatedDurationMs: 5000,
				},
			];

			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockResolvedValue(
				mockWorkloads,
			);

			const result = await runSingleOrganizationWorker(
				organizationId,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: expect.any(Number),
			});
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"No work found for organization org1",
			);
		});

		it("should handle single organization worker errors", async () => {
			const organizationId = "org1";
			const error = new Error("Worker failed");

			vi.mocked(createDefaultJobDiscoveryConfig).mockReturnValue({
				maxOrganizations: 50,
				lookAheadMonths: 1,
				priorityThreshold: 5,
			});
			vi.mocked(discoverEventGenerationWorkloads).mockRejectedValue(error);

			const result = await runSingleOrganizationWorker(
				organizationId,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toEqual({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 1,
				processingTimeMs: expect.any(Number),
			});
			expect(mockLogger.error).toHaveBeenCalledWith(
				error,
				"Failed to process organization org1",
			);
		});
	});

	describe("createDefaultWorkerConfig", () => {
		it("should create default worker config", () => {
			const config = createDefaultWorkerConfig();

			expect(config).toEqual({
				maxConcurrentJobs: 5,
				maxOrganizations: 50,
				enablePostProcessing: true,
			});
		});
	});
});
