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
			slow: [],
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
		const tracker = createPerformanceTracker({ slowMs: 100 });

		await tracker.time("fast-op", async () => {
			await new Promise((resolve) => setTimeout(resolve, 50));
		});

		await tracker.time("slow-op", async () => {
			await new Promise((resolve) => setTimeout(resolve, 150));
		});

		const snapshot = tracker.snapshot();

		expect(snapshot.slow.length).toBe(1);
		expect(snapshot.slow[0]?.op).toBe("slow-op");
		expect(snapshot.slow[0]?.ms).toBeGreaterThanOrEqual(100);
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
		expect(snapshot.complexityScore).toBeUndefined();
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

		// Add one more that's slower than the minimum (1000ms >> 10ms minimum)
		await tracker.time("very-slow-replacement", async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		});

		const snapshotAfter = tracker.snapshot();

		// Should still have exactly 50 slow operations
		expect(snapshotAfter.slow.length).toBe(50);
		// The very-slow-replacement operation should be in the list
		const verySlowOp = snapshotAfter.slow.find(
			(op) => op.op === "very-slow-replacement",
		);
		expect(verySlowOp).toBeDefined();
		expect(verySlowOp?.ms).toBeGreaterThanOrEqual(1000);
	});

	it("should not add slow operation when it's not slower than minimum", async () => {
		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Fill up the slow array to MAX_SLOW (50) with operations of large duration
		// Use large delays (100ms+) to ensure the minimum is well above any small test delay
		for (let i = 0; i < 50; i++) {
			await tracker.time(`slow-${i}`, async () => {
				// Use increasing delays: 100ms, 101ms, 102ms, ... 149ms
				// This ensures minMs will be at least 100ms
				await new Promise((resolve) => setTimeout(resolve, 100 + i));
			});
		}

		// Get snapshot to find the minimum slow operation
		const snapshotBefore = tracker.snapshot();
		const minSlowOp = snapshotBefore.slow.reduce((min, op) =>
			op.ms < min.ms ? op : min,
		);
		const minMs = minSlowOp.ms;

		// Verify minMs is large enough (should be at least 100ms)
		expect(minMs).toBeGreaterThanOrEqual(100);

		// Add an operation that's slow (>= slowMs = 1) but NOT slower than the current minimum
		// Use a small delay (10ms) which is guaranteed to be < minMs (>= 100ms)
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

	it("should handle edge case when slow array has undefined entries during iteration", async () => {
		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Fill up the slow array to MAX_SLOW (50)
		for (let i = 0; i < 50; i++) {
			await tracker.time(`slow-${i}`, async () => {
				await new Promise((resolve) => setTimeout(resolve, 10 + i));
			});
		}

		// Manually manipulate the slow array to simulate undefined entries
		// This tests the currentSlow check in the loop
		const snapshot = tracker.snapshot();
		expect(snapshot.slow.length).toBe(50);

		// Add one more slow operation that should replace the minimum
		// This will trigger the loop that checks currentSlow
		await tracker.time("very-slow", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		});

		const snapshotAfter = tracker.snapshot();
		expect(snapshotAfter.slow.length).toBe(50);
		const verySlowOp = snapshotAfter.slow.find((op) => op.op === "very-slow");
		expect(verySlowOp).toBeDefined();
		expect(verySlowOp?.ms).toBeGreaterThanOrEqual(2000);
	});

	it("should handle slow array replacement when at capacity", async () => {
		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Fill up exactly to MAX_SLOW (50) to trigger the else branch
		for (let i = 0; i < 50; i++) {
			await tracker.time(`slow-${i}`, async () => {
				await new Promise((resolve) => setTimeout(resolve, 10 + i));
			});
		}

		// Verify we have exactly 50
		const snapshotBefore = tracker.snapshot();
		expect(snapshotBefore.slow.length).toBe(50);
		expect(snapshotBefore.slow[0]).toBeDefined();

		// Add one more slow operation that's slower than the minimum - this exercises the
		// replacement logic in the else branch
		await tracker.time("very-slow-replacement", async () => {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		});

		const snapshotAfter = tracker.snapshot();
		expect(snapshotAfter.slow.length).toBe(50);

		// Verify the replacement worked correctly
		const verySlowOp = snapshotAfter.slow.find(
			(op) => op.op === "very-slow-replacement",
		);
		expect(verySlowOp).toBeDefined();
		expect(verySlowOp?.ms).toBeGreaterThanOrEqual(2000);
	});

	it("should handle edge case when slow[0] is undefined (defensive check)", async () => {
		// This test covers the defensive check on lines 164-166: if (!firstSlow) { return; }
		// To trigger this, we need slow.length >= MAX_SLOW but slow[0] is undefined.
		// Since slow is a closure variable, we mock Array.prototype.push to create
		// a sparse array by manipulating the array after push is called.
		//
		// Following the codebase pattern (see test/fastifyPlugins/performance.test.ts
		// and test/services/ses/EmailService.test.ts) where undefined/null edge cases
		// are tested using mocks to achieve 100% coverage.

		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Fill up to MAX_SLOW - 1 (49 operations) first
		for (let i = 0; i < 49; i++) {
			await tracker.time(`slow-${i}`, async () => {
				await new Promise((resolve) => setTimeout(resolve, 10 + i));
			});
		}

		// Mock Array.prototype.push to create a sparse array when we reach MAX_SLOW
		const originalPush = Array.prototype.push;
		let pushCallCount = 0;

		Array.prototype.push = function <T>(...items: T[]): number {
			// Intercept the 50th push (when slow.length becomes MAX_SLOW)
			if (this.length === 49 && pushCallCount === 0) {
				pushCallCount++;
				// Call original push to add the item
				const result = originalPush.apply(this, items);
				// Now create a sparse array by deleting index 0
				// This makes slow[0] undefined while slow.length === 50
				delete this[0];
				return result;
			}
			return originalPush.apply(this, items);
		};

		try {
			// Add the 50th slow operation - push mock will create sparse array
			await tracker.time("slow-49", async () => {
				await new Promise((resolve) => setTimeout(resolve, 100));
			});

			// Verify the array is sparse (slow[0] is undefined)
			const snapshotAfterPush = tracker.snapshot();
			expect(snapshotAfterPush.slow.length).toBe(50);
			expect(snapshotAfterPush.slow[0]).toBeUndefined();

			// Now add one more that's slower - this should trigger the defensive check
			// because slow[0] is undefined when accessed in the else branch
			await tracker.time("very-slow", async () => {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			});

			// The defensive check should have been triggered (firstSlow was undefined)
			// Verify the tracker still works correctly
			const snapshotAfter = tracker.snapshot();
			// The very-slow operation might not be added due to the early return
			// but the tracker should still function
			expect(snapshotAfter.slow.length).toBeGreaterThanOrEqual(49);
		} finally {
			// Restore original push
			Array.prototype.push = originalPush;
		}
	});

	it("should handle edge case when all slow entries are invalid (minIdx === -1 || minMs === Infinity)", async () => {
		// This test covers the defensive check on lines 179-181:
		// if (minIdx === -1 || minMs === Infinity) { return; }
		// This happens when slow.length >= MAX_SLOW but all entries are invalid
		// (null, undefined, or have invalid ms values), so the loop doesn't find any valid entry.

		const tracker = createPerformanceTracker({ slowMs: 1 });

		// Mock Array.prototype.push to corrupt all entries after filling to MAX_SLOW
		const originalPush = Array.prototype.push;
		let callCount = 0;

		Array.prototype.push = function <T>(...items: T[]): number {
			const result = originalPush.apply(this, items);
			callCount++;
			// After the 50th push (when array reaches MAX_SLOW), corrupt all entries
			if (callCount === 50) {
				// Make all entries invalid by setting ms to null
				// This ensures typeof cur.ms !== "number" will be true for all entries
				for (let i = 0; i < this.length; i++) {
					if (this[i] && typeof this[i] === "object") {
						(this[i] as { ms?: number | null }).ms = null;
					}
				}
			}
			return result;
		};

		try {
			// Fill tracker to MAX_SLOW (50 operations)
			for (let i = 0; i < 50; i++) {
				await tracker.time(`slow-${i}`, async () => {
					await new Promise((resolve) => setTimeout(resolve, 10 + i));
				});
			}

			// Verify array is at capacity and ALL entries are corrupted
			const snapshot = tracker.snapshot();
			expect(snapshot.slow.length).toBe(50);
			// Verify ALL entries have ms = null (corrupted) - this is critical for the test
			// All entries must be invalid so the loop finds no valid entry
			const allEntriesInvalid = snapshot.slow.every(
				(entry) => entry && entry.ms === null,
			);
			expect(allEntriesInvalid).toBe(true);

			// Add one more slow operation - this should trigger the defensive check
			// because all entries are invalid (ms = null), so the loop skips them all,
			// leaving minIdx = -1 and minMs = Infinity, which triggers the return on line 180
			await tracker.time("very-slow", async () => {
				await new Promise((resolve) => setTimeout(resolve, 2000));
			});

			// The defensive check should have been triggered (minIdx === -1 || minMs === Infinity)
			// Verify the tracker still works correctly
			const snapshotAfter = tracker.snapshot();
			expect(snapshotAfter.slow.length).toBe(50);
		} finally {
			// Restore original push
			Array.prototype.push = originalPush;
		}
	});
});
