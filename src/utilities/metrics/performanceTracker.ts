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
	/** Complexity score (for GraphQL complexity tracking) */
	score?: number;
};

/**
 * Snapshot of performance metrics for a single request.
 */
export type PerfSnapshot = {
	/** Total time spent across all operations in milliseconds */
	totalMs: number;
	/** Total number of operations tracked */
	totalOps: number;
	/** Number of cache hits */
	cacheHits: number;
	/** Number of cache misses */
	cacheMisses: number;
	/** Cache hit rate (hits / (hits + misses)) */
	hitRate: number;
	/** Statistics for each operation type */
	ops: Record<string, OpStats>;
	/** Slow operations that exceeded the threshold */
	slow: Array<{ op: string; ms: number }>;
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
	 * Record a GraphQL query complexity score.
	 * @param score - Complexity score for the query
	 */
	trackComplexity(score: number): void;

	/**
	 * Get a snapshot of current performance metrics.
	 * @returns Performance snapshot
	 */
	snapshot(): PerfSnapshot;
}

/**
 * Options for creating a performance tracker.
 */
export interface PerformanceTrackerOptions {
	/**
	 * Threshold in milliseconds for considering an operation as slow.
	 * Operations exceeding this threshold will be added to the slow array.
	 * Defaults to 200ms if not provided.
	 */
	slowMs?: number;
}

/**
 * Maximum number of slow operations to retain in memory.
 * When this limit is reached, only operations slower than the current minimum are added.
 */
const MAX_SLOW = 50;

/**
 * Creates a performance tracker for request-level metrics.
 * Tracks operations, cache hits/misses, and provides snapshots.
 *
 * @param opts - Optional configuration for the tracker
 * @returns A new performance tracker instance
 */
export function createPerformanceTracker(
	opts?: PerformanceTrackerOptions,
): PerformanceTracker {
	const slowMs = opts?.slowMs ?? 200;
	const ops: Record<string, OpStats> = {};
	const slow: Array<{ op: string; ms: number }> = [];
	let cacheHits = 0;
	let cacheMisses = 0;
	let totalMs = 0;
	let totalOps = 0;

	/**
	 * Ensure an operation entry exists in the ops record.
	 */
	const ensure = (key: string): OpStats => {
		if (!ops[key]) {
			ops[key] = { count: 0, ms: 0, max: 0 };
		}
		return ops[key];
	};

	/**
	 * Validates an operation name.
	 */
	const validateOp = (op: string): void => {
		if (!op || !op.trim()) {
			throw new Error("Operation name cannot be empty or whitespace");
		}
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
		totalOps++;
		// Track slow operations with bounded insertion
		if (ms >= slowMs) {
			const roundedMs = Math.ceil(ms);
			if (slow.length < MAX_SLOW) {
				// Still have room, just push
				slow.push({ op: k, ms: roundedMs });
			} else {
				// Find the minimum slow operation using the same rounding convention
				// Defensive: handle sparse arrays and invalid entries
				let minIdx = -1;
				let minMs = Infinity;

				for (let i = 0; i < slow.length; i++) {
					const cur = slow[i];
					// Skip sparse/invalid entries
					if (!cur || typeof cur.ms !== "number") {
						continue;
					}
					// Use same rounding for comparison (values are already rounded when stored,
					// but we ensure consistency by using the stored rounded value)
					const curMs = cur.ms;
					if (curMs < minMs) {
						minMs = curMs;
						minIdx = i;
					}
				}

				// If we couldn't find a valid entry, do nothing (defensive)
				if (minIdx === -1 || minMs === Infinity) {
					return;
				}

				// Only replace when the new duration is strictly greater than the current minimum.
				// If roundedMs <= minMs, do not add/replace.
				if (roundedMs <= minMs) {
					return;
				}

				// Replace the minimum entry with the new slow op
				slow[minIdx] = { op: k, ms: roundedMs };
			}
		}
	};

	return {
		async time<T>(op: string, fn: () => Promise<T>): Promise<T> {
			validateOp(op);
			const t0 = performance.now();
			try {
				return await fn();
			} finally {
				record(op, performance.now() - t0);
			}
		},

		start(op: string): () => void {
			validateOp(op);
			const t0 = performance.now();
			return () => record(op, performance.now() - t0);
		},

		trackDb(ms: number): void {
			if (!Number.isFinite(ms) || ms < 0) {
				return; // Ignore invalid values
			}
			record("db", ms);
		},

		trackCacheHit(): void {
			cacheHits++;
		},

		trackCacheMiss(): void {
			cacheMisses++;
		},

		trackComplexity(score: number): void {
			if (!Number.isFinite(score) || score < 0) {
				return; // Ignore invalid values
			}
			const op = ensure("gql:complexity");
			// Store the complexity score (not execution time)
			op.score = score;
		},

		snapshot(): PerfSnapshot {
			const totalCacheOps = cacheHits + cacheMisses;
			const hitRate = totalCacheOps > 0 ? cacheHits / totalCacheOps : 0;

			return {
				totalMs: Math.round(totalMs),
				totalOps,
				cacheHits,
				cacheMisses,
				hitRate,
				ops: structuredClone(ops),
				slow: slow.slice(), // Already bounded to MAX_SLOW during accumulation
			};
		},
	};
}
