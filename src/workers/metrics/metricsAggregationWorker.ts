import type { FastifyBaseLogger } from "fastify";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";
import type {
	AggregatedMetrics,
	CacheMetrics,
	MetricsAggregationOptions,
	MetricsAggregationResult,
	OperationMetrics,
} from "./types";

/**
 * Calculates a percentile value from a sorted array of numbers.
 * Uses linear interpolation between adjacent values for more accurate results.
 *
 * @param sortedValues - Array of numbers sorted in ascending order (must be non-empty)
 * @param percentile - Percentile to calculate (0-100)
 * @returns The percentile value
 * @throws Error if sortedValues is empty
 */
export function calculatePercentile(
	sortedValues: number[],
	percentile: number,
): number {
	if (sortedValues.length === 0) {
		throw new Error("Cannot calculate percentile from empty array");
	}

	if (sortedValues.length === 1) {
		return sortedValues[0] ?? 0;
	}

	// Clamp percentile to valid range
	const clampedPercentile = Math.max(0, Math.min(100, percentile));

	const index = (clampedPercentile / 100) * (sortedValues.length - 1);
	const lower = Math.floor(index);
	const upper = Math.ceil(index);
	const weight = index - lower;

	const lowerValue = sortedValues[lower];
	const upperValue = sortedValues[upper];

	// Handle edge case where lower === upper (exact index)
	if (lower === upper || lowerValue === undefined || upperValue === undefined) {
		return lowerValue ?? upperValue ?? 0;
	}

	return lowerValue + weight * (upperValue - lowerValue);
}

/**
 * Creates an empty/default AggregatedMetrics object with all fields set to zero or empty values.
 * Useful for cases where no snapshots are available or as a starting point for aggregation.
 *
 * @param options - Options for creating the empty metrics. Contains windowMinutes (default: 5), timestamp (default: current time), and snapshotCount (default: 0).
 * @returns An empty AggregatedMetrics object with all fields initialized to default values
 */
export function createEmptyAggregatedMetrics(
	options: {
		windowMinutes?: number;
		timestamp?: number;
		snapshotCount?: number;
	} = {},
): AggregatedMetrics {
	const {
		windowMinutes = 5,
		timestamp = Date.now(),
		snapshotCount = 0,
	} = options;

	return {
		timestamp,
		windowMinutes,
		snapshotCount,
		operations: {},
		cache: {
			totalHits: 0,
			totalMisses: 0,
			totalOps: 0,
			hitRate: 0,
		},
		slowOperationCount: 0,
		avgTotalMs: 0,
		minTotalMs: 0,
		maxTotalMs: 0,
		medianTotalMs: 0,
		p95TotalMs: 0,
		p99TotalMs: 0,
	};
}

/**
 * Aggregates operation metrics from multiple snapshots.
 * Since we only have aggregated stats per snapshot (not individual durations),
 * we use max values from snapshots and slow operations for percentile calculations.
 *
 * @param snapshots - Array of performance snapshots
 * @param operationName - Name of the operation to aggregate
 * @returns Aggregated operation metrics
 */
