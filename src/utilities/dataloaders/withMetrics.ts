import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Wraps a DataLoader batch function to track performance metrics.
 *
 * @param op - The operation name (e.g., "users.byId", "organizations.byId")
 * @param perf - The performance tracker instance
 * @param batchFn - The original batch function to wrap
 * @returns A wrapped batch function that tracks execution time
 *
 * @example
 * ```typescript
 * const wrappedBatch = wrapBatchWithMetrics(
 *   "users.byId",
 *   ctx.perf,
 *   async (ids) => { ... }
 * );
 * return new DataLoader(wrappedBatch);
 * ```
 */
export function wrapBatchWithMetrics<K, V>(
	op: string,
	perf: PerformanceTracker,
	batchFn: (keys: readonly K[]) => Promise<readonly (V | null)[]>,
): (keys: readonly K[]) => Promise<readonly (V | null)[]> {
	return async (keys: readonly K[]) => {
		return perf.time(`dataloader:${op}`, async () => batchFn(keys));
	};
}
