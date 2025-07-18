import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import {
	type MaterializationJob,
	executeBatchMaterialization,
	executeMaterialization,
} from "~/src/workers/eventMaterialization/executionEngine";
import type { WorkerDependencies } from "~/src/workers/eventMaterialization/types";

// Mock the service
vi.mock("~/src/services/eventInstanceMaterialization", () => ({
	materializeInstancesForRecurringEvent: vi.fn(),
}));

import { materializeInstancesForRecurringEvent } from "~/src/services/eventInstanceMaterialization";

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

	describe("executeMaterialization", () => {
		it("should execute materialization successfully", async () => {
			const job: MaterializationJob = {
				organizationId: "org1",
				baseRecurringEventId: "event1",
				windowStartDate: new Date("2024-01-01"),
				windowEndDate: new Date("2024-01-31"),
			};

			const instancesCreated = 5;
			vi.mocked(materializeInstancesForRecurringEvent).mockResolvedValue(
				instancesCreated,
			);

			const result = await executeMaterialization(job, deps);

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
			const job: MaterializationJob = {
				organizationId: "org1",
				baseRecurringEventId: "event1",
				windowStartDate: new Date("2024-01-01"),
				windowEndDate: new Date("2024-01-31"),
			};

			const error = new Error("Database connection failed");
			vi.mocked(materializeInstancesForRecurringEvent).mockRejectedValue(error);

			const result = await executeMaterialization(job, deps);

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
				"Materialization execution failed for org1",
				error,
			);
		});

		it("should call materializeInstancesForRecurringEvent with correct parameters", async () => {
			const job: MaterializationJob = {
				organizationId: "org1",
				baseRecurringEventId: "event1",
				windowStartDate: new Date("2024-01-01"),
				windowEndDate: new Date("2024-01-31"),
			};

			vi.mocked(materializeInstancesForRecurringEvent).mockResolvedValue(3);

			await executeMaterialization(job, deps);

			expect(materializeInstancesForRecurringEvent).toHaveBeenCalledWith(
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

		it("should calculate execution time correctly", async () => {
			const job: MaterializationJob = {
				organizationId: "org1",
				baseRecurringEventId: "event1",
				windowStartDate: new Date("2024-01-01"),
				windowEndDate: new Date("2024-01-31"),
			};

			const delay = 100;
			vi.mocked(materializeInstancesForRecurringEvent).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(2), delay)),
			);

			const result = await executeMaterialization(job, deps);

			expect(result.data?.executionTimeMs).toBeGreaterThanOrEqual(delay);
			expect(
				result.metrics.endTime - result.metrics.startTime,
			).toBeGreaterThanOrEqual(delay);
		});
	});

	describe("executeBatchMaterialization", () => {
		it("should execute batch materialization successfully", async () => {
			const jobs: MaterializationJob[] = [
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

			vi.mocked(materializeInstancesForRecurringEvent)
				.mockResolvedValueOnce(3)
				.mockResolvedValueOnce(5);

			const result = await executeBatchMaterialization(jobs, 2, deps);

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
			const jobs: MaterializationJob[] = [
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

			vi.mocked(materializeInstancesForRecurringEvent)
				.mockResolvedValueOnce(3)
				.mockRejectedValueOnce(new Error("Database error"));

			const result = await executeBatchMaterialization(jobs, 2, deps);

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
			const jobs: MaterializationJob[] = [
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
			vi.mocked(materializeInstancesForRecurringEvent)
				.mockResolvedValueOnce(2)
				.mockResolvedValueOnce(3)
				.mockResolvedValueOnce(4);

			const result = await executeBatchMaterialization(
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
			const jobs: MaterializationJob[] = [];

			const result = await executeBatchMaterialization(jobs, 2, deps);

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
			const jobs: MaterializationJob[] = [
				{
					organizationId: "org1",
					baseRecurringEventId: "event1",
					windowStartDate: new Date("2024-01-01"),
					windowEndDate: new Date("2024-01-31"),
				},
			];

			vi.mocked(materializeInstancesForRecurringEvent).mockResolvedValue(10);

			const result = await executeBatchMaterialization(jobs, 1, deps);

			expect(result.success).toBe(true);
			expect(result.resourceUsage.processingThroughput).toBeGreaterThan(0);
			expect(result.metrics.instancesCreated).toBe(10);
		});

		it("should handle all jobs failing", async () => {
			const jobs: MaterializationJob[] = [
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

			vi.mocked(materializeInstancesForRecurringEvent)
				.mockRejectedValueOnce(new Error("Error 1"))
				.mockRejectedValueOnce(new Error("Error 2"));

			const result = await executeBatchMaterialization(jobs, 2, deps);

			expect(result.success).toBe(false);
			expect(result.data).toHaveLength(0);
			expect(result.error).toContain("Error 1");
			expect(result.error).toContain("Error 2");
			expect(result.metrics.errorsEncountered).toBe(2);
		});
	});
});
