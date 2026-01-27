import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withQueryMetrics } from "~/src/graphql/utils/withQueryMetrics";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("withQueryMetrics", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("when performance tracker is available", () => {
		it("should track query execution time", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve("test-result"), 10);
					}),
			);

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			const resultPromise = wrappedResolver(null, {}, context);
			await vi.advanceTimersByTimeAsync(10);
			const result = await resultPromise;

			expect(result).toBe("test-result");
			expect(resolver).toHaveBeenCalledTimes(1);
			expect(resolver).toHaveBeenCalledWith(null, {}, context);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:test"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(10);
		});

		it("should track query execution time even when resolver throws", async () => {
			const perf = createPerformanceTracker();
			const error = new Error("Test error");
			const resolver = vi.fn(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => reject(error), 5);
					}),
			);

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			const resultPromise = wrappedResolver(null, {}, context);
			await vi.advanceTimersByTimeAsync(5);
			await expect(resultPromise).rejects.toThrow("Test error");

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:test"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(5);
		});

		it("should track multiple query executions separately", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue("result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			await wrappedResolver(null, {}, context);
			await wrappedResolver(null, {}, context);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:test"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(2);
		});

		it("should preserve resolver return values", async () => {
			const perf = createPerformanceTracker();
			const testData = { id: "123", name: "Test" };
			const resolver = vi.fn().mockResolvedValue(testData);

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			const result = await wrappedResolver(null, {}, context);

			expect(result).toEqual(testData);
			expect(result).toBe(testData);
		});

		it("should pass all arguments correctly to resolver", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue("result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const parent = { id: "parent" };
			const args = { input: { id: "123" } };
			const context = { perf } as { perf?: PerformanceTracker };

			await wrappedResolver(parent, args, context);

			expect(resolver).toHaveBeenCalledWith(parent, args, context);
		});
	});

	describe("when performance tracker is unavailable", () => {
		it("should execute resolver directly without tracking", async () => {
			const resolver = vi.fn().mockResolvedValue("test-result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const context = {} as { perf?: PerformanceTracker };

			const result = await wrappedResolver(null, {}, context);

			expect(result).toBe("test-result");
			expect(resolver).toHaveBeenCalledTimes(1);
		});

		it("should handle errors gracefully when perf tracker is unavailable", async () => {
			const error = new Error("Test error");
			const resolver = vi.fn().mockRejectedValue(error);

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const context = {} as { perf?: PerformanceTracker };

			await expect(wrappedResolver(null, {}, context)).rejects.toThrow(
				"Test error",
			);
			expect(resolver).toHaveBeenCalledTimes(1);
		});

		it("should preserve resolver return values when perf tracker is unavailable", async () => {
			const testData = { id: "123", name: "Test" };
			const resolver = vi.fn().mockResolvedValue(testData);

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const context = {} as { perf?: PerformanceTracker };

			const result = await wrappedResolver(null, {}, context);

			expect(result).toEqual(testData);
			expect(result).toBe(testData);
		});

		it("should pass all arguments correctly when perf tracker is unavailable", async () => {
			const resolver = vi.fn().mockResolvedValue("result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:test",
				},
				resolver,
			);

			const parent = { id: "parent" };
			const args = { input: { id: "123" } };
			const context = {} as { perf?: PerformanceTracker };

			await wrappedResolver(parent, args, context);

			expect(resolver).toHaveBeenCalledWith(parent, args, context);
		});
	});

	describe("operation name validation", () => {
		it("should use the provided operation name for tracking", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue("result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:customOperation",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			await wrappedResolver(null, {}, context);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:customOperation"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should support different operation name patterns", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue("result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:organizations",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			await wrappedResolver(null, {}, context);

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:organizations"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should reject empty operation name", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue("result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			await expect(wrappedResolver(null, {}, context)).rejects.toThrow(
				"Operation name cannot be empty or whitespace",
			);
		});

		it("should reject whitespace-only operation name", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue("result");

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "   ",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			await expect(wrappedResolver(null, {}, context)).rejects.toThrow(
				"Operation name cannot be empty or whitespace",
			);
		});
	});

	describe("integration scenarios", () => {
		it("should work with async operations that take time", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn(async () => {
				await vi.advanceTimersByTimeAsync(50);
				return "delayed-result";
			});

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:slow",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			const result = await wrappedResolver(null, {}, context);

			expect(result).toBe("delayed-result");

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:slow"];

			expect(op).toBeDefined();
			expect(Math.ceil(op?.ms ?? 0)).toBeGreaterThanOrEqual(50);
		});

		it("should handle resolver that returns null", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue(null);

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:null",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			const result = await wrappedResolver(null, {}, context);

			expect(result).toBeNull();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:null"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});

		it("should handle resolver that returns undefined", async () => {
			const perf = createPerformanceTracker();
			const resolver = vi.fn().mockResolvedValue(undefined);

			const wrappedResolver = withQueryMetrics(
				{
					operationName: "query:undefined",
				},
				resolver,
			);

			const context = { perf } as { perf?: PerformanceTracker };

			const result = await wrappedResolver(null, {}, context);

			expect(result).toBeUndefined();

			const snapshot = perf.snapshot();
			const op = snapshot.ops["query:undefined"];

			expect(op).toBeDefined();
			expect(op?.count).toBe(1);
		});
	});
});
