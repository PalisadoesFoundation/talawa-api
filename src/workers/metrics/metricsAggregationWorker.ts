import type { FastifyBaseLogger } from "fastify";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";
import type {
	AggregatedMetrics,
	CacheMetrics,
	OperationMetrics,
} from "./types";

/**
 * Calculates percentile value from a sorted array of numbers.
 *
 * @param sortedValues - Array of numbers sorted in ascending order
 * @param percentile - Percentile to calculate (0-100)
 * @returns The percentile value
 */
function calculatePercentile(
	sortedValues: number[],
	percentile: number,
): number {
	if (sortedValues.length === 0) {
		return 0;
	}

	if (sortedValues.length === 1) {
		return sortedValues[0] ?? 0;
	}

	const index = (percentile / 100) * (sortedValues.length - 1);
	const lower = Math.floor(index);
	const upper = Math.ceil(index);
	const weight = index - lower;

	const lowerValue = sortedValues[lower] ?? 0;
	const upperValue = sortedValues[upper] ?? 0;

	return lowerValue + weight * (upperValue - lowerValue);
}

/**
 * Aggregates metrics for a specific operation type from multiple snapshots.
 *
 * Note: Since PerfSnapshot only provides aggregate stats per operation type
 * (not individual operation durations), we approximate percentiles by treating
 * each snapshot's average operation duration as a data point. This provides
 * useful metrics while working within the constraints of the available data.
 *
 * For min/max bounds, we track the minimum and maximum of per-snapshot maximum
 * durations (minMaxMs and maxMaxMs), not true per-operation minima/maxima,
 * since individual operation durations are not tracked in PerfSnapshot.
 *
 * @param operationName - Name of the operation
 * @param snapshots - Array of performance snapshots
 * @returns Aggregated operation metrics
 */
function aggregateOperationMetrics(
	operationName: string,
	snapshots: PerfSnapshot[],
): OperationMetrics {
	let totalMs = 0;
	let totalCount = 0;
	const avgDurations: number[] = [];
	const maxDurations: number[] = [];

	for (const snapshot of snapshots) {
		const opStats = snapshot.ops[operationName];
		if (opStats && opStats.count > 0) {
			totalMs += opStats.ms;
			totalCount += opStats.count;
			// Use average duration per operation in this snapshot as a data point
			const avgDuration = opStats.ms / opStats.count;
			avgDurations.push(avgDuration);
			maxDurations.push(opStats.max);
		}
	}

	avgDurations.sort((a, b) => a - b);
	maxDurations.sort((a, b) => a - b);

	const avgTotalMs = totalCount > 0 ? totalMs / totalCount : 0;
	// Minimum of per-snapshot maximum durations
	const minMaxMs = maxDurations.length > 0 ? (maxDurations[0] ?? 0) : 0;
	// Maximum of per-snapshot maximum durations
	const maxMaxMs =
		maxDurations.length > 0 ? (maxDurations[maxDurations.length - 1] ?? 0) : 0;

	return {
		operation: operationName,
		count: totalCount,
		totalMs: Math.round(totalMs),
		avgMs: Math.round(avgTotalMs),
		minMaxMs: Math.round(minMaxMs),
		maxMaxMs: Math.round(maxMaxMs),
		medianMs:
			avgDurations.length > 0
				? Math.round(calculatePercentile(avgDurations, 50))
				: 0,
		p95Ms:
			avgDurations.length > 0
				? Math.round(calculatePercentile(avgDurations, 95))
				: 0,
		p99Ms:
			avgDurations.length > 0
				? Math.round(calculatePercentile(avgDurations, 99))
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
		hitRate,
		totalOps,
	};
}

/**
 * Aggregates slow operations from multiple snapshots.
 *
 * @param snapshots - Array of performance snapshots
 * @returns Slow operations summary
 */
function aggregateSlowOperations(snapshots: PerfSnapshot[]): {
	count: number;
	byOperation: Record<string, number>;
} {
	const byOperation: Record<string, number> = {};
	let totalCount = 0;

	for (const snapshot of snapshots) {
		for (const slowOp of snapshot.slow) {
			totalCount++;
			byOperation[slowOp.op] = (byOperation[slowOp.op] ?? 0) + 1;
		}
	}

	return {
		count: totalCount,
		byOperation,
	};
}