function aggregateOperationMetrics(
	snapshots: PerfSnapshot[],
	operationName: string,
): OperationMetrics {
	let totalCount = 0;
	let totalMs = 0;
	const maxValues: number[] = [];
	const slowOperationDurations: number[] = [];

	for (const snapshot of snapshots) {
		const opStats = snapshot.ops[operationName];
		if (opStats && opStats.count > 0) {
			totalCount += opStats.count;
			totalMs += opStats.ms;
			// Collect max values for percentile calculation
			if (opStats.max > 0) {
				maxValues.push(opStats.max);
			}
		}

		// Collect slow operation durations for this operation
		for (const slow of snapshot.slow) {
			if (slow.op === operationName) {
				slowOperationDurations.push(slow.ms);
			}
		}
	}

	if (totalCount === 0) {
		return {
			count: 0,
			totalMs: 0,
			avgMs: 0,
			minMs: 0,
			maxMs: 0,
			medianMs: 0,
			p95Ms: 0,
			p99Ms: 0,
		};
	}

	// Filter max values once to avoid redundant filtering operations
	const filteredMaxValues = maxValues.filter(
		(v) => Number.isFinite(v) && v >= 0,
	);

	// Filter slow operation durations
	const filteredSlowDurations = slowOperationDurations.filter(
		(val) => Number.isFinite(val) && val >= 0,
	);

	// Combine max values and slow operation durations for percentile calculation
	// This gives us a better representation of operation duration distribution
	const allDurations = [...filteredMaxValues, ...filteredSlowDurations].sort(
		(a, b) => a - b,
	);

	const avgMs =
		totalCount > 0 && Number.isFinite(totalMs / totalCount)
			? totalMs / totalCount
			: 0;
	// Note: minMax is the minimum of per-snapshot max values from PerfSnapshot.ops,
	// not the actual minimum operation duration (individual operation durations are not available in PerfSnapshot)
	const minMax =
		filteredMaxValues.length > 0 ? Math.min(...filteredMaxValues) : 0;
	// Note: maxMax is the maximum of per-snapshot max values from PerfSnapshot.ops,
	// not the actual maximum operation duration (individual operation durations are not available in PerfSnapshot)
	const maxMax =
		filteredMaxValues.length > 0 ? Math.max(...filteredMaxValues) : 0;

	// Calculate percentiles from the combined duration array
	// If we have slow operations, they provide more accurate percentile data
	// Fallback to avgMs only if we have no other data points
	// Note: filteredMaxValues check is unnecessary since allDurations includes filteredMaxValues
	const percentileSource =
		allDurations.length > 0 ? allDurations : avgMs > 0 ? [avgMs] : [];

	// Only calculate percentiles if we have data points
	const hasPercentileData = percentileSource.length > 0;

	return {
		count: totalCount,
		totalMs: Math.round(totalMs),
		avgMs: Math.round(avgMs),
		// minMs is the minimum of per-snapshot max values from PerfSnapshot.ops (approximation, not actual min duration)
		minMs: Math.round(minMax),
		// maxMs is the maximum of per-snapshot max values from PerfSnapshot.ops (approximation, not actual max duration)
		maxMs: Math.round(maxMax),
		medianMs: hasPercentileData
			? Math.round(calculatePercentile(percentileSource, 50))
			: 0,
		p95Ms: hasPercentileData
			? Math.round(calculatePercentile(percentileSource, 95))
			: 0,
		p99Ms: hasPercentileData
			? Math.round(calculatePercentile(percentileSource, 99))
			: 0,
	};
}

/**
 * Aggregates cache metrics from multiple snapshots.
 *
 * @param snapshots - Array of performance snapshots
 * @returns Aggregated cache metrics
 */
function aggregateCacheMetrics(snapshots: PerfSnapshot[]): CacheMetrics {
	let totalHits = 0;
	let totalMisses = 0;

	for (const snapshot of snapshots) {
		totalHits += snapshot.cacheHits;
		totalMisses += snapshot.cacheMisses;
	}

	const totalOps = totalHits + totalMisses;
	const hitRate = totalOps > 0 ? totalHits / totalOps : 0;

	return {
		totalHits,
		totalMisses,
		totalOps,
		hitRate: Math.round(hitRate * 1000) / 1000, // Round to 3 decimal places
	};
}

/**
 * Collects all unique operation names from snapshots.
 *
 * @param snapshots - Array of performance snapshots
 * @returns Set of unique operation names
 */
function collectOperationNames(snapshots: PerfSnapshot[]): Set<string> {
	const operationNames = new Set<string>();

	for (const snapshot of snapshots) {
		for (const opName of Object.keys(snapshot.ops)) {
			operationNames.add(opName);
		}
	}

	return operationNames;
}

/**
 * Aggregates performance metrics from a collection of snapshots.
 *
 * @param snapshots - Array of performance snapshots to aggregate
 * @param options - Aggregation options. Note: windowMinutes is deprecated and not functional since PerfSnapshot lacks timestamps. Use maxSnapshots instead.
 * @returns Aggregated metrics result
 */
