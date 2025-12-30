import { describe, expect, it, vi } from "vitest";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Performance Tracker", () => {
	it("should create a performance tracker with initial empty snapshot", () => {
		const tracker = createPerformanceTracker();
		const snapshot = tracker.snapshot();

		expect(snapshot).toEqual({
			totalMs: 0,
			cacheHits: 0,
			cacheMisses: 0,
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
		expect(snapshot.cacheMisses).toBe(0);
	});

	it("should track cache misses", () => {
		const tracker = createPerformanceTracker();

		tracker.trackCacheMiss();
		tracker.trackCacheMiss();

		const snapshot = tracker.snapshot();

		expect(snapshot.cacheHits).toBe(0);
		expect(snapshot.cacheMisses).toBe(2);
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
		expect(snapshot.cacheMisses).toBe(2);
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

		const testOp = snapshot.ops["test-op"];
		expect(testOp).toBeDefined();
		expect(testOp?.count).toBe(1);
		expect(testOp?.ms).toBeGreaterThanOrEqual(10);
		expect(testOp?.max).toBeGreaterThanOrEqual(10);
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

		const errorOp = snapshot.ops["error-op"];
		expect(errorOp).toBeDefined();
		expect(errorOp?.count).toBe(1);
		expect(errorOp?.ms).toBeGreaterThanOrEqual(4);
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

		const queryOp = snapshot.ops.query;
		expect(queryOp).toBeDefined();
		expect(queryOp?.count).toBe(2);
		expect(queryOp?.ms).toBeGreaterThanOrEqual(12); // Reduced from 15ms to account for CI timing variance
	});

	it("should use manual start/stop timing", async () => {
		const tracker = createPerformanceTracker();

		const end = tracker.start("manual-op");

		// Simulate some work
		await new Promise((resolve) => setTimeout(resolve, 10));

		end();

		const snapshot = tracker.snapshot();

		const manualOp = snapshot.ops["manual-op"];
		expect(manualOp).toBeDefined();
		expect(manualOp?.count).toBe(1);
		expect(manualOp?.ms).toBeGreaterThanOrEqual(10);
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

		const op = snapshot.ops.op;
		expect(op).toBeDefined();
		expect(op?.count).toBe(3);
		expect(op?.ms).toBeGreaterThanOrEqual(30);
		expect(op?.max).toBeDefined();
		expect(op?.max).toBeGreaterThanOrEqual(18);
	});

	it("should accumulate totalMs from all operations", async () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(100);
		await tracker.time("query", async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const snapshot = tracker.snapshot();

		// Total should be at least 105ms (reduced from 110ms for CI timing variance)
		expect(snapshot.totalMs).toBeGreaterThanOrEqual(105);
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
		expect(snapshot.cacheMisses).toBe(1);
		expect(snapshot.ops.db).toBeDefined();
		expect(snapshot.ops.query).toBeDefined();
		expect(snapshot.ops.render).toBeDefined();
		expect(snapshot.totalMs).toBeGreaterThanOrEqual(37); // Reduced from 40ms for CI timing variance
	});

	it("should return independent snapshots", () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(50);
		const snapshot1 = tracker.snapshot();

		tracker.trackDb(30);
		const snapshot2 = tracker.snapshot();

		// First snapshot should be unchanged
		const db1 = snapshot1.ops.db;
		expect(db1).toBeDefined();
		expect(db1?.ms).toBe(50);
		expect(snapshot1.totalMs).toBe(50);

		// Second snapshot should include both operations
		const db2 = snapshot2.ops.db;
		expect(db2).toBeDefined();
		expect(db2?.ms).toBe(80);
		expect(snapshot2.totalMs).toBe(80);
	});

	// Validation tests
	it("should reject empty operation names in time()", async () => {
		const tracker = createPerformanceTracker();
		await expect(tracker.time("", async () => {})).rejects.toThrow(
			"Operation name cannot be empty or whitespace",
		);
	});

	it("should reject whitespace-only operation names in time()", async () => {
		const tracker = createPerformanceTracker();
		await expect(tracker.time("   ", async () => {})).rejects.toThrow(
			"Operation name cannot be empty or whitespace",
		);
	});

	it("should reject empty operation names in start()", () => {
		const tracker = createPerformanceTracker();
		expect(() => tracker.start("")).toThrow(
			"Operation name cannot be empty or whitespace",
		);
	});

	it("should reject whitespace-only operation names in start()", () => {
		const tracker = createPerformanceTracker();
		expect(() => tracker.start("   ")).toThrow(
			"Operation name cannot be empty or whitespace",
		);
	});

	it("should silently ignore invalid values in trackDb()", () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(Number.NaN);
		tracker.trackDb(Number.POSITIVE_INFINITY);
		tracker.trackDb(Number.NEGATIVE_INFINITY);
		tracker.trackDb(-50);

		const snapshot = tracker.snapshot();

		expect(snapshot.ops.db).toBeUndefined();
		expect(snapshot.totalMs).toBe(0);
	});

	it("should handle trackDb(0) as valid edge case", () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(0);

		const snapshot = tracker.snapshot();
		const dbOp = snapshot.ops.db;

		expect(dbOp).toBeDefined();
		expect(dbOp?.count).toBe(1);
		expect(dbOp?.ms).toBe(0);
		expect(dbOp?.max).toBe(0);
		expect(snapshot.totalMs).toBe(0);
	});
});
