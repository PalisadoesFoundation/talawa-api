import { describe, expect, it, vi } from "vitest";
import {
	createPerformanceTracker,
	isPerformanceTracker,
} from "~/src/utilities/metrics/performanceTracker";

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
			slow: [],
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

	it("should track slow operations", async () => {
		const tracker = createPerformanceTracker({ slowMs: 10 });

		// Use trackDb to directly set a fast operation timing (below threshold)
		// This avoids timing variance from setTimeout
		tracker.trackDb(5);

		// Use tracker.time for slow operation with sufficient delay to ensure it's slow
		// Using 20ms delay which should reliably be >= 10ms threshold even with timing variance
		await tracker.time("slow-op", async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
		});

		const snapshot = tracker.snapshot();

		expect(snapshot.slow.length).toBe(1);
		expect(snapshot.slow[0]?.op).toBe("slow-op");
		expect(snapshot.slow[0]?.ms).toBeGreaterThanOrEqual(10);
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

	it("should limit slow operations to 50", async () => {
		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Create 60 slow operations
		for (let i = 0; i < 60; i++) {
			await tracker.time(`slow-${i}`, async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
			});
		}

		const snapshot = tracker.snapshot();

		expect(snapshot.slow.length).toBe(50);
	});

	it("should use custom slowMs threshold", async () => {
		const tracker = createPerformanceTracker({ slowMs: 50 });

		await tracker.time("op1", async () => {
			await new Promise((resolve) => setTimeout(resolve, 30));
		});

		await tracker.time("op2", async () => {
			await new Promise((resolve) => setTimeout(resolve, 60));
		});

		const snapshot = tracker.snapshot();

		expect(snapshot.slow.length).toBe(1);
		expect(snapshot.slow[0]?.op).toBe("op2");
	});

	it("records op timings and cache stats", async () => {
		const perf = createPerformanceTracker({ slowMs: 1 });
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
		expect(snap.slow.length).toBeGreaterThanOrEqual(1);
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

	it("should handle slow operations array edge case when replacing minimum", async () => {
		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Fill up the slow array to MAX_SLOW (50) with varying durations
		// Use increasing delays to create a predictable minimum
		for (let i = 0; i < 50; i++) {
			await tracker.time(`slow-${i}`, async () => {
				// Use increasing delays: 10ms, 11ms, 12ms, ... 59ms
				await new Promise((resolve) => setTimeout(resolve, 10 + i));
			});
		}

		// Verify we have exactly 50 slow operations before adding the replacement
		const snapshotBefore = tracker.snapshot();
		expect(snapshotBefore.slow.length).toBe(50);

		// Add one more that's slower than the minimum (50ms >> 10ms minimum)
		await tracker.time("very-slow-replacement", async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
		});

		const snapshotAfter = tracker.snapshot();

		// Should still have exactly 50 slow operations
		expect(snapshotAfter.slow.length).toBe(50);
		// The very-slow-replacement operation should be in the list
		const verySlowOp = snapshotAfter.slow.find(
			(op) => op.op === "very-slow-replacement",
		);
		expect(verySlowOp).toBeDefined();
		expect(verySlowOp?.ms).toBeGreaterThanOrEqual(50);
	});

	it("should not add slow operation when it's not slower than minimum", async () => {
		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Fill up the slow array to MAX_SLOW (50) with operations of large duration
		// Use delays (20ms+) to ensure the minimum is well above any small test delay
		for (let i = 0; i < 50; i++) {
			await tracker.time(`slow-${i}`, async () => {
				// Use increasing delays: 20ms, 21ms, 22ms, ... 69ms
				// This ensures minMs will be at least 20ms
				await new Promise((resolve) => setTimeout(resolve, 20 + i));
			});
		}

		// Get snapshot to find the minimum slow operation
		const snapshotBefore = tracker.snapshot();
		const minSlowOp = snapshotBefore.slow.reduce((min, op) =>
			op.ms < min.ms ? op : min,
		);
		const minMs = minSlowOp.ms;

		// Verify minMs is large enough (should be at least 20ms)
		expect(minMs).toBeGreaterThanOrEqual(20);

		// Add an operation that's slow (>= slowMs = 1) but NOT slower than the current minimum
		// Use a small delay (10ms) which is guaranteed to be < minMs (>= 20ms)
		// This tests the case where roundedMs <= minMs (line 174 condition is false)
		await tracker.time("not-slower-than-min", async () => {
			// Use a small delay that's guaranteed to be less than minMs
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const snapshotAfter = tracker.snapshot();

		// Should still have exactly 50 slow operations (no new one added)
		expect(snapshotAfter.slow.length).toBe(50);
		// The not-slower-than-min operation should not be in the list
		const notSlowerOp = snapshotAfter.slow.find(
			(op) => op.op === "not-slower-than-min",
		);
		expect(notSlowerOp).toBeUndefined();
	});

	it("should not replace when new operation ms equals current minimum", async () => {
		// This test exercises the boundary case where roundedMs === minMs
		// The condition on line 185 checks: if (roundedMs <= minMs) { return; }
		// So when roundedMs === minMs, the operation should NOT be added/replaced
		// We use trackDb to directly set the ms value to avoid timing variance

		// Fill up exactly to MAX_SLOW (50) with operations where the minimum is exactly 20ms
		// Create an array where minMs will be exactly 20ms
		const customSlowArray: Array<{ op: string; ms: number }> = [];
		for (let i = 0; i < 50; i++) {
			customSlowArray.push({ op: `slow-${i}`, ms: 20 + i });
		}

		const trackerWithCustomArray = createPerformanceTracker({
			slowMs: 1,
			__slowArray: customSlowArray,
		});

		// Verify we have exactly 50 and minimum is 20ms
		const snapshotBefore = trackerWithCustomArray.snapshot();
		expect(snapshotBefore.slow.length).toBe(50);
		const minSlowOp = snapshotBefore.slow.reduce((min, op) =>
			op.ms < min.ms ? op : min,
		);
		const minMs = minSlowOp.ms;
		expect(minMs).toBe(20);

		// Use trackDb to directly record exactly 20ms (which rounds to 20ms)
		// This should NOT replace because roundedMs (20) <= minMs (20)
		trackerWithCustomArray.trackDb(20);

		const snapshotAfter = trackerWithCustomArray.snapshot();
		expect(snapshotAfter.slow.length).toBe(50);

		// Verify the db operation was NOT added to slow array (boundary condition)
		// trackDb records as "db" operation, so check that "db" is not in slow array
		// or that the slow array still has the same entries
		const dbOpInSlow = snapshotAfter.slow.find((op) => op.op === "db");
		expect(dbOpInSlow).toBeUndefined();
		// Verify the original minimum entry is still there
		const minSlowOpAfter = snapshotAfter.slow.reduce((min, op) =>
			op.ms < min.ms ? op : min,
		);
		expect(minSlowOpAfter.ms).toBe(20);
	});

	it("should handle edge case when slow array has undefined entries during iteration", async () => {
		// This test covers the sparse-array skip behavior on line 166: if (!cur) { continue; }
		// To trigger this, we need slow.length >= MAX_SLOW with at least one undefined entry.
		// We create a sparse array directly without global mocks by using array length manipulation.

		// Create a sparse array with 50 length but index 0 is undefined
		// This simulates the case where slow.length === 50 but slow[0] is undefined
		const customSlowArray: Array<{ op: string; ms: number } | undefined> = [];
		// Fill indices 1-49 with valid entries
		for (let i = 1; i < 50; i++) {
			customSlowArray[i] = { op: `slow-${i}`, ms: 10 + i };
		}
		// Set length to 50, leaving index 0 as undefined (sparse)
		customSlowArray.length = 50;

		const tracker = createPerformanceTracker({
			slowMs: 1,
			__slowArray: customSlowArray as Array<{ op: string; ms: number }>,
		});

		// Verify the array is sparse (slow[0] is undefined, but length is 50)
		const snapshotBefore = tracker.snapshot();
		expect(snapshotBefore.slow.length).toBe(50);
		expect(snapshotBefore.slow[0]).toBeUndefined();

		// Now add one more that's slower - this will iterate through the slow array
		// and hit the if (!cur) { continue; } branch when it encounters slow[0] (undefined)
		// The loop will skip the undefined entry and continue processing other valid entries
		await tracker.time("very-slow", async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
		});

		// Verify the tracker still works correctly after encountering undefined entries
		const snapshotAfter = tracker.snapshot();
		// The very-slow operation should be added (replacing the minimum valid entry)
		expect(snapshotAfter.slow.length).toBe(50);
		const verySlowOp = snapshotAfter.slow.find((op) => op?.op === "very-slow");
		expect(verySlowOp).toBeDefined();
		expect(verySlowOp?.ms).toBeGreaterThanOrEqual(50);
	});

	it("should handle edge case when all slow entries are invalid (minIdx === -1 || minMs === Infinity)", async () => {
		// This test covers the defensive check on lines 179-181:
		// if (minIdx === -1 || minMs === Infinity) { return; }
		// This happens when slow.length >= MAX_SLOW but all entries are invalid
		// (null, undefined, or have invalid ms values), so the loop doesn't find any valid entry.
		// We use a custom slow array with invalid entries to test this without global mocks.

		// Create a custom slow array with 50 entries, all with invalid ms values
		const customSlowArray: Array<{ op: string; ms: number | null }> = [];
		for (let i = 0; i < 50; i++) {
			customSlowArray.push({ op: `slow-${i}`, ms: null });
		}

		const tracker = createPerformanceTracker({
			slowMs: 1,
			__slowArray: customSlowArray as Array<{ op: string; ms: number }>,
		});

		// Verify array is at capacity with invalid entries
		const snapshot = tracker.snapshot();
		expect(snapshot.slow.length).toBe(50);

		// Add one more slow operation - this should trigger the defensive check
		// because all entries are invalid (ms = null), so the loop skips them all,
		// leaving minIdx = -1 and minMs = Infinity, which triggers the return on line 180
		await tracker.time("very-slow", async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
		});

		// The defensive check should have been triggered (minIdx === -1 || minMs === Infinity)
		// This means the very-slow operation was NOT added because the loop found no valid entries
		// Verify the tracker still works correctly and the array length remains 50
		const snapshotAfter = tracker.snapshot();
		expect(snapshotAfter.slow.length).toBe(50);
		// Verify the very-slow operation was NOT added (defensive check returned early)
		const verySlowOp = snapshotAfter.slow.find((op) => op?.op === "very-slow");
		expect(verySlowOp).toBeUndefined();
	});
});