export function aggregateMetrics(
	snapshots: PerfSnapshot[],
	options: MetricsAggregationOptions = {},
): MetricsAggregationResult {
	const startTime = Date.now();
	const {
		windowMinutes = 5,
		maxSnapshots = 1000,
		slowThresholdMs = 200,
	} = options;

	// Limit snapshots if needed
	// Note: windowMinutes is deprecated and not used since PerfSnapshot doesn't include timestamps.
	// The snapshots array is already ordered by recency (most recent first), so maxSnapshots
	// effectively limits to the most recent N snapshots.
	const limitedSnapshots = snapshots.slice(0, maxSnapshots);

	// Collect all operation names
	const operationNames = collectOperationNames(limitedSnapshots);

	// Aggregate operations
	const operations: Record<string, OperationMetrics> = {};
	for (const opName of operationNames) {
		operations[opName] = aggregateOperationMetrics(limitedSnapshots, opName);
	}

	// Aggregate cache metrics
	const cache = aggregateCacheMetrics(limitedSnapshots);

	// Calculate total request time statistics
	// Filter out invalid values (NaN, Infinity, negative)
	const totalMsValues = limitedSnapshots
		.map((s) => s.totalMs)
		.filter((ms) => Number.isFinite(ms) && ms >= 0)
		.sort((a, b) => a - b);

	const totalMsSum = totalMsValues.reduce((sum, val) => sum + val, 0);
	const totalMsCount = totalMsValues.length;

	// Count slow operations
	let slowOperationCount = 0;
	for (const snapshot of limitedSnapshots) {
		slowOperationCount += snapshot.slow.filter(
			(slow) => slow.ms >= slowThresholdMs,
		).length;
	}

	// Calculate complexity scores if available
	// Filter out invalid values (NaN, Infinity, negative)
	const complexityScores = limitedSnapshots
		.map((s) => s.complexityScore)
		.filter(
			(score): score is number =>
				score !== undefined && Number.isFinite(score) && score >= 0,
		);

	const avgComplexityScore =
		complexityScores.length > 0
			? complexityScores.reduce((sum, score) => sum + score, 0) /
				complexityScores.length
			: undefined;

	const metrics: AggregatedMetrics = {
		timestamp: Date.now(),
		windowMinutes,
		snapshotCount: limitedSnapshots.length,
		operations,
		cache,
		slowOperationCount,
		avgTotalMs: totalMsCount > 0 ? Math.round(totalMsSum / totalMsCount) : 0,
		minTotalMs: totalMsCount > 0 ? Math.round(totalMsValues[0] ?? 0) : 0,
		maxTotalMs:
			totalMsCount > 0 ? Math.round(totalMsValues[totalMsCount - 1] ?? 0) : 0,
		medianTotalMs:
			totalMsCount > 0 ? Math.round(calculatePercentile(totalMsValues, 50)) : 0,
		p95TotalMs:
			totalMsCount > 0 ? Math.round(calculatePercentile(totalMsValues, 95)) : 0,
		p99TotalMs:
			totalMsCount > 0 ? Math.round(calculatePercentile(totalMsValues, 99)) : 0,
		...(avgComplexityScore !== undefined && {
			avgComplexityScore: Math.round(avgComplexityScore * 100) / 100,
		}),
	};

	const aggregationDurationMs = Date.now() - startTime;

	return {
		metrics,
		snapshotsProcessed: limitedSnapshots.length,
		aggregationDurationMs,
	};
}

/**
 * Runs the metrics aggregation worker.
 * Collects recent performance snapshots and aggregates them into metrics.
 *
 * @param getSnapshots - Function to retrieve recent performance snapshots
 * @param logger - Logger instance for logging
 * @param options - Aggregation options. Note: windowMinutes is deprecated and not functional since PerfSnapshot lacks timestamps. Use maxSnapshots instead.
 * @returns Aggregated metrics result
 */
export function runMetricsAggregationWorker(
	getSnapshots: () => PerfSnapshot[],
	logger: FastifyBaseLogger,
	options: MetricsAggregationOptions = {},
): MetricsAggregationResult {
	const startTime = Date.now();

	try {
		// Get recent snapshots
		const snapshots = getSnapshots();

		if (snapshots.length === 0) {
			logger.info("No snapshots available for aggregation");
			const timestamp = Date.now();
			return {
				metrics: createEmptyAggregatedMetrics({
					windowMinutes: options.windowMinutes,
					timestamp,
					snapshotCount: 0,
				}),
				snapshotsProcessed: 0,
				aggregationDurationMs: timestamp - startTime,
			};
		}

		// Aggregate metrics
		const result = aggregateMetrics(snapshots, options);

		return result;
	} catch (error) {
		// Handle errors from getSnapshots or aggregateMetrics
		const timestamp = Date.now();
		logger.error(
			{
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			},
			"Failed to aggregate metrics",
		);
		return {
			metrics: createEmptyAggregatedMetrics({
				windowMinutes: options.windowMinutes,
				timestamp,
				snapshotCount: 0,
			}),
			snapshotsProcessed: 0,
			aggregationDurationMs: timestamp - startTime,
		};
	}
}
