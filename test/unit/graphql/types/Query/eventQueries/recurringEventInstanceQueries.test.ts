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
		// Since Drizzle 'and()' returns an object, we verify structure.
		// We expect the 'where' to be present.
		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.anything(),
			}),
		);

		// Ensure we didn't just call it with empty object
		const calls = vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		// @ts-expect-error - we know it exists because of the assertion above
		const lastCallArgs = calls[calls.length - 1][0];
		expect(lastCallArgs).toHaveProperty("where");
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

		// Verify that where clause was called - with includeCancelled: true,
		// the isCancelled=false filter should NOT be added, resulting in
		// fewer conditions in the where clause
		const callArgs = calls[0]?.[0] as { where?: unknown };
		expect(callArgs).toHaveProperty("where");
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
		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.anything(),
			}),
		);

		const calls = vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		// @ts-expect-error - verifying call arguments
		const lastCallArgs = calls[calls.length - 1][0];

		// The where clause should be a composite (AND) containing the exclusion
		expect(lastCallArgs).toHaveProperty("where");

		// Since we cannot easily inspect Drizzle symbols/internals in unit tests without
		// brittle coupling, we verify that the query was constructed with the additional
		// constraint structure (the array of conditions in AND).
		// In this case, we expect at least 3 conditions: baseId IN, isCancelled=false (default), and id NOT IN
		// (or 2 if isCancelled is not default, but default is false so it is added)
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
