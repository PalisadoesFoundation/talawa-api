import { beforeEach, describe, expect, it, vi } from "vitest";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { getRecurringEventInstancesByBaseIds } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

// Mock dependencies
const mockDrizzleClient = {
	query: {
		recurringEventInstancesTable: {
			findMany: vi.fn(),
		},
		eventsTable: {
			findMany: vi.fn(),
		},
		eventExceptionsTable: {
			findMany: vi.fn(),
		},
	},
} as unknown as ServiceDependencies["drizzleClient"];

const mockLogger = {
	error: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
} as unknown as ServiceDependencies["logger"];

describe("getRecurringEventInstancesByBaseIds", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return empty array when baseRecurringEventIds is empty", async () => {
		const result = await getRecurringEventInstancesByBaseIds(
			[],
			mockDrizzleClient,
			mockLogger,
		);
		expect(result).toEqual([]);
		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).not.toHaveBeenCalled();
	});

	it("should return resolved instances for valid base IDs", async () => {
		const baseIds = ["base-1"];
		const mockInstances = [
			{
				id: "inst-1",
				baseRecurringEventId: "base-1",
				actualStartTime: new Date(),
				actualEndTime: new Date(),
			},
		];
		const mockTemplates = [
			{
				id: "base-1",
				name: "Base Event",
			},
		];

		// Setup mocks
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce(
			mockInstances as unknown as (typeof recurringEventInstancesTable.$inferSelect)[],
		);
		vi.mocked(
			mockDrizzleClient.query.eventsTable.findMany,
		).mockResolvedValueOnce(
			mockTemplates as unknown as (typeof eventsTable.$inferSelect)[],
		);
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).mockResolvedValueOnce([]);

		const result = await getRecurringEventInstancesByBaseIds(
			baseIds,
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.id).toBe("inst-1");
		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalled();
	});

	it("should skip instances when base template is not found", async () => {
		const mockInstances = [
			{
				id: "inst-1",
				baseRecurringEventId: "base-missing",
				actualStartTime: new Date(),
				actualEndTime: new Date(),
			},
		];

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce(
			mockInstances as unknown as (typeof recurringEventInstancesTable.$inferSelect)[],
		);
		vi.mocked(
			mockDrizzleClient.query.eventsTable.findMany,
		).mockResolvedValueOnce([]); // No matching templates
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).mockResolvedValueOnce([]);

		const result = await getRecurringEventInstancesByBaseIds(
			["base-missing"],
			mockDrizzleClient,
			mockLogger,
		);

		// Instance should be skipped because template not found
		expect(result).toHaveLength(0);
		expect(mockLogger.warn).toHaveBeenCalled();
	});

	it("should respect the limit parameter", async () => {
		const baseIds = ["base-1"];
		const limit = 5;

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce([]);

		await getRecurringEventInstancesByBaseIds(
			baseIds,
			mockDrizzleClient,
			mockLogger,
			{ limit },
		);

		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 5,
			}),
		);
	});

	it("should respect the includeCancelled parameter", async () => {
		const baseIds = ["base-1"];

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce([]);

		// Case: includeCancelled: false (explicit)
		await getRecurringEventInstancesByBaseIds(
			baseIds,
			mockDrizzleClient,
			mockLogger,
			{ includeCancelled: false },
		);

		// Verify it was called with a where clause (implies filtering)
		const calls = vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const lastCall = calls[calls.length - 1];
		if (!lastCall) throw new Error("lastCall is undefined");
		const lastCallArgs = lastCall[0] as { where?: unknown };
		expect(lastCallArgs).toHaveProperty("where");

		// Stringify the where clause to check for isCancelled=false predicate
		// This is a bit brittle if internal representation changes, but matches user request
		const whereStr = JSON.stringify(lastCallArgs.where);
		expect(whereStr).toContain("isCancelled");
		expect(whereStr).toContain("false");
	});

	it("should NOT filter by isCancelled when includeCancelled is true", async () => {
		const baseIds = ["base-1"];

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce([]);

		await getRecurringEventInstancesByBaseIds(
			baseIds,
			mockDrizzleClient,
			mockLogger,
			{ includeCancelled: true },
		);

		// Get the call arguments
		const calls = vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mock.calls;
		expect(calls.length).toBe(1);

		const firstCall = calls[0];
		if (!firstCall) throw new Error("firstCall is undefined");
		const callArgs = firstCall[0] as { where?: unknown };
		expect(callArgs).toHaveProperty("where");
		const whereStr = JSON.stringify(callArgs.where);
		// When includeCancelled is true, the isCancelled filter should NOT be present
		expect(whereStr).not.toContain("isCancelled");
	});

	it("should respect the excludeInstanceIds parameter", async () => {
		const baseIds = ["base-1"];
		const excludeIds = ["inst-1", "inst-2"];

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce([]);

		await getRecurringEventInstancesByBaseIds(
			baseIds,
			mockDrizzleClient,
			mockLogger,
			{ excludeInstanceIds: excludeIds },
		);

		// Verify the where clause contains the exclusion logic
		const calls = vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const lastCall = calls[calls.length - 1];
		if (!lastCall) throw new Error("lastCall is undefined");
		const lastCallArgs = lastCall[0] as { where?: unknown };

		expect(lastCallArgs).toHaveProperty("where");
		const whereStr = JSON.stringify(lastCallArgs.where);
		// Check that excludeIds are present in the query
		for (const id of excludeIds) {
			expect(whereStr).toContain(id);
		}
	});

	it("should handle multiple base IDs", async () => {
		const baseIds = ["base-1", "base-2"];

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce([]);

		await getRecurringEventInstancesByBaseIds(
			baseIds,
			mockDrizzleClient,
			mockLogger,
		);

		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalled();
	});

	it("should propagate errors and log them", async () => {
		const baseIds = ["base-1"];
		const error = new Error("Database error");

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockRejectedValueOnce(error);

		await expect(
			getRecurringEventInstancesByBaseIds(
				baseIds,
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow(error);

		expect(mockLogger.error).toHaveBeenCalledWith(
			error,
			"Failed to get recurring event instances by base IDs",
		);
	});

	it("should call fetchBaseTemplates and fetchExceptions", async () => {
		const baseIds = ["base-1"];
		const mockInstances = [
			{
				id: "inst-1",
				baseRecurringEventId: "base-1",
				actualStartTime: new Date(),
				actualEndTime: new Date(),
			},
		];

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValueOnce(
			mockInstances as unknown as (typeof recurringEventInstancesTable.$inferSelect)[],
		);
		vi.mocked(
			mockDrizzleClient.query.eventsTable.findMany,
		).mockResolvedValueOnce([]);
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).mockResolvedValueOnce([]);

		await getRecurringEventInstancesByBaseIds(
			baseIds,
			mockDrizzleClient,
			mockLogger,
		);

		// Verify both subsequent data fetching calls were made
		expect(mockDrizzleClient.query.eventsTable.findMany).toHaveBeenCalled();
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).toHaveBeenCalled();
	});
});
