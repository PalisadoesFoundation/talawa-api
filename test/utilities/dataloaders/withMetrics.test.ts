import { describe, expect, it, vi } from "vitest";
import { wrapBatchWithMetrics } from "~/src/utilities/dataloaders/withMetrics";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("withMetrics - DataLoader wrapper", () => {
	it("should wrap batch function and track performance", async () => {
		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const mockBatchFn = vi.fn(async (keys: readonly string[]) =>
			keys.map((key) => ({ id: key, name: `User ${key}` })),
		);

		const wrappedBatch = wrapBatchWithMetrics(
			"users.byId",
			mockPerf,
			mockBatchFn,
		);

		const keys = ["1", "2", "3"];
		const results = await wrappedBatch(keys);

		// Should call the original batch function
		expect(mockBatchFn).toHaveBeenCalledWith(keys);
		expect(mockBatchFn).toHaveBeenCalledTimes(1);

		// Should return the results unchanged
		expect(results).toEqual([
			{ id: "1", name: "User 1" },
			{ id: "2", name: "User 2" },
			{ id: "3", name: "User 3" },
		]);

		// Should track performance with correct operation name
		expect(mockPerf.time).toHaveBeenCalledWith(
			"dataloader:users.byId",
			expect.any(Function),
		);
		expect(mockPerf.time).toHaveBeenCalledTimes(1);
	});

	it("should propagate errors from batch function", async () => {
		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const mockBatchFn = vi.fn(async () => {
			throw new Error("Database connection failed");
		});

		const wrappedBatch = wrapBatchWithMetrics(
			"users.byId",
			mockPerf,
			mockBatchFn,
		);

		await expect(wrappedBatch(["1", "2"])).rejects.toThrow(
			"Database connection failed",
		);

		// Should still track the operation even when it fails
		expect(mockPerf.time).toHaveBeenCalledTimes(1);
	});

	it("should handle empty keys array", async () => {
		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const mockBatchFn = vi.fn(async (keys: readonly string[]) =>
			keys.map(() => null),
		);

		const wrappedBatch = wrapBatchWithMetrics(
			"organizations.byId",
			mockPerf,
			mockBatchFn,
		);

		const results = await wrappedBatch([]);

		expect(mockBatchFn).toHaveBeenCalledWith([]);
		expect(results).toEqual([]);
		expect(mockPerf.time).toHaveBeenCalledTimes(1);
	});

	it("should work with batch functions returning nulls", async () => {
		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const mockBatchFn = vi.fn(async (keys: readonly string[]) =>
			keys.map((key) => (key === "missing" ? null : { id: key })),
		);

		const wrappedBatch = wrapBatchWithMetrics(
			"events.byId",
			mockPerf,
			mockBatchFn,
		);

		const keys = ["1", "missing", "3"];
		const results = await wrappedBatch(keys);

		expect(results).toEqual([{ id: "1" }, null, { id: "3" }]);
		expect(mockPerf.time).toHaveBeenCalledTimes(1);
	});

	it("should preserve batch function return type", async () => {
		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		type CustomType = { id: string; data: number[] };

		const mockBatchFn = vi.fn(
			async (
				keys: readonly string[],
			): Promise<readonly (CustomType | null)[]> =>
				keys.map((key) => ({ id: key, data: [1, 2, 3] })),
		);

		const wrappedBatch = wrapBatchWithMetrics(
			"custom.byId",
			mockPerf,
			mockBatchFn,
		);

		const results = await wrappedBatch(["1"]);

		expect(results[0]).toEqual({ id: "1", data: [1, 2, 3] });
		expect(Array.isArray(results[0]?.data)).toBe(true);
	});
});
