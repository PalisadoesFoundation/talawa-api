/**
 * Statistics for a specific operation type aggregated across multiple snapshots.
 */
export interface OperationMetrics {
	/** Number of times this operation was executed */
	count: number;
	/** Total time in milliseconds across all executions */
	totalMs: number;
	/** Average time in milliseconds per execution */
	avgMs: number;
	/** Minimum time in milliseconds for a single execution */
	minMs: number;
	/** Maximum time in milliseconds for a single execution */
	maxMs: number;
	/** Median time in milliseconds (p50) */
	medianMs: number;
	/** 95th percentile time in milliseconds (p95) */
	p95Ms: number;
	/** 99th percentile time in milliseconds (p99) */
	p99Ms: number;
}

/**
 * Cache metrics aggregated across multiple snapshots.
 */
export interface CacheMetrics {
	/** Total number of cache hits */
	totalHits: number;
	/** Total number of cache misses */
	totalMisses: number;
	/** Total cache operations (hits + misses) */
	totalOps: number;
	/** Cache hit rate (hits / totalOps) */
	hitRate: number;
}

/**
 * Time series metrics for tracking metrics over time windows.
 */
export interface TimeSeriesMetrics {
	/** Timestamp when this aggregation was performed (milliseconds since epoch) */
	timestamp: number;
	/** Duration of the aggregation window in minutes */
	windowMinutes: number;
	/** Number of snapshots included in this aggregation */
	snapshotCount: number;
}

/**
 * Aggregated metrics for a specific time window.
 * Contains aggregated performance data from multiple request snapshots.
 */
export interface AggregatedMetrics extends TimeSeriesMetrics {
	/** Aggregated metrics for each operation type */
	operations: Record<string, OperationMetrics>;
	/** Aggregated cache metrics */
	cache: CacheMetrics;
	/** Total number of slow operations across all snapshots */
	slowOperationCount: number;
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
	/** Average GraphQL complexity score (if tracked) */
	avgComplexityScore?: number;
}

/**
 * Options for metrics aggregation.
 */
export interface MetricsAggregationOptions {
	/**
	 * Time window in minutes to aggregate snapshots from (default: 5).
	 * @deprecated This parameter is currently not functional since PerfSnapshot doesn't include timestamps.
	 * It is accepted for API compatibility but has no effect on filtering.
	 * The snapshots array is already ordered by recency (most recent first).
	 * Use maxSnapshots to limit the number of snapshots processed.
	 * This will be functional in a future PR when timestamps are added to PerfSnapshot.
	 */
	windowMinutes?: number;
	/** Maximum number of snapshots to process (default: 1000) */
	maxSnapshots?: number;
	/** Threshold in milliseconds for considering an operation as slow (default: 200) */
	slowThresholdMs?: number;
}

/**
 * Result of a metrics aggregation run.
 */
export interface MetricsAggregationResult {
	/** The aggregated metrics */
	metrics: AggregatedMetrics;
	/** Number of snapshots processed */
	snapshotsProcessed: number;
	/** Duration of aggregation in milliseconds */
	aggregationDurationMs: number;
}
