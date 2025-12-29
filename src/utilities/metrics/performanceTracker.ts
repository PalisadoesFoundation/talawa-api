/**
 * Performance tracking types and utilities for request-level performance monitoring.
 */

/**
 * Statistics for a specific operation type.
 */
export type OpStats = {
	/** Number of times this operation was executed */
	count: number;
	/** Total time in milliseconds across all executions */
	ms: number;
	/** Maximum time in milliseconds for a single execution */
	max: number;
};

/**
 * Snapshot of performance metrics for a single request.
 */
export type PerfSnapshot = {
	/** Total time spent across all operations in milliseconds */
	totalMs: number;
	/** Number of cache hits */
	cacheHits: number;
	/** Number of cache misses */
	cacheMiss: number;
	/** Statistics for each operation type */
	ops: Record<string, OpStats>;
};

/**
 * Performance tracker for monitoring request-level performance.
 */
export interface PerformanceTracker {
	/**
	 * Time an async operation and record its duration.
	 * @param op - Name of the operation being timed
	 * @param fn - Async function to execute and measure
	 * @returns The result of the async function
	 */
	time<T>(op: string, fn: () => Promise<T>): Promise<T>;

	/**
	 * Start timing an operation manually. Returns a function to call when the operation completes.
	 * @param op - Name of the operation being timed
	 * @returns Function to call when the operation completes
	 */
	start(op: string): () => void;

	/**
	 * Record a database operation duration.
	 * @param ms - Duration in milliseconds
	 */
	trackDb(ms: number): void;

	/**
	 * Record a cache hit.
	 */
	trackCacheHit(): void;

	/**
	 * Record a cache miss.
	 */
	trackCacheMiss(): void;

	/**
	 * Get a snapshot of current performance metrics.
	 * @returns Performance snapshot
	 */
	snapshot(): PerfSnapshot;
}

/**
 * Create a new performance tracker for a request.
 * @param _slowMs - Threshold in milliseconds to consider an operation slow (unused in current implementation, reserved for future use)
 * @returns Performance tracker instance
 */
export function createPerformanceTracker(_slowMs = 200): PerformanceTracker {
	const ops: Record<string, OpStats> = {};
	let cacheHits = 0;
	let cacheMiss = 0;
	let totalMs = 0;

	/**
	 * Ensure an operation entry exists in the ops record.
	 */
	const ensure = (k: string): OpStats => {
		if (!ops[k]) {
			ops[k] = { count: 0, ms: 0, max: 0 };
		}
		return ops[k];
	};

	/**
	 * Record an operation's duration.
	 */
	const record = (k: string, ms: number): void => {
		const o = ensure(k);
		o.count++;
		o.ms += ms;
		o.max = Math.max(o.max, ms);
		totalMs += ms;
	};

	return {
		async time<T>(op: string, fn: () => Promise<T>): Promise<T> {
			const t0 = performance.now();
			try {
				return await fn();
			} finally {
				record(op, performance.now() - t0);
			}
		},

		start(op: string): () => void {
			const t0 = performance.now();
			return () => record(op, performance.now() - t0);
		},

		trackDb(ms: number): void {
			record("db", ms);
		},

		trackCacheHit(): void {
			cacheHits++;
		},

		trackCacheMiss(): void {
			cacheMiss++;
		},

		snapshot(): PerfSnapshot {
			// Deep copy ops to ensure snapshot independence
			const opsCopy: Record<string, OpStats> = {};
			for (const [key, value] of Object.entries(ops)) {
				opsCopy[key] = { ...value };
			}

			return {
				totalMs,
				cacheHits,
				cacheMiss,
				ops: opsCopy,
			};
		},
	};
}