describe("isPerformanceTracker", () => {
	it("should return true for a valid PerformanceTracker", () => {
		const tracker = createPerformanceTracker();
		expect(isPerformanceTracker(tracker)).toBe(true);
	});

	it("should return false for null", () => {
		expect(isPerformanceTracker(null)).toBe(false);
	});

	it("should return false for undefined", () => {
		expect(isPerformanceTracker(undefined)).toBe(false);
	});

	it("should return false for a non-object value", () => {
		expect(isPerformanceTracker("string")).toBe(false);
		expect(isPerformanceTracker(123)).toBe(false);
		expect(isPerformanceTracker(true)).toBe(false);
		expect(isPerformanceTracker([])).toBe(false);
	});

	it("should return false for an object missing trackComplexity", () => {
		const invalidTracker = {
			snapshot: () => ({}),
			trackDb: () => {},
			trackCacheHit: () => {},
			trackCacheMiss: () => {},
			time: () => {},
			start: () => {},
		};
		expect(isPerformanceTracker(invalidTracker)).toBe(false);
	});

	it("should return false for an object missing snapshot", () => {
		const invalidTracker = {
			trackComplexity: () => {},
			trackDb: () => {},
			trackCacheHit: () => {},
			trackCacheMiss: () => {},
			time: () => {},
			start: () => {},
		};
		expect(isPerformanceTracker(invalidTracker)).toBe(false);
	});

	it("should return false for an object missing trackDb", () => {
		const invalidTracker = {
			trackComplexity: () => {},
			snapshot: () => ({}),
			trackCacheHit: () => {},
			trackCacheMiss: () => {},
			time: () => {},
			start: () => {},
		};
		expect(isPerformanceTracker(invalidTracker)).toBe(false);
	});

	it("should return false for an object missing trackCacheHit", () => {
		const invalidTracker = {
			trackComplexity: () => {},
			snapshot: () => ({}),
			trackDb: () => {},
			trackCacheMiss: () => {},
			time: () => {},
			start: () => {},
		};
		expect(isPerformanceTracker(invalidTracker)).toBe(false);
	});

	it("should return false for an object missing trackCacheMiss", () => {
		const invalidTracker = {
			trackComplexity: () => {},
			snapshot: () => ({}),
			trackDb: () => {},
			trackCacheHit: () => {},
			time: () => {},
			start: () => {},
		};
		expect(isPerformanceTracker(invalidTracker)).toBe(false);
	});

	it("should return false for an object missing time", () => {
		const invalidTracker = {
			trackComplexity: () => {},
			snapshot: () => ({}),
			trackDb: () => {},
			trackCacheHit: () => {},
			trackCacheMiss: () => {},
			start: () => {},
		};
		expect(isPerformanceTracker(invalidTracker)).toBe(false);
	});

	it("should return false for an object missing start", () => {
		const invalidTracker = {
			trackComplexity: () => {},
			snapshot: () => ({}),
			trackDb: () => {},
			trackCacheHit: () => {},
			trackCacheMiss: () => {},
			time: () => {},
		};
		expect(isPerformanceTracker(invalidTracker)).toBe(false);
	});

	it("should return true for an object with all required methods", () => {
		const validTracker = {
			time: () => {},
			start: () => {},
			trackComplexity: () => {},
			snapshot: () => ({}),
			trackDb: () => {},
			trackCacheHit: () => {},
			trackCacheMiss: () => {},
		};
		expect(isPerformanceTracker(validTracker)).toBe(true);
	});

	it("should return false for an empty object", () => {
		expect(isPerformanceTracker({})).toBe(false);
	});
});
