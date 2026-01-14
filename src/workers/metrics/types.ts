/**
 * Metrics for a specific operation type.
 */
export interface OperationMetrics {
	/** Operation name */
	operation: string;
	/** Total number of executions */
	count: number;
	/** Total time in milliseconds */
	totalMs: number;
	/** Average time per execution in milliseconds */
	avgMs: number;
	/**
	 * Minimum of per-snapshot maximum durations in milliseconds.
	 * This represents the smallest maximum duration observed across all snapshots,
	 * not the true minimum operation duration (which requires tracking individual operations).
	 */
	minMaxMs: number;
	/**
	 * Maximum of per-snapshot maximum durations in milliseconds.
	 * This represents the largest maximum duration observed across all snapshots.
	 */
	maxMaxMs: number;
	/** Median execution time in milliseconds (p50) */
	medianMs: number;
	/** 95th percentile execution time in milliseconds (p95) */
	p95Ms: number;
	/** 99th percentile execution time in milliseconds (p99) */
	p99Ms: number;
}

/**
 * Aggregated cache metrics.
 */
export interface CacheMetrics {
	/** Total cache hits */
	totalHits: number;
	/** Total cache misses */
	totalMisses: number;
	/** Overall cache hit rate (0-1) */
	hitRate: number;
	/** Total cache operations */
	totalOps: number;
}

/**
 * Time series metrics for tracking trends over time.
 */
export interface TimeSeriesMetrics {
	/** Timestamp when metrics were aggregated */
	timestamp: number;
	/** Time window in minutes for this aggregation */
	windowMinutes: number;
	/** Number of snapshots included in this aggregation */
	snapshotCount: number;
}

/**
 * Aggregated performance metrics from multiple request snapshots.
 */
export interface AggregatedMetrics extends TimeSeriesMetrics {
	/** Overall request statistics */
	requests: {
		/** Total number of requests */
		count: number;
		/** Average total request time in milliseconds */
		avgTotalMs: number;
		/** Minimum total request time in milliseconds */
		minTotalMs: number;
		/** Maximum total request time in milliseconds */
		maxTotalMs: number;
		/** Median total request time in milliseconds (p50) */
		medianTotalMs: number;
		/** 95th percentile total request time in milliseconds (p95) */
		p95TotalMs: number;
		/** 99th percentile total request time in milliseconds (p99) */
		p99TotalMs: number;
	};
	/** Aggregated cache metrics */
	cache: CacheMetrics;
	/** Metrics grouped by operation type */
	operations: OperationMetrics[];
	/** Slow operations summary */
	slowOperations: {
		/** Total number of slow operations */
		count: number;
		/** Slow operations grouped by operation name */
		byOperation: Record<string, number>;
	};
	/** GraphQL complexity metrics (if available) */
	complexity?: {
		/** Average complexity score */
		avgScore: number;
		/** Minimum complexity score */
		minScore: number;
		/** Maximum complexity score */
		maxScore: number;
		/** Number of requests with complexity tracking */
		count: number;
	};
}
