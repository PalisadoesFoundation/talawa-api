import { describe, expect, it, vi } from "vitest";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Performance Tracker", () => {
	it("should create a performance tracker with initial empty snapshot", () => {
		const tracker = createPerformanceTracker();
		const snapshot = tracker.snapshot();

		expect(snapshot).toEqual({
			totalMs: 0,
			totalOps: 0,
			cacheHits: 0,
			cacheMisses: 0,
			hitRate: 0,
			ops: {},
		});
		// Verify complexityScore is not present when undefined
		expect(snapshot).not.toHaveProperty("complexityScore");
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
		expect(snapshot.hitRate).toBe(1.0);
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
		expect(snapshot.hitRate).toBeCloseTo(0.6, 2);
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
		if (!testOp) throw new Error("testOp is undefined");
		expect(Math.ceil(testOp.ms)).toBeGreaterThanOrEqual(10);
		expect(Math.ceil(testOp.max)).toBeGreaterThanOrEqual(10);
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
		if (!queryOp) throw new Error("queryOp is undefined");
		expect(Math.ceil(queryOp.ms)).toBeGreaterThanOrEqual(15);
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
		if (!manualOp) throw new Error("manualOp is undefined");
		expect(Math.ceil(manualOp.ms)).toBeGreaterThanOrEqual(10);
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
		if (!op) throw new Error("op is undefined");
		expect(Math.ceil(op.ms)).toBeGreaterThanOrEqual(35);
		expect(op?.max).toBeDefined();
		expect(Math.ceil(op.max)).toBeGreaterThanOrEqual(20);
	});

	it("should accumulate totalMs from all operations", async () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(100);
		await tracker.time("query", async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const snapshot = tracker.snapshot();

		// Total should be at least 110ms
		expect(Math.ceil(snapshot.totalMs)).toBeGreaterThanOrEqual(110);
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
		expect(Math.ceil(snapshot.totalMs)).toBeGreaterThanOrEqual(40);
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
		expect(snapshot.totalOps).toBe(1);
	});

	it("should calculate hit rate correctly", () => {
		const tracker = createPerformanceTracker();

		tracker.trackCacheHit();
		tracker.trackCacheHit();
		tracker.trackCacheMiss();

		const snapshot = tracker.snapshot();

		expect(snapshot.hitRate).toBeCloseTo(2 / 3, 2);
	});

	it("should return hit rate of 0 when no cache operations", () => {
		const tracker = createPerformanceTracker();
		const snapshot = tracker.snapshot();

		expect(snapshot.hitRate).toBe(0);
	});

	it("should track totalOps correctly", async () => {
		const tracker = createPerformanceTracker();

		tracker.trackDb(10);
		await tracker.time("op1", async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
		});
		await tracker.time("op2", async () => {
			await new Promise((resolve) => setTimeout(resolve, 5));
		});

		const snapshot = tracker.snapshot();

		expect(snapshot.totalOps).toBe(3);
	});

	it("records op timings and cache stats", async () => {
		const perf = createPerformanceTracker();
		await perf.time(
			"db:users.byId",
			async () => new Promise((r) => setTimeout(r, 2)),
		);
		perf.trackCacheHit();
		perf.trackCacheMiss();
		perf.trackCacheMiss();
		const snap = perf.snapshot();
		expect(snap.totalOps).toBe(1);
		expect(snap.cacheHits).toBe(1);
		expect(snap.cacheMisses).toBe(2);
	});

	it("should silently ignore invalid values in trackComplexity()", () => {
		const tracker = createPerformanceTracker();

		tracker.trackComplexity(Number.NaN);
		tracker.trackComplexity(Number.POSITIVE_INFINITY);
		tracker.trackComplexity(Number.NEGATIVE_INFINITY);
		tracker.trackComplexity(-50);

		const snapshot = tracker.snapshot();

		// Should not have set complexityScore for invalid values
		// Verify complexityScore is not present in the snapshot when undefined
		expect(snapshot).not.toHaveProperty("complexityScore");
		expect(snapshot.ops["gql:complexity"]).toBeUndefined();
	});

	it("should handle trackComplexity(0) as valid edge case", () => {
		const tracker = createPerformanceTracker();

		tracker.trackComplexity(0);

		const snapshot = tracker.snapshot();

		expect(snapshot.complexityScore).toBe(0);
		expect(snapshot.ops["gql:complexity"]).toBeUndefined();
	});

	it("should track complexity score correctly", () => {
		const tracker = createPerformanceTracker();

		tracker.trackComplexity(100);
		tracker.trackComplexity(150);

		const snapshot = tracker.snapshot();

		// Last call should set the complexityScore to 150
		expect(snapshot.complexityScore).toBe(150);
		expect(snapshot.ops["gql:complexity"]).toBeUndefined();
	});

	it("should track complexity scores", () => {
		const tracker = createPerformanceTracker();

		tracker.trackComplexity(100);
		tracker.trackComplexity(50);

		const snapshot = tracker.snapshot();

		// Latest complexity score should be stored
		expect(snapshot.complexityScore).toBe(50);
	});

	it("should silently ignore invalid values in trackComplexity()", () => {
		const tracker = createPerformanceTracker();

		// Track a valid score first
		tracker.trackComplexity(100);
		const snapshot1 = tracker.snapshot();
		expect(snapshot1.complexityScore).toBe(100);

		// Try invalid values - should not change the snapshot
		tracker.trackComplexity(Number.NaN);
		tracker.trackComplexity(Number.POSITIVE_INFINITY);
		tracker.trackComplexity(Number.NEGATIVE_INFINITY);
		tracker.trackComplexity(-50);

		const snapshot2 = tracker.snapshot();

		// Complexity score should remain unchanged (still 100)
		expect(snapshot2.complexityScore).toBe(100);
		// Other fields should be unchanged
		expect(snapshot2.totalMs).toBe(snapshot1.totalMs);
		expect(snapshot2.cacheHits).toBe(snapshot1.cacheHits);
		expect(snapshot2.cacheMisses).toBe(snapshot1.cacheMisses);
		expect(snapshot2.ops).toEqual(snapshot1.ops);
	});

	it("should handle trackComplexity(0) as valid edge case", () => {
		const tracker = createPerformanceTracker();

		tracker.trackComplexity(0);

		const snapshot = tracker.snapshot();

		expect(snapshot.complexityScore).toBe(0);
	});

	it("should not include complexityScore in snapshot when not tracked", () => {
		const tracker = createPerformanceTracker();

		const snapshot = tracker.snapshot();

		expect(snapshot).not.toHaveProperty("complexityScore");
	});
});
