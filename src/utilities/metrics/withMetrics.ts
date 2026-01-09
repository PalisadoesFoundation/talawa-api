import type { PerformanceTracker } from "./performanceTracker";

/**
 * Wraps a DataLoader batch function with performance tracking.
 * Tracks the duration of database operations for monitoring.
 *
 * @param op - Operation name for tracking (e.g., "users.byId", "organizations.byId")
 * @param perf - Performance tracker instance
 * @param batchFn - The original batch function that fetches data
 * @returns A wrapped batch function that tracks performance
 *
 * @example
 * ```typescript
 * const meteredBatch = wrapBatchWithMetrics("users.byId", perf, batchFn);
 * return new DataLoader(meteredBatch);
 * ```
 */
export function wrapBatchWithMetrics<K, V>(
	op: string,
	perf: PerformanceTracker,
	batchFn: (keys: readonly K[]) => Promise<(V | null)[]>,
): (keys: readonly K[]) => Promise<(V | null)[]> {
	return async (keys: readonly K[]) => {
		// Validate operation name before prepending "db:" prefix
		// This ensures the error is thrown when the wrapped function is called
		if (!op || !op.trim()) {
			throw new Error("Operation name cannot be empty or whitespace");
		}
		return perf.time(`db:${op}`, async () => batchFn(keys));
	};
}