/**
 * Aggregates GraphQL complexity metrics from snapshots that have complexity scores.
 *
 * @param snapshots - Array of performance snapshots
 * @returns Complexity metrics or undefined if no snapshots have complexity scores
 */
function aggregateComplexityMetrics(
	snapshots: PerfSnapshot[],
): AggregatedMetrics["complexity"] | undefined {
	const complexityScores: number[] = [];

	for (const snapshot of snapshots) {
		if (snapshot.complexityScore !== undefined) {
			complexityScores.push(snapshot.complexityScore);
		}
	}

	if (complexityScores.length === 0) {
		return undefined;
	}

	const total = complexityScores.reduce((sum, score) => sum + score, 0);
	const minScore = Math.min(...complexityScores);
	const maxScore = Math.max(...complexityScores);

	return {
		avgScore: total / complexityScores.length,
		minScore,
		maxScore,
		count: complexityScores.length,
	};
}

/**
 * Runs the metrics aggregation worker to collect and aggregate performance snapshots.
 *
 * @param snapshotGetter - Function to retrieve performance snapshots (from performance plugin)
 * @param windowMinutes - Time window in minutes for filtering snapshots (default: 5)
 * @param logger - Fastify logger instance
 * @returns Aggregated metrics or undefined if no snapshots available
 */
export async function runMetricsAggregationWorker(
	snapshotGetter: (windowMinutes?: number) => PerfSnapshot[],
	windowMinutes: number,
	logger: FastifyBaseLogger,
): Promise<AggregatedMetrics | undefined> {
	const startTime = Date.now();

	try {
		// Get snapshots within the specified time window
		const snapshots = snapshotGetter(windowMinutes);

		if (snapshots.length === 0) {
			logger.debug(
				{
					windowMinutes,
				},
				"No snapshots available for metrics aggregation",
			);
			return undefined;
		}

		// Aggregate request-level metrics
		const totalMsValues = snapshots.map((s) => s.totalMs).sort((a, b) => a - b);
		const totalMsSum = totalMsValues.reduce((sum, ms) => sum + ms, 0);
		const requestCount = snapshots.length;

		// Aggregate cache metrics
		const cache = aggregateCacheMetrics(snapshots);

		// Collect all unique operation names
		const operationNames = new Set<string>();
		for (const snapshot of snapshots) {
			for (const opName of Object.keys(snapshot.ops)) {
				operationNames.add(opName);
			}
		}

		// Aggregate metrics for each operation type
		const operations: OperationMetrics[] = Array.from(operationNames)
			.map((opName) => aggregateOperationMetrics(opName, snapshots))
			.filter((op) => op.count > 0)
			.sort((a, b) => b.totalMs - a.totalMs); // Sort by total time descending

		// Aggregate slow operations
		const slowOperations = aggregateSlowOperations(snapshots);

		// Aggregate complexity metrics
		const complexity = aggregateComplexityMetrics(snapshots);

		// Build aggregated metrics
		const metrics: AggregatedMetrics = {
			timestamp: Date.now(),
			windowMinutes,
			snapshotCount: snapshots.length,
			requests: {
				count: requestCount,
				avgTotalMs: Math.round(totalMsSum / requestCount),
				minTotalMs: totalMsValues[0] ?? 0,
				maxTotalMs: totalMsValues[totalMsValues.length - 1] ?? 0,
				medianTotalMs: Math.round(calculatePercentile(totalMsValues, 50)),
				p95TotalMs: Math.round(calculatePercentile(totalMsValues, 95)),
				p99TotalMs: Math.round(calculatePercentile(totalMsValues, 99)),
			},
			cache,
			operations,
			slowOperations,
			...(complexity && { complexity }),
		};

		const duration = Date.now() - startTime;
		logger.info(
			{
				duration: `${duration}ms`,
				windowMinutes,
				snapshotCount: snapshots.length,
				requestCount: metrics.requests.count,
				operationCount: operations.length,
				slowOperationCount: slowOperations.count,
				cacheHitRate: `${(cache.hitRate * 100).toFixed(2)}%`,
			},
			"Metrics aggregation completed successfully",
		);

		return metrics;
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error(
			{
				duration: `${duration}ms`,
				windowMinutes,
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			},
			"Metrics aggregation worker failed",
		);
		throw error;
	}
}
