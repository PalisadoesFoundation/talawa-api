import { describe, expect, it, vi } from "vitest";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { wrapBatchWithMetrics } from "~/src/utilities/metrics/withMetrics";

describe("wrapBatchWithMetrics", () => {
	it("should wrap batch function and track timing", async () => {
		const perf = createPerformanceTracker();
		const batchFn = vi.fn().mockResolvedValue(["result1", "result2"]);

		const wrapped = wrapBatchWithMetrics("test.byId", perf, batchFn);
		const result = await wrapped(["id1", "id2"]);

		expect(result).toEqual(["result1", "result2"]);
		expect(batchFn).toHaveBeenCalledTimes(1);
		expect(batchFn).toHaveBeenCalledWith(["id1", "id2"]);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["db:test.byId"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);
	});

	it("should handle batch function errors and still track timing", async () => {
		const perf = createPerformanceTracker();
		const batchFn = vi.fn().mockRejectedValue(new Error("Batch error"));

		const wrapped = wrapBatchWithMetrics("test.byId", perf, batchFn);

		await expect(wrapped(["id1"])).rejects.toThrow("Batch error");

		const snapshot = perf.snapshot();
		const op = snapshot.ops["db:test.byId"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should track multiple batch calls separately", async () => {
		const perf = createPerformanceTracker();
		const batchFn = vi.fn().mockResolvedValue(["result"]);

		const wrapped = wrapBatchWithMetrics("test.byId", perf, batchFn);

		await wrapped(["id1"]);
		await wrapped(["id2"]);

		const snapshot = perf.snapshot();
		const op = snapshot.ops["db:test.byId"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(2);
	});

	it("should preserve batch function return values", async () => {
		const perf = createPerformanceTracker();
		const batchFn = vi.fn().mockResolvedValue([null, "result", null]);

		const wrapped = wrapBatchWithMetrics("test.byId", perf, batchFn);
		const result = await wrapped(["id1", "id2", "id3"]);

		expect(result).toEqual([null, "result", null]);
	});
});
