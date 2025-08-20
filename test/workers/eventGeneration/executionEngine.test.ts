import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import {
	type EventGenerationJob,
	executeBatchEventGeneration,
	executeEventGeneration,
} from "~/src/workers/eventGeneration/executionEngine";
import type { WorkerDependencies } from "~/src/workers/eventGeneration/types";

// Mock the service
vi.mock("~/src/services/eventGeneration", () => ({
	generateInstancesForRecurringEvent: vi.fn(),
}));

import { generateInstancesForRecurringEvent } from "~/src/services/eventGeneration";

describe("executionEngine", () => {
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

	describe("executeEventGeneration", () => {
		it("should execute materialization successfully", async () => {
			const job: EventGenerationJob = {
				organizationId: "org1",
				baseRecurringEventId: "event1",
				windowStartDate: new Date("2024-01-01"),
				windowEndDate: new Date("2024-01-31"),
			};

			const instancesCreated = 5;
			vi.mocked(generateInstancesForRecurringEvent).mockResolvedValue(
				instancesCreated,
			);

			const result = await executeEventGeneration(job, deps);

			expect(result.success).toBe(true);
			expect(result.data).toEqual({
				organizationId: "org1",
				eventId: "event1",
				instancesCreated: 5,
				executionTimeMs: expect.any(Number),
			});
			expect(result.metrics).toEqual({
				startTime: expect.any(Number),
				endTime: expect.any(Number),
				instancesCreated: 5,
				eventsProcessed: 1,
				organizationsProcessed: 1,
				errorsEncountered: 0,
			});
			expect(result.resourceUsage).toEqual({
				memoryUsageMB: 0,
				cpuUsagePercent: 0,
				databaseConnections: 1,
				processingThroughput: expect.any(Number),
			});
		});

		it("should handle materialization errors", async () => {
			const job: EventGenerationJob = {
				organizationId: "org1",
				baseRecurringEventId: "event1",
				windowStartDate: new Date("2024-01-01"),
				windowEndDate: new Date("2024-01-31"),
			};

			const error = new Error("Database connection failed");
			vi.mocked(generateInstancesForRecurringEvent).mockRejectedValue(error);

			const result = await executeEventGeneration(job, deps);

			expect(result.success).toBe(false);
			expect(result.data).toBe(null);
			expect(result.error).toBe("Error: Database connection failed");
			expect(result.metrics).toEqual({
				startTime: expect.any(Number),
				endTime: expect.any(Number),
				instancesCreated: 0,
				eventsProcessed: 0,
				organizationsProcessed: 0,
				errorsEncountered: 1,
			});
			expect(result.resourceUsage).toEqual({
				memoryUsageMB: 0,
				cpuUsagePercent: 0,
				databaseConnections: 0,
				processingThroughput: 0,
			});
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Generation execution failed for org1",
				error,
			);
		});

		it("should call generateInstancesForRecurringEvent with correct parameters", async () => {
			const job: EventGenerationJob = {
				organizationId: "org1",
				baseRecurringEventId: "event1",
				windowStartDate: new Date("2024-01-01"),
				windowEndDate: new Date("2024-01-31"),
			};

			vi.mocked(generateInstancesForRecurringEvent).mockResolvedValue(3);

			await executeEventGeneration(job, deps);

			expect(generateInstancesForRecurringEvent).toHaveBeenCalledWith(
				{
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
					organizationId: "org1",
				},
				mockDrizzleClient,
				mockLogger,
			);
		});
	});

	describe("executeBatchEventGeneration", () => {
		it("should execute batch materialization successfully", async () => {
			const jobs: EventGenerationJob[] = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
				{
					organizationId: "org2",
					baseRecurringEventId: "event2",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			vi.mocked(generateInstancesForRecurringEvent)
				.mockResolvedValueOnce(3)
				.mockResolvedValueOnce(5);

			const result = await executeBatchEventGeneration(jobs, 2, deps);

			expect(result.success).toBe(true);
			expect(result.data).toHaveLength(2);
			expect(result.data?.[0]).toEqual({
				organizationId: "org1",
				eventId: "event1",
				instancesCreated: 3,
				executionTimeMs: expect.any(Number),
			});
			expect(result.data?.[1]).toEqual({
				organizationId: "org2",
				eventId: "event2",
				instancesCreated: 5,
				executionTimeMs: expect.any(Number),
			});
			expect(result.metrics).toEqual({
				startTime: expect.any(Number),
				endTime: expect.any(Number),
				instancesCreated: 8,
				eventsProcessed: 2,
				organizationsProcessed: 2,
				errorsEncountered: 0,
			});
		});

		it("should handle mixed success and failure results", async () => {
			const jobs: EventGenerationJob[] = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
				{
					organizationId: "org2",
					baseRecurringEventId: "event2",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			vi.mocked(generateInstancesForRecurringEvent)
				.mockResolvedValueOnce(3)
				.mockRejectedValueOnce(new Error("Database error"));

			const result = await executeBatchEventGeneration(jobs, 2, deps);

			expect(result.success).toBe(false);
			expect(result.data).toHaveLength(1);
			expect(result.data?.[0]).toEqual({
				organizationId: "org1",
				eventId: "event1",
				instancesCreated: 3,
				executionTimeMs: expect.any(Number),
			});
			expect(result.error).toContain("Error: Database error");
			expect(result.metrics).toEqual({
				startTime: expect.any(Number),
				endTime: expect.any(Number),
				instancesCreated: 3,
				eventsProcessed: 1,
				organizationsProcessed: 1,
				errorsEncountered: 1,
			});
		});

		it("should process jobs in batches with concurrency control", async () => {
			const jobs: EventGenerationJob[] = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
				{
					organizationId: "org2",
					baseRecurringEventId: "event2",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
				{
					organizationId: "org3",
					baseRecurringEventId: "event3",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			const maxConcurrency = 2;
			vi.mocked(generateInstancesForRecurringEvent)
				.mockResolvedValueOnce(2)
				.mockResolvedValueOnce(3)
				.mockResolvedValueOnce(4);

			const result = await executeBatchEventGeneration(
				jobs,
				maxConcurrency,
				deps,
			);

			expect(result.success).toBe(true);
			expect(result.data).toHaveLength(3);
			expect(result.metrics.instancesCreated).toBe(9);
			expect(result.resourceUsage.databaseConnections).toBe(2); // Limited by maxConcurrency
		});

		it("should handle empty job array", async () => {
			const jobs: EventGenerationJob[] = [];

			const result = await executeBatchEventGeneration(jobs, 2, deps);

			expect(result.success).toBe(true);
			expect(result.data).toHaveLength(0);
			expect(result.metrics).toEqual({
				startTime: expect.any(Number),
				endTime: expect.any(Number),
				instancesCreated: 0,
				eventsProcessed: 0,
				organizationsProcessed: 0,
				errorsEncountered: 0,
			});
		});

		it("should calculate processing throughput correctly", async () => {
			const jobs: EventGenerationJob[] = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			vi.mocked(generateInstancesForRecurringEvent).mockResolvedValue(10);

			const result = await executeBatchEventGeneration(jobs, 1, deps);

			expect(result.success).toBe(true);
			expect(result.resourceUsage.processingThroughput).toBeGreaterThan(0);
			expect(result.metrics.instancesCreated).toBe(10);
		});

		it("should handle all jobs failing", async () => {
			const jobs: EventGenerationJob[] = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
				{
					organizationId: "org2",
					baseRecurringEventId: "event2",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			vi.mocked(generateInstancesForRecurringEvent)
				.mockRejectedValueOnce(new Error("Error 1"))
				.mockRejectedValueOnce(new Error("Error 2"));

			const result = await executeBatchEventGeneration(jobs, 2, deps);

			expect(result.success).toBe(false);
			expect(result.data).toHaveLength(0);
			expect(result.error).toContain("Error 1");
			expect(result.error).toContain("Error 2");
			expect(result.metrics.errorsEncountered).toBe(2);
		});
	});
});
