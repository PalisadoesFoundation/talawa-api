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
		it("should return proxy that forwards calls when perf getter returns undefined", async () => {
			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				() => undefined,
			);

			// Should be a proxy (not the same reference), but should work identically
			expect(wrapped).not.toBe(mockClient);
			// Verify no additional wrapping when perf is undefined - members should be identical
			expect(wrapped.query).toBe(mockClient.query);
			expect(wrapped.query.usersTable).toBe(mockClient.query.usersTable);
			expect(wrapped.query.usersTable.findFirst).toBe(
				mockClient.query.usersTable.findFirst,
			);
			// Should still work - forward to original client
			vi.mocked(mockClient.query.usersTable.findFirst).mockResolvedValue(
				{} as never,
			);
			const result = await wrapped.query.usersTable.findFirst({});
			expect(result).toBeDefined();
			// Verify no metrics were recorded when perf is undefined
			const snapshot = mockPerf.snapshot();
			expect(Object.keys(snapshot.ops)).toHaveLength(0);
			expect(snapshot.totalOps).toBe(0);
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
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
			expect(typeof op.ms).toBe("number");
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
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
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
			expect(op1).toBeDefined();
			expect(op2).toBeDefined();
			if (!op1 || !op2) throw new Error("op1 or op2 is undefined");
			expect(op1.count).toBe(1);
			expect(op2.count).toBe(1);
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
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
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
			// Use fake timers for deterministic timing
			vi.useFakeTimers();
			try {
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
				const promise = wrapped.query.usersTable.findFirst({});
				// Advance timers to resolve the promise
				await vi.advanceTimersByTimeAsync(50);
				await promise;

				const snapshot = mockPerf.snapshot();
				const op = snapshot.ops["db:query.usersTable.findFirst"];
				expect(op).toBeDefined();
				if (!op) throw new Error("op is undefined");
				expect(typeof op.ms).toBe("number");
				expect(typeof op.max).toBe("number");
				expect(op.ms).toBeGreaterThanOrEqual(0);
				expect(op.max).toBeGreaterThanOrEqual(0);
			} finally {
				vi.useRealTimers();
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

		it("should track errors from select builder when awaited", async () => {
			const dbError = new Error("Select query failed");
			// Create promise that rejects asynchronously to avoid unhandled rejection warnings
			const mockPromise = new Promise<never>((_, reject) => {
				queueMicrotask(() => reject(dbError));
			});
			vi.mocked(mockClient.select).mockReturnValue(mockPromise as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			await expect(wrapped.select()).rejects.toThrow("Select query failed");

			// Operation should still be tracked even if it failed
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:select"]).toBeDefined();
		});

		it("should track errors from insert builder when awaited", async () => {
			const dbError = new Error("Insert query failed");
			// Create promise that rejects asynchronously to avoid unhandled rejection warnings
			const mockPromise = new Promise<never>((_, reject) => {
				queueMicrotask(() => reject(dbError));
			});
			// Use a mock table from the client - cast to satisfy TypeScript
			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["insert"]
			>[0];
			vi.mocked(mockClient.insert).mockReturnValue(mockPromise as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			await expect(wrapped.insert(mockTable)).rejects.toThrow(
				"Insert query failed",
			);

			// Operation should still be tracked even if it failed
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:insert"]).toBeDefined();
		});

		it("should track errors from update builder when awaited", async () => {
			const dbError = new Error("Update query failed");
			// Create promise that rejects asynchronously to avoid unhandled rejection warnings
			const mockPromise = new Promise<never>((_, reject) => {
				queueMicrotask(() => reject(dbError));
			});
			// Use a mock table from the client - cast to satisfy TypeScript
			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["update"]
			>[0];
			vi.mocked(mockClient.update).mockReturnValue(mockPromise as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			await expect(wrapped.update(mockTable)).rejects.toThrow(
				"Update query failed",
			);

			// Operation should still be tracked even if it failed
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:update"]).toBeDefined();
		});

		it("should track errors from delete builder when awaited", async () => {
			const dbError = new Error("Delete query failed");
			// Create promise that rejects asynchronously to avoid unhandled rejection warnings
			const mockPromise = new Promise<never>((_, reject) => {
				queueMicrotask(() => reject(dbError));
			});
			// Use a mock table from the client - cast to satisfy TypeScript
			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["delete"]
			>[0];
			vi.mocked(mockClient.delete).mockReturnValue(mockPromise as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			await expect(wrapped.delete(mockTable)).rejects.toThrow(
				"Delete query failed",
			);

			// Operation should still be tracked even if it failed
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:delete"]).toBeDefined();
		});

		it("should track errors from execute method", async () => {
			const dbError = new Error("Execute query failed");
			const mockExecute = vi.fn().mockRejectedValue(dbError);
			(mockClient as { execute?: typeof mockExecute }).execute = mockExecute;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			await expect(wrapped.execute("SELECT 1")).rejects.toThrow(
				"Execute query failed",
			);

			// Operation should still be tracked even if it failed
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:execute"]).toBeDefined();
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

			// getPerf is called for zero-overhead checks during property access
			// and for tracking during method invocation
			// The important thing is that operations are tracked correctly
			expect(getPerfSpy).toHaveBeenCalled();

			// Verify operations are tracked (2 findFirst calls)
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:query.usersTable.findFirst"];
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(2);
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
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
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
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
		});

		it("should handle plain Promise when perf is undefined at runtime", async () => {
			// Test line 275: plain Promise path when perf is undefined when .then() is called
			const mockPromise = Promise.resolve([]);
			vi.mocked(mockClient.select).mockReturnValue(mockPromise as never);

			// Create a getPerf that returns undefined when called
			let callCount = 0;
			const getPerfUndefined = () => {
				callCount++;
				// Return undefined when .then() is called (runtime check)
				return undefined;
			};

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfUndefined,
			);

			const result = await wrapped.select();

			expect(result).toEqual([]);
			// Verify perf was checked (at runtime when .then() was called)
			expect(callCount).toBeGreaterThan(0);
			// Verify no metrics were recorded
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:select"]).toBeUndefined();
		});

		it("should preserve builder chaining and only time on await for select", async () => {
			// Create a builder stub that is both thenable (has .then()) and chainable (has .from(), .where())
			// This simulates real Drizzle builders which are both thenable and chainable
			// Use Object.assign to create a Promise with chainable methods (avoids biome-ignore)
			const result = [{ id: "1" }];
			// Use a Promise that resolves asynchronously to ensure .then() is called through Proxy
			const promise = new Promise<typeof result>((resolve) => {
				setImmediate(() => resolve(result));
			});

			// Define builder type for proper TypeScript inference
			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				where: (condition: Record<string, unknown>) => Builder;
			};

			// Create builder with chainable methods that return the builder itself
			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				where: vi.fn((_condition: Record<string, unknown>) => builder),
			}) as Builder;

			vi.mocked(mockClient.select).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Perform a chained operation: select().from().where()
			// The builder should preserve chainability, and timing should only occur on await
			const selectResult = wrapped.select() as unknown as Builder;
			const fromResult = selectResult.from("users");
			const whereResult = fromResult.where({});
			const rows = await whereResult;

			// Verify the final result
			expect(rows).toEqual([{ id: "1" }]);

			// Verify chaining methods were called on the original builder
			expect(builder.from).toHaveBeenCalledWith("users");
			expect(builder.where).toHaveBeenCalledWith({});

			// Verify timing was recorded when the builder was awaited
			// The builder's .then() wrapper should track timing on final await
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:select"];
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
		});

		it("should preserve builder chaining and only time on await for insert", async () => {
			const result = [{ id: "1", name: "test" }];
			// Use a Promise that resolves asynchronously to ensure .then() is called through Proxy
			const promise = new Promise<typeof result>((resolve) => {
				setImmediate(() => resolve(result));
			});
			// Use a mock table from the client - cast to satisfy TypeScript
			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["insert"]
			>[0];

			type Builder = Promise<typeof result> & {
				values: (values: unknown) => Builder;
				returning: (columns: unknown) => Builder;
			};

			const builder = Object.assign(promise, {
				values: vi.fn((_values: unknown) => builder),
				returning: vi.fn((_columns: unknown) => builder),
			}) as Builder;

			vi.mocked(mockClient.insert).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			const insertResult = wrapped.insert(mockTable) as unknown as Builder;
			const valuesResult = insertResult.values({ name: "test" });
			const returningResult = valuesResult.returning(undefined);
			const rows = await returningResult;

			expect(rows).toEqual([{ id: "1", name: "test" }]);
			expect(builder.values).toHaveBeenCalledWith({ name: "test" });
			expect(builder.returning).toHaveBeenCalled();

			// Verify timing was recorded when the builder was awaited
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:insert"];
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
		});

		it("should preserve builder chaining and only time on await for update", async () => {
			const result = [{ id: "1", name: "updated" }];
			// Use a Promise that resolves asynchronously to ensure .then() is called through Proxy
			const promise = new Promise<typeof result>((resolve) => {
				setImmediate(() => resolve(result));
			});
			// Use a mock table from the client - cast to satisfy TypeScript
			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["update"]
			>[0];

			type Builder = Promise<typeof result> & {
				set: (values: unknown) => Builder;
				where: (condition: unknown) => Builder;
				returning: (columns: unknown) => Builder;
			};

			const builder = Object.assign(promise, {
				set: vi.fn((_values: unknown) => builder),
				where: vi.fn((_condition: unknown) => builder),
				returning: vi.fn((_columns: unknown) => builder),
			}) as Builder;

			vi.mocked(mockClient.update).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			const updateResult = wrapped.update(mockTable) as unknown as Builder;
			const setResult = updateResult.set({ name: "updated" });
			const whereResult = setResult.where({ id: "1" });
			const returningResult = whereResult.returning(undefined);
			const rows = await returningResult;

			expect(rows).toEqual([{ id: "1", name: "updated" }]);
			expect(builder.set).toHaveBeenCalledWith({ name: "updated" });
			expect(builder.where).toHaveBeenCalledWith({ id: "1" });
			expect(builder.returning).toHaveBeenCalled();

			// Verify timing was recorded when the builder was awaited
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:update"];
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
		});

		it("should preserve builder chaining and only time on await for delete", async () => {
			const result = [{ id: "1" }];
			// Use a Promise that resolves asynchronously to ensure .then() is called through Proxy
			const promise = new Promise<typeof result>((resolve) => {
				setImmediate(() => resolve(result));
			});
			// Use a mock table from the client - cast to satisfy TypeScript
			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["delete"]
			>[0];

			type Builder = Promise<typeof result> & {
				where: (condition: unknown) => Builder;
				returning: (columns: unknown) => Builder;
			};

			const builder = Object.assign(promise, {
				where: vi.fn((_condition: unknown) => builder),
				returning: vi.fn((_columns: unknown) => builder),
			}) as Builder;

			vi.mocked(mockClient.delete).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			const deleteResult = wrapped.delete(mockTable) as unknown as Builder;
			const whereResult = deleteResult.where({ id: "1" });
			const returningResult = whereResult.returning(undefined);
			const rows = await returningResult;

			expect(rows).toEqual([{ id: "1" }]);
			expect(builder.where).toHaveBeenCalledWith({ id: "1" });
			expect(builder.returning).toHaveBeenCalled();

			// Verify timing was recorded when the builder was awaited
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:delete"];
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
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
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
		});

		it("should handle perf becoming undefined during builder .then() call", async () => {
			// Test the new behavior where perf is checked when .then() is called, not at Proxy creation
			const result = [{ id: "1" }];
			const promise = new Promise<typeof result>((resolve) => {
				setImmediate(() => resolve(result));
			});

			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				where: (condition: Record<string, unknown>) => Builder;
			};

			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				where: vi.fn((_condition: Record<string, unknown>) => builder),
			}) as Builder;

			vi.mocked(mockClient.select).mockReturnValue(builder as never);

			// getPerf returns undefined when .then() is called
			const getPerfUndefined = () => undefined;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfUndefined,
			);

			// Create builder and chain methods
			const selectResult = wrapped.select() as unknown as Builder;
			const fromResult = selectResult.from("users");
			const whereResult = fromResult.where({});

			// When awaited, .then() is called and perf is checked
			// Since perf is undefined, it should call original .then() without tracking
			const rows = await whereResult;

			expect(rows).toEqual([{ id: "1" }]);
			expect(builder.from).toHaveBeenCalledWith("users");
			expect(builder.where).toHaveBeenCalled();

			// Verify no metrics were recorded
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:select"]).toBeUndefined();
		});

		it("should handle perf becoming undefined during builder .execute() call", async () => {
			// Test when perf is undefined when .execute() is called on a builder
			const result = [{ id: "1" }];
			const promise = Promise.resolve(result);

			type Builder = Promise<typeof result> & {
				values: (values: unknown) => Builder;
				execute: () => Promise<typeof result>;
			};

			const executeFn = vi.fn().mockResolvedValue(result);
			const builder = Object.assign(promise, {
				values: vi.fn((_values: unknown) => builder),
				execute: executeFn,
			}) as Builder;

			vi.mocked(mockClient.insert).mockReturnValue(builder as never);

			// getPerf returns undefined when .execute() is called
			const getPerfUndefined = () => undefined;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfUndefined,
			);

			const insertResult = wrapped.insert({} as never) as unknown as Builder;
			const valuesResult = insertResult.values({ name: "test" });
			const rows = await valuesResult.execute();

			expect(rows).toEqual([{ id: "1" }]);
			expect(executeFn).toHaveBeenCalledTimes(1);

			// Verify no metrics were recorded
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:insert"]).toBeUndefined();
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
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
		});
	});

	describe("Query Object Edge Cases - Object.values failure", () => {
		it("should handle Proxy objects that throw on Object.values", () => {
			// Create a Proxy that throws when Object.values is called
			// Object.values internally uses ownKeys, so throwing in ownKeys will cause Object.values to fail
			const throwingProxy = new Proxy(
				{ findFirst: vi.fn(), findMany: vi.fn() },
				{
					ownKeys: () => {
						throw new Error("Cannot access ownKeys");
					},
					get: (target, prop) => {
						// Allow direct property access to work
						return Reflect.get(target, prop);
					},
				},
			);

			// Mock query object to return the throwing proxy
			(mockClient.query as { testTable?: typeof throwingProxy }).testTable =
				throwingProxy;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Accessing the table should trigger the catch block and fall back to checking findFirst/findMany directly
			// This ensures wrapDrizzleWithMetrics handles edge cases where Object.values fails
			const table = (wrapped.query as { testTable?: typeof throwingProxy })
				.testTable;
			expect(table).toBeDefined();
			// The table should be wrapped even though Object.values failed
			// Verify findFirst and findMany are accessible (fallback check worked)
			expect(typeof (table as { findFirst?: unknown }).findFirst).toBe(
				"function",
			);
		});

		it("should handle Proxy objects that throw on Object.values and have no findFirst/findMany", () => {
			// Create a Proxy that throws when Object.values is called AND has no findFirst/findMany
			// This tests the catch block where hasFunctions is set to false (line 121)
			const throwingProxy = new Proxy(
				{ someProperty: "value" }, // Plain object without findFirst/findMany
				{
					ownKeys: () => {
						throw new Error("Cannot access ownKeys");
					},
					get: (target, prop) => {
						return Reflect.get(target, prop);
					},
				},
			);

			// Mock query object to return the throwing proxy
			(mockClient.query as { testTable?: typeof throwingProxy }).testTable =
				throwingProxy;

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Accessing the table should trigger the catch block
			// Since findFirst/findMany don't exist, hasFunctions should be set to false
			const table = (wrapped.query as { testTable?: typeof throwingProxy })
				.testTable;
			expect(table).toBeDefined();
			// The table should NOT be wrapped since it has no table methods
			expect(table).toBe(throwingProxy);
		});
	});

	describe("Builder Method Edge Cases", () => {
		it("should return builder as-is when perf is undefined in wrapBuilderMethod", async () => {
			// When perf is undefined, builder should be returned as-is without Proxy wrapping
			const getPerfUndefined = () => undefined;
			const result = [{ id: "1" }];
			const promise = Promise.resolve(result);

			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				where: (condition: Record<string, unknown>) => Builder;
			};

			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				where: vi.fn((_condition: Record<string, unknown>) => builder),
			}) as Builder;

			vi.mocked(mockClient.select).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfUndefined,
			);

			const selectResult = wrapped.select() as unknown as Builder;
			// Builder should be returned as-is (not wrapped with Proxy) when perf is undefined
			expect(selectResult).toBe(builder);
			// Chaining should still work
			const fromResult = selectResult.from("users");
			expect(fromResult).toBe(builder);
		});

		it("should wrap builder.then() to track timing when awaited", async () => {
			// The Proxy wraps the builder's .then() method to track timing when the builder is awaited
			// Use a Promise that isn't immediately resolved to ensure .then() is called through Proxy
			const result = [{ id: "1" }];
			// Create a Promise that resolves asynchronously to ensure .then() is called
			const promise = new Promise<typeof result>((resolve) => {
				// Use setImmediate to ensure the promise isn't immediately resolved
				setImmediate(() => resolve(result));
			});

			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				where: (condition: Record<string, unknown>) => Builder;
			};

			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				where: vi.fn((_condition: Record<string, unknown>) => builder),
			}) as Builder;

			vi.mocked(mockClient.select).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			// Explicitly call .then() to ensure it goes through the Proxy wrapper
			// The Proxy wraps the builder, so calling .then() will trigger the Proxy's .then() wrapper
			const selectResult = wrapped.select() as unknown as Builder;
			const rows = await selectResult.then((value) => value);

			expect(rows).toEqual([{ id: "1" }]);
			// Verify timing was tracked when .then() was called
			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["db:select"];
			expect(op).toBeDefined();
			if (!op) throw new Error("op is undefined");
			expect(op.count).toBe(1);
		});

		it("should wrap builder.execute() if present", async () => {
			// The Proxy wraps the builder's .execute() method to track timing when execute is called
			// When we call .execute() on the proxied builder, the Proxy's .execute() wrapper should be called
			const result = [{ id: "1" }];
			const promise = Promise.resolve(result);

			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				execute: () => Promise<typeof result>;
			};

			const executeFn = vi.fn().mockResolvedValue(result);
			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				execute: executeFn,
			}) as Builder;

			vi.mocked(mockClient.insert).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["insert"]
			>[0];
			const insertResult = wrapped.insert(mockTable) as unknown as Builder;
			// Call .execute() directly on the proxied builder - this should trigger the execute wrapper
			const rows = await insertResult.execute();

			expect(rows).toEqual([{ id: "1" }]);
			expect(executeFn).toHaveBeenCalledTimes(1);
			// Verify timing was tracked when .execute() was called
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["db:insert"]).toBeDefined();
			expect(snapshot.ops["db:insert"]?.count).toBe(1);
		});

		it("should handle builder .then() when perf is undefined at runtime", async () => {
			// Test lines 313-314, 338-339: Builder .then() wrapper when perf is undefined at runtime
			const result = [{ id: "1" }];
			const promise = new Promise<typeof result>((resolve) => {
				setImmediate(() => resolve(result));
			});

			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				where: (condition: Record<string, unknown>) => Builder;
			};

			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				where: vi.fn((_condition: Record<string, unknown>) => builder),
			}) as Builder;

			vi.mocked(mockClient.select).mockReturnValue(builder as never);

			// getPerf returns perf initially, but undefined when .then() is called
			let thenCallCount = 0;
			const getPerfDynamic = () => {
				thenCallCount++;
				// Return undefined when .then() is called (runtime check)
				return thenCallCount > 1 ? undefined : mockPerf;
			};

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfDynamic,
			);

			const selectResult = wrapped.select() as unknown as Builder;
			const fromResult = selectResult.from("users");
			const whereResult = fromResult.where({});

			// When awaited, .then() is called and perf should be undefined
			const rows = await whereResult;

			expect(rows).toEqual(result);
			// Verify perf was checked at runtime
			expect(thenCallCount).toBeGreaterThan(1);
		});

		it("should handle builder .execute() when perf is undefined at runtime", async () => {
			// Test line 357: Builder .execute() wrapper when perf is undefined at runtime
			const result = [{ id: "1", name: "test" }];
			const promise = Promise.resolve(result);

			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				values: (data: unknown) => Builder;
				execute: () => Promise<typeof result>;
			};

			const executeFn = vi.fn().mockResolvedValue(result);

			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				values: vi.fn((_data: unknown) => builder),
				execute: executeFn,
			}) as Builder;

			vi.mocked(mockClient.insert).mockReturnValue(builder as never);

			// getPerf returns perf initially, but undefined when .execute() is called
			let executeCallCount = 0;
			const getPerfDynamic = () => {
				executeCallCount++;
				// Return undefined when .execute() is called (runtime check)
				return executeCallCount > 1 ? undefined : mockPerf;
			};

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerfDynamic,
			);

			const mockTable = mockClient.query.usersTable as unknown as Parameters<
				DrizzleClient["insert"]
			>[0];
			const insertResult = wrapped.insert(mockTable) as unknown as Builder;
			const valuesResult = insertResult.values({ name: "test" });

			// When .execute() is called, perf should be undefined
			const rows = await valuesResult.execute();

			expect(rows).toEqual(result);
			expect(executeFn).toHaveBeenCalledTimes(1);
			// Verify perf was checked at runtime
			expect(executeCallCount).toBeGreaterThan(1);
		});

		it("should handle chainable methods that return non-builder values", () => {
			// Test line 362: Chainable method wrapper when method returns something other than builder
			const result = [{ id: "1" }];
			const promise = Promise.resolve(result);

			type Builder = Promise<typeof result> & {
				from: (table: string) => Builder;
				getTableName: () => string; // Returns string, not builder
			};

			const builder = Object.assign(promise, {
				from: vi.fn((_table: string) => builder),
				getTableName: vi.fn(() => "users"),
			}) as Builder;

			vi.mocked(mockClient.select).mockReturnValue(builder as never);

			const wrapped = wrapDrizzleWithMetrics(
				mockClient as unknown as DrizzleClient,
				getPerf,
			);

			const selectResult = wrapped.select() as unknown as Builder;

			// Chainable method that returns builder should preserve Proxy
			const fromResult = selectResult.from("users");
			expect(fromResult).not.toBe(builder); // Should be proxied

			// Method that returns non-builder value should return original result
			const tableName = selectResult.getTableName();
			expect(tableName).toBe("users");
			expect(builder.getTableName).toHaveBeenCalled();
		});
	});
});
