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
	/** GraphQL query complexity score (if tracked) */
	complexityScore?: number;
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
 * Creates a performance tracker for request-level metrics.
 * Tracks operations, cache hits/misses, and provides snapshots.
 *
 * @returns A new performance tracker instance
 */
export function createPerformanceTracker(): PerformanceTracker {
	const ops: Record<string, OpStats> = {};
	let cacheHits = 0;
	let cacheMisses = 0;
	let totalOps = 0;
	let complexityScore: number | undefined;

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
		totalOps++;
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
			// Store the complexity score separately from timing metrics
			complexityScore = score;
		},

		snapshot(): PerfSnapshot {
			const totalCacheOps = cacheHits + cacheMisses;
			const hitRate = totalCacheOps > 0 ? cacheHits / totalCacheOps : 0;

			// Calculate totalMs from ops to ensure accuracy (sum of all operation durations)
			const calculatedTotalMs = Object.values(ops).reduce(
				(sum, op) => sum + op.ms,
				0,
			);

			return {
				totalMs: Math.ceil(calculatedTotalMs),
				totalOps,
				cacheHits,
				cacheMisses,
				hitRate,
				ops: structuredClone(ops),
				...(complexityScore !== undefined && { complexityScore }),
			};
		},
	};
}
