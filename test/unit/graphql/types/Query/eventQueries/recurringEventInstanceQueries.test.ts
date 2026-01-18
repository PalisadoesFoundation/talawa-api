import { describe, expect, it, vi } from "vitest";
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
			limit,
		);

		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 5,
			}),
		);
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
