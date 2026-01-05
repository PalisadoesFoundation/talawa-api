import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import type { EventGenerationExecutionResult } from "~/src/workers/eventGeneration/executionEngine";
import {
	createDefaultPostProcessingConfig,
	executePostProcessing,
	type PostProcessingConfig,
} from "~/src/workers/eventGeneration/postProcessor";
import type {
	ProcessingMetrics,
	WorkerDependencies,
} from "~/src/workers/eventGeneration/types";

describe("postProcessor", () => {
	let mockDrizzleClient: NodePgDatabase<typeof schema>;
	let mockLogger: FastifyBaseLogger;
	let deps: WorkerDependencies;

	beforeEach(() => {
		vi.clearAllMocks();

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		mockDrizzleClient = {} as NodePgDatabase<typeof schema>;

		deps = {
			drizzleClient: mockDrizzleClient,
			logger: mockLogger,
		};
	});

	describe("executePostProcessing", () => {
		it("should execute post-processing successfully with cleanup enabled", async () => {
			const executionResults: EventGenerationExecutionResult[] = [
				{
					organizationId: "org1",
					eventId: "event1",
					instancesCreated: 5,
					executionTimeMs: 1000,
				},
				{
					organizationId: "org2",
					eventId: "event2",
					instancesCreated: 3,
					executionTimeMs: 800,
				},
			];

			const metrics: ProcessingMetrics = {
				startTime: Date.now(),
				endTime: Date.now(),
				instancesCreated: 8,
				eventsProcessed: 2,
				organizationsProcessed: 2,
				errorsEncountered: 0,
			};

			const config: PostProcessingConfig = {
				enableCleanup: true,
			};

			const result = await executePostProcessing(
				executionResults,
				metrics,
				config,
				deps,
			);

			expect(result).toEqual({
				cleanupPerformed: true,
				errors: [],
				windowsUpdated: 0,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					organizationsProcessed: 2,
					totalInstancesCreated: 8,
				},
				"Cleanup operations completed",
			);
		});

		it("should skip cleanup when disabled", async () => {
			const executionResults: EventGenerationExecutionResult[] = [
				{
					organizationId: "org1",
					eventId: "event1",
					instancesCreated: 5,
					executionTimeMs: 1000,
				},
			];

			const metrics: ProcessingMetrics = {
				startTime: Date.now(),
				endTime: Date.now(),
				instancesCreated: 5,
				eventsProcessed: 1,
				organizationsProcessed: 1,
				errorsEncountered: 0,
			};

			const config: PostProcessingConfig = {
				enableCleanup: false,
			};

			const result = await executePostProcessing(
				executionResults,
				metrics,
				config,
				deps,
			);

			expect(result).toEqual({
				cleanupPerformed: false,
				errors: [],
				windowsUpdated: 0,
			});
			expect(mockLogger.info).not.toHaveBeenCalled();
		});

		it("should handle empty execution results", async () => {
			const executionResults: EventGenerationExecutionResult[] = [];

			const metrics: ProcessingMetrics = {
				startTime: Date.now(),
				endTime: Date.now(),
				instancesCreated: 0,
				eventsProcessed: 0,
				organizationsProcessed: 0,
				errorsEncountered: 0,
			};

			const config: PostProcessingConfig = {
				enableCleanup: true,
			};

			const result = await executePostProcessing(
				executionResults,
				metrics,
				config,
				deps,
			);

			expect(result).toEqual({
				cleanupPerformed: true,
				errors: [],
				windowsUpdated: 0,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					organizationsProcessed: 0,
					totalInstancesCreated: 0,
				},
				"Cleanup operations completed",
			);
		});

		it("should handle multiple results from same organization", async () => {
			const executionResults: EventGenerationExecutionResult[] = [
				{
					organizationId: "org1",
					eventId: "event1",
					instancesCreated: 5,
					executionTimeMs: 1000,
				},
				{
					organizationId: "org1",
					eventId: "event2",
					instancesCreated: 3,
					executionTimeMs: 800,
				},
				{
					organizationId: "org2",
					eventId: "event3",
					instancesCreated: 2,
					executionTimeMs: 600,
				},
			];

			const metrics: ProcessingMetrics = {
				startTime: Date.now(),
				endTime: Date.now(),
				instancesCreated: 10,
				eventsProcessed: 3,
				organizationsProcessed: 2,
				errorsEncountered: 0,
			};

			const config: PostProcessingConfig = {
				enableCleanup: true,
			};

			const result = await executePostProcessing(
				executionResults,
				metrics,
				config,
				deps,
			);

			expect(result).toEqual({
				cleanupPerformed: true,
				errors: [],
				windowsUpdated: 0,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					organizationsProcessed: 2, // Unique organizations
					totalInstancesCreated: 10,
				},
				"Cleanup operations completed",
			);
		});

		it("should handle cleanup operations throwing errors", async () => {
			const executionResults: EventGenerationExecutionResult[] = [
				{
					organizationId: "org1",
					eventId: "event1",
					instancesCreated: 5,
					executionTimeMs: 1000,
				},
			];

			const metrics: ProcessingMetrics = {
				startTime: Date.now(),
				endTime: Date.now(),
				instancesCreated: 5,
				eventsProcessed: 1,
				organizationsProcessed: 1,
				errorsEncountered: 0,
			};

			const config: PostProcessingConfig = {
				enableCleanup: true,
			};

			// Mock logger.info to throw an error to simulate cleanup failure
			vi.mocked(mockLogger.info).mockImplementation(() => {
				throw new Error("Cleanup failed");
			});

			const result = await executePostProcessing(
				executionResults,
				metrics,
				config,
				deps,
			);

			expect(result).toEqual({
				cleanupPerformed: false,
				errors: ["Post-processing failed: Error: Cleanup failed"],
				windowsUpdated: 0,
			});
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.any(Error),
				"Post-processing failed: Error: Cleanup failed",
			);
		});

		it("should handle cleanup operations throwing non-Error objects", async () => {
			const executionResults: EventGenerationExecutionResult[] = [
				{
					organizationId: "org1",
					eventId: "event1",
					instancesCreated: 5,
					executionTimeMs: 1000,
				},
			];

			const metrics: ProcessingMetrics = {
				startTime: Date.now(),
				endTime: Date.now(),
				instancesCreated: 5,
				eventsProcessed: 1,
				organizationsProcessed: 1,
				errorsEncountered: 0,
			};

			const config: PostProcessingConfig = {
				enableCleanup: true,
			};

			// Mock logger.info to throw a string to simulate cleanup failure
			vi.mocked(mockLogger.info).mockImplementation(() => {
				throw "Cleanup failed with string";
			});

			const result = await executePostProcessing(
				executionResults,
				metrics,
				config,
				deps,
			);

			expect(result).toEqual({
				cleanupPerformed: false,
				errors: ["Post-processing failed: Cleanup failed with string"],
				windowsUpdated: 0,
			});
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Cleanup failed with string",
				"Post-processing failed: Cleanup failed with string",
			);
		});

		it("should calculate unique organizations correctly", async () => {
			const executionResults: EventGenerationExecutionResult[] = [
				{
					organizationId: "org1",
					eventId: "event1",
					instancesCreated: 5,
					executionTimeMs: 1000,
				},
				{
					organizationId: "org1",
					eventId: "event2",
					instancesCreated: 3,
					executionTimeMs: 800,
				},
				{
					organizationId: "org1",
					eventId: "event3",
					instancesCreated: 2,
					executionTimeMs: 600,
				},
			];

			const metrics: ProcessingMetrics = {
				startTime: Date.now(),
				endTime: Date.now(),
				instancesCreated: 10,
				eventsProcessed: 3,
				organizationsProcessed: 1,
				errorsEncountered: 0,
			};

			const config: PostProcessingConfig = {
				enableCleanup: true,
			};

			const result = await executePostProcessing(
				executionResults,
				metrics,
				config,
				deps,
			);

			expect(result).toEqual({
				cleanupPerformed: true,
				errors: [],
				windowsUpdated: 0,
			});
			expect(mockLogger.info).toHaveBeenCalledWith(
				{
					organizationsProcessed: 1, // Only one unique organization
					totalInstancesCreated: 10,
				},
				"Cleanup operations completed",
			);
		});
	});

	describe("createDefaultPostProcessingConfig", () => {
		it("should create default post-processing config", () => {
			const config = createDefaultPostProcessingConfig();

			expect(config).toEqual({
				enableCleanup: true,
			});
		});
	});
});
