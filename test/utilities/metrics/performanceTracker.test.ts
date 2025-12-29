import { describe, expect, it, vi } from "vitest";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Performance Tracker", () => {
	it("should create a performance tracker with initial empty snapshot", () => {
		const tracker = createPerformanceTracker();
		const snapshot = tracker.snapshot();

		expect(snapshot).toEqual({
			totalMs: 0,
			cacheHits: 0,
			cacheMiss: 0,
			ops: {},
		});
	});

	it("should track database operations", () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(50);
		tracker.trackDb(30);

		const snapshot = tracker.snapshot();

		expect(snapshot.ops.db).toEqual({
			count: 2,
			ms: 80,
			max: 50,
		});
		expect(snapshot.totalMs).toBe(80);
	});

	it("should track cache hits", () => {
		const tracker = createPerformanceTracker();

		tracker.trackCacheHit();
		tracker.trackCacheHit();
		tracker.trackCacheHit();

		const snapshot = tracker.snapshot();

		expect(snapshot.cacheHits).toBe(3);
		expect(snapshot.cacheMiss).toBe(0);
	});

	it("should track cache misses", () => {
		const tracker = createPerformanceTracker();

		tracker.trackCacheMiss();
		tracker.trackCacheMiss();

		const snapshot = tracker.snapshot();

		expect(snapshot.cacheHits).toBe(0);
		expect(snapshot.cacheMiss).toBe(2);
	});

	it("should track cache hits and misses together", () => {
		const tracker = createPerformanceTracker();

		tracker.trackCacheHit();
		tracker.trackCacheMiss();
		tracker.trackCacheHit();
		tracker.trackCacheMiss();
		tracker.trackCacheHit();

		const snapshot = tracker.snapshot();

		expect(snapshot.cacheHits).toBe(3);
		expect(snapshot.cacheMiss).toBe(2);
	});

	it("should time async operations", async () => {
		const tracker = createPerformanceTracker();

		const asyncFn = vi.fn(async () => {
			// Simulate async work with a delay
			await new Promise((resolve) => setTimeout(resolve, 10));
			return "result";
		});

		const result = await tracker.time("test-op", asyncFn);

		expect(result).toBe("result");
		expect(asyncFn).toHaveBeenCalledTimes(1);

		const snapshot = tracker.snapshot();

		expect(snapshot.ops["test-op"]).toBeDefined();
		expect(snapshot.ops["test-op"]!.count).toBe(1);
		expect(snapshot.ops["test-op"]!.ms).toBeGreaterThanOrEqual(10);
		expect(snapshot.ops["test-op"]!.max).toBeGreaterThanOrEqual(10);
	});

	it("should handle async operation errors and still track time", async () => {
		const tracker = createPerformanceTracker();

		const asyncFn = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
			throw new Error("Test error");
		});

		await expect(tracker.time("error-op", asyncFn)).rejects.toThrow(
			"Test error",
		);

		const snapshot = tracker.snapshot();

		expect(snapshot.ops["error-op"]).toBeDefined();
		expect(snapshot.ops["error-op"]!.count).toBe(1);
		expect(snapshot.ops["error-op"]!.ms).toBeGreaterThanOrEqual(4);
	});

	it("should track multiple async operations with same name", async () => {
		const tracker = createPerformanceTracker();

		await tracker.time("query", async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		await tracker.time("query", async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
		});

		const snapshot = tracker.snapshot();

		expect(snapshot.ops.query!.count).toBe(2);
		expect(snapshot.ops.query!.ms).toBeGreaterThanOrEqual(15);
	});

	it("should use manual start/stop timing", async () => {
		const tracker = createPerformanceTracker();

		const end = tracker.start("manual-op");

		// Simulate some work
		await new Promise((resolve) => setTimeout(resolve, 10));

		end();

		const snapshot = tracker.snapshot();

		expect(snapshot.ops["manual-op"]).toBeDefined();
		expect(snapshot.ops["manual-op"]!.count).toBe(1);
		expect(snapshot.ops["manual-op"]!.ms).toBeGreaterThanOrEqual(10);
	});

	it("should track max duration for operations", async () => {
		const tracker = createPerformanceTracker();

		await tracker.time("op", async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
		});

		await tracker.time("op", async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
		});

		await tracker.time("op", async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const snapshot = tracker.snapshot();

		expect(snapshot.ops.op!.count).toBe(3);
		expect(snapshot.ops.op!.ms).toBeGreaterThanOrEqual(30);
		expect(snapshot.ops.op!.max).toBeGreaterThanOrEqual(18);
	});

	it("should accumulate totalMs from all operations", async () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(100);
		await tracker.time("query", async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const snapshot = tracker.snapshot();

		// Total should be at least 110ms (100 from trackDb + 10 from query)
		expect(snapshot.totalMs).toBeGreaterThanOrEqual(110);
	});

	it("should handle multiple different operation types", async () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(25);
		tracker.trackCacheHit();
		tracker.trackCacheMiss();

		await tracker.time("query", async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		await tracker.time("render", async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
		});

		const snapshot = tracker.snapshot();

		expect(snapshot.cacheHits).toBe(1);
		expect(snapshot.cacheMiss).toBe(1);
		expect(snapshot.ops.db).toBeDefined();
		expect(snapshot.ops.query).toBeDefined();
		expect(snapshot.ops.render).toBeDefined();
		expect(snapshot.totalMs).toBeGreaterThanOrEqual(40);
	});

	it("should return independent snapshots", () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(50);
		const snapshot1 = tracker.snapshot();

		tracker.trackDb(30);
		const snapshot2 = tracker.snapshot();

		// First snapshot should be unchanged
		expect(snapshot1.ops.db!.ms).toBe(50);
		expect(snapshot1.totalMs).toBe(50);

		// Second snapshot should include both operations
		expect(snapshot2.ops.db!.ms).toBe(80);
		expect(snapshot2.totalMs).toBe(80);
	});
});
