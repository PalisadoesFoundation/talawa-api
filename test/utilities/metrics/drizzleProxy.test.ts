/**
 * Tests for Drizzle proxy wrapper that automatically tracks database operations.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createMockDrizzleClient } from "test/_Mocks_/drizzleClientMock";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as drizzleSchema from "~/src/drizzle/schema";
import { wrapDrizzleWithMetrics } from "~/src/utilities/metrics/drizzleProxy";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

type DrizzleClient = PostgresJsDatabase<typeof drizzleSchema>;

describe("wrapDrizzleWithMetrics", () => {
	let mockClient: ReturnType<typeof createMockDrizzleClient>;
	let mockPerf: ReturnType<typeof createPerformanceTracker>;
	let getPerf: () => typeof mockPerf | undefined;

	beforeEach(() => {
		vi.clearAllMocks();
		mockClient = createMockDrizzleClient();
		mockPerf = createPerformanceTracker();
		getPerf = () => mockPerf;
	});

	describe("Zero Overhead", () => {
		it("should return original client when perf is undefined", () => {
			const getPerfUndefined = () => undefined;
			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfUndefined,
			);

			// Should be the same reference (no wrapping occurred)
			expect(wrapped).toBe(mockClient);
		});

		it("should return original client when perf getter returns undefined", () => {
			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				() => undefined,
			);

			expect(wrapped).toBe(mockClient);
		});
	});

	describe("Query Operations", () => {
		it("should track findFirst operations", async () => {
			const mockUser = { id: "1", email: "test@example.com" };
			vi.mocked(mockClient.query.usersTable.findFirst).mockResolvedValue(
				mockUser as never,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			const result = await wrapped.query.usersTable.findFirst({});

			expect(result).toBe(mockUser);
			expect(mockClient.query.usersTable.findFirst).toHaveBeenCalled();

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:query.usersTable.findFirst"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
				expect(op.ms).toBeGreaterThanOrEqual(0);
				expect(typeof op.ms).toBe("number");
			}
		});

		it("should track findMany operations", async () => {
			const mockUsers = [
				{ id: "1", email: "test1@example.com" },
				{ id: "2", email: "test2@example.com" },
			];
			vi.mocked(mockClient.query.usersTable.findMany).mockResolvedValue(
				mockUsers as never,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			const result = await wrapped.query.usersTable.findMany({});

			expect(result).toBe(mockUsers);
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:query.usersTable.findMany"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});

		// Note: insert, update, delete are not methods on query tables in real Drizzle
		// They are builder methods on the client level (client.insert(table).values(...))
		// The proxy handles these via wrapBuilderMethod for client-level operations

		it("should track multiple operations on same table", async () => {
			vi.mocked(mockClient.query.usersTable.findFirst).mockResolvedValue(
				{} as never,
			);
			vi.mocked(mockClient.query.usersTable.findMany).mockResolvedValue(
				[] as never,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			await wrapped.query.usersTable.findFirst({});
			await wrapped.query.usersTable.findMany({});

			const snapshot = mockPerf.snapshot();
			const op1 = snapshot.ops["db:query.usersTable.findFirst"];
			const op2 = snapshot.ops["db:query.usersTable.findMany"];
			if (op1 && op2) {
				expect(op1.count).toBe(1);
				expect(op2.count).toBe(1);
			}
			expect(snapshot.totalOps).toBe(2);
		});

		it("should track operations on different tables", async () => {
			vi.mocked(mockClient.query.usersTable.findFirst).mockResolvedValue(
				{} as never,
			);
			vi.mocked(
				mockClient.query.organizationsTable.findFirst,
			).mockResolvedValue({} as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			await wrapped.query.usersTable.findFirst({});
			await wrapped.query.organizationsTable.findFirst({});

			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:query.usersTable.findFirst"]).toBeDefined();
			expect(
				snapshot.ops["db:query.organizationsTable.findFirst"],
			).toBeDefined();
			expect(snapshot.totalOps).toBe(2);
		});
	});

	describe("Execute Method", () => {
		it("should track execute operations", async () => {
			const mockExecute = vi.fn().mockResolvedValue({ rows: [] });
			(mockClient as { execute?: typeof mockExecute }).execute = mockExecute;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			await wrapped.execute("SELECT 1");

			expect(mockExecute).toHaveBeenCalledWith("SELECT 1");
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:execute"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});
	});

	describe("Operation Names", () => {
		it("should use descriptive operation names", async () => {
			vi.mocked(mockClient.query.usersTable.findFirst).mockResolvedValue(
				{} as never,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			await wrapped.query.usersTable.findFirst({});

			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:query.usersTable.findFirst"]).toBeDefined();
		});

		it("should use correct operation name format", async () => {
			vi.mocked(mockClient.query.organizationsTable.findMany).mockResolvedValue(
				[] as never,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			await wrapped.query.organizationsTable.findMany({});

			const snapshot = mockPerf.snapshot();
			const opName = "db:query.organizationsTable.findMany";
			expect(snapshot.ops[opName]).toBeDefined();
		});
	});

	describe("Timing Accuracy", () => {
		it("should track operation duration accurately", async () => {
			// Simulate a slow operation
			vi.mocked(mockClient.query.usersTable.findFirst).mockImplementation(
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 50));
					return {} as never;
				},
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);
			await wrapped.query.usersTable.findFirst({});

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:query.usersTable.findFirst"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.ms).toBeGreaterThanOrEqual(50);
				expect(op.max).toBeGreaterThanOrEqual(50);
				expect(typeof op.ms).toBe("number");
				expect(typeof op.max).toBe("number");
			}
		});
	});

	describe("Error Handling", () => {
		it("should propagate errors from database operations", async () => {
			const dbError = new Error("Database connection failed");
			vi.mocked(mockClient.query.usersTable.findFirst).mockRejectedValue(
				dbError,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			await expect(wrapped.query.usersTable.findFirst({})).rejects.toThrow(
				"Database connection failed",
			);

			// Operation should still be tracked even if it failed
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:query.usersTable.findFirst"]).toBeDefined();
		});
	});

	describe("Perf Getter Function", () => {
		it("should call getPerf function at runtime for each operation", async () => {
			const getPerfSpy = vi.fn(() => mockPerf);
			vi.mocked(mockClient.query.usersTable.findFirst).mockResolvedValue(
				{} as never,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfSpy,
			);
			await wrapped.query.usersTable.findFirst({});
			await wrapped.query.usersTable.findFirst({});

			// getPerf should be called for each operation
			expect(getPerfSpy).toHaveBeenCalledTimes(2);
		});

		it("should handle getPerf returning undefined mid-request", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				// Return undefined on second call
				return callCount === 2 ? undefined : mockPerf;
			};

			vi.mocked(mockClient.query.usersTable.findFirst).mockResolvedValue(
				{} as never,
			);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfDynamic,
			);
			await wrapped.query.usersTable.findFirst({}); // First call - tracked
			await wrapped.query.usersTable.findFirst({}); // Second call - not tracked

			const snapshot = mockPerf.snapshot();
			// Only first operation should be tracked
			const op = snapshot.ops["db:query.usersTable.findFirst"];
			if (op) {
				expect(op.count).toBe(1);
			}
		});
	});

	describe("Non-Query Properties", () => {
		it("should preserve non-query properties", () => {
			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Properties like query should be accessible
			expect(wrapped).toHaveProperty("query");
			// Other properties should be preserved
			expect(wrapped).toHaveProperty("select");
		});

		it("should return non-query properties as-is", () => {
			const mockProperty = { custom: "value" };
			(mockClient as { customProperty?: typeof mockProperty }).customProperty =
				mockProperty;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Non-query properties should be returned as-is
			expect(
				(wrapped as { customProperty?: typeof mockProperty }).customProperty,
			).toBe(mockProperty);
		});
	});

	describe("Query Object Edge Cases", () => {
		it("should handle non-table properties on query object", () => {
			const mockQueryProperty = { custom: "value" };
			(
				mockClient.query as { customProperty?: typeof mockQueryProperty }
			).customProperty = mockQueryProperty;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Non-table properties should be returned as-is
			expect(
				(wrapped.query as { customProperty?: typeof mockQueryProperty })
					.customProperty,
			).toBe(mockQueryProperty);
		});

		it("should handle falsy table values", () => {
			// Create a query object with a null/undefined table
			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Accessing a non-existent table should return undefined
			const nonExistent = (wrapped.query as { nonExistentTable?: unknown })
				.nonExistentTable;
			expect(nonExistent).toBeUndefined();
		});
	});

	describe("Table Methods Edge Cases", () => {
		it("should handle non-function properties on table", () => {
			const mockTableProperty = { custom: "value" };
			(
				mockClient.query.usersTable as {
					customProperty?: typeof mockTableProperty;
				}
			).customProperty = mockTableProperty;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Non-function properties should be returned as-is
			expect(
				(
					wrapped.query.usersTable as {
						customProperty?: typeof mockTableProperty;
					}
				).customProperty,
			).toBe(mockTableProperty);
		});
	});

	describe("Builder Methods", () => {
		it("should handle builder methods that return non-promise values", () => {
			const mockBuilder = { from: vi.fn() };
			vi.mocked(mockClient.select).mockReturnValue(mockBuilder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			const result = wrapped.select();

			// Builder should be returned as-is when not a promise
			expect(result).toBe(mockBuilder);
		});

		it("should track builder methods that return promises", async () => {
			const mockPromise = Promise.resolve([]);
			vi.mocked(mockClient.select).mockReturnValue(mockPromise as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			const result = await wrapped.select();

			expect(result).toEqual([]);
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:select"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});

		it("should handle builder methods when perf becomes undefined", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				return callCount === 1 ? mockPerf : undefined;
			};

			const mockPromise = Promise.resolve([]);
			vi.mocked(mockClient.select).mockReturnValue(mockPromise as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfDynamic,
			);

			await wrapped.select(); // First call - tracked
			const result = await wrapped.select(); // Second call - not tracked

			expect(result).toEqual([]);
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:select"];
			if (op) {
				expect(op.count).toBe(1);
			}
		});
	});

	describe("Execute Method Edge Cases", () => {
		it("should handle execute when perf becomes undefined", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				return callCount === 1 ? mockPerf : undefined;
			};

			const mockExecute = vi.fn().mockResolvedValue({ rows: [] });
			(mockClient as { execute?: typeof mockExecute }).execute = mockExecute;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfDynamic,
			);

			await wrapped.execute("SELECT 1"); // First call - tracked
			await wrapped.execute("SELECT 2"); // Second call - not tracked

			expect(mockExecute).toHaveBeenCalledTimes(2);
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:execute"];
			if (op) {
				expect(op.count).toBe(1);
			}
		});
	});
});
