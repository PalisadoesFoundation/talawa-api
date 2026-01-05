import type { FastifyBaseLogger, FastifyInstance } from "fastify";

/**
 * Parses a cron schedule string to determine the interval in milliseconds.
 * Handles common patterns like "*\/5 * * * *" (every 5 minutes).
 * Falls back to 5 minutes (300000ms) for unrecognized patterns.
 *
 * @param cronSchedule - Cron schedule string (e.g., "*\/5 * * * *")
 * @returns Interval in milliseconds
 */
function parseCronIntervalToMs(cronSchedule: string): number {
	// Default to 5 minutes if schedule is not provided
	if (!cronSchedule) {
		return 5 * 60 * 1000; // 5 minutes in milliseconds
	}

	const parts = cronSchedule.trim().split(/\s+/);
	if (parts.length < 5) {
		return 5 * 60 * 1000; // Default fallback
	}

	// Handle "*/N * * * *" pattern (every N minutes)
	const minutePattern = parts[0];
	if (minutePattern?.startsWith("*/")) {
		const interval = Number.parseInt(minutePattern.slice(2), 10);
		if (!Number.isNaN(interval) && interval > 0) {
			return interval * 60 * 1000; // Convert minutes to milliseconds
		}
	}

	// Handle "0 * * * *" pattern (every hour)
	if (minutePattern === "0" && parts[1] === "*") {
		return 60 * 60 * 1000; // 1 hour in milliseconds
	}

	// Handle "0 0 * * *" pattern (daily)
	if (minutePattern === "0" && parts[1] === "0") {
		return 24 * 60 * 60 * 1000; // 24 hours in milliseconds
	}

	// Default fallback to 5 minutes for unrecognized patterns
	return 5 * 60 * 1000;
}

/**
 * Aggregated performance metrics for a time period.
 */
export interface AggregatedMetrics {
	/** Time period start timestamp */
	periodStart: Date;
	/** Time period end timestamp */
	periodEnd: Date;
	/** Total number of requests in this period */
	totalRequests: number;
	/** Average request duration (ms) */
	avgRequestMs: number;
	/** Average database operation time (ms) */
	avgDbMs: number;
	/** Total cache hits */
	totalCacheHits: number;
	/** Total cache misses */
	totalCacheMisses: number;
	/** Average cache hit rate */
	avgHitRate: number;
	/** Number of slow requests (>500ms) */
	slowRequestCount: number;
	/** Number of high complexity queries (>=100) */
	highComplexityCount: number;
	/** Most common slow operations */
	topSlowOps: Array<{ op: string; avgMs: number; count: number }>;
}

/**
 * Aggregates performance metrics from recent snapshots and logs summary.
 * This worker should be called periodically to provide aggregated performance insights.
 *
 * @param fastify - Fastify instance with perfAggregate data
 * @param logger - Logger instance
 * @returns Aggregated metrics for the period
 */
export async function aggregatePerformanceMetrics(
	fastify: FastifyInstance,
	logger: FastifyBaseLogger,
): Promise<AggregatedMetrics> {
	const agg = fastify.perfAggregate;
	const snapshots = agg.lastSnapshots;
	const periodEnd = new Date();

	// Get the aggregation interval from the configured cron schedule
	const cronSchedule =
		fastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE ??
		process.env.PERF_AGGREGATION_CRON_SCHEDULE ??
		"*/5 * * * *";
	const aggregationIntervalMs = parseCronIntervalToMs(cronSchedule);

	if (snapshots.length === 0) {
		logger.info("No performance snapshots available for aggregation");
		// For empty snapshots, use the configured interval as fallback
		const periodStart = new Date(periodEnd.getTime() - aggregationIntervalMs);
		return {
			periodStart,
			periodEnd,
			totalRequests: 0,
			avgRequestMs: 0,
			avgDbMs: 0,
			totalCacheHits: 0,
			totalCacheMisses: 0,
			avgHitRate: 0,
			slowRequestCount: 0,
			highComplexityCount: 0,
			topSlowOps: [],
		};
	}

	// Calculate aggregates
	let totalRequestMs = 0;
	let totalDbMs = 0;
	let totalCacheHits = 0;
	let totalCacheMisses = 0;
	let slowRequestCount = 0;
	let highComplexityCount = 0;
	const slowOpsMap = new Map<string, { totalMs: number; count: number }>();

	for (const snap of snapshots) {
		// Safely handle snapshots with invalid or missing data
		const safeTotalMs = typeof snap.totalMs === "number" ? snap.totalMs : 0;
		const safeCacheHits =
			typeof snap.cacheHits === "number" ? snap.cacheHits : 0;
		const safeCacheMisses =
			typeof snap.cacheMisses === "number" ? snap.cacheMisses : 0;

		totalRequestMs += safeTotalMs;
		totalCacheHits += safeCacheHits;
		totalCacheMisses += safeCacheMisses;

		// Sum database operation times (handle null/undefined ops)
		if (snap.ops && typeof snap.ops === "object") {
			const dbOps = Object.entries(snap.ops).filter(([key]) =>
				key.startsWith("db:"),
			);
			for (const [, stats] of dbOps) {
				if (stats && typeof stats.ms === "number") {
					totalDbMs += stats.ms;
				}
			}
		}

		// Count slow requests
		if (safeTotalMs >= 500) {
			slowRequestCount++;
		}

		// Count high complexity queries (using actual complexity score, not execution time)
		const COMPLEXITY_THRESHOLD = 100;
		if (
			snap.complexityScore !== undefined &&
			typeof snap.complexityScore === "number" &&
			snap.complexityScore >= COMPLEXITY_THRESHOLD
		) {
			highComplexityCount++;
		}

		// Aggregate slow operations (handle malformed entries)
		if (snap.slow && Array.isArray(snap.slow) && snap.slow.length > 0) {
			for (const slowOp of snap.slow) {
				// Skip invalid entries (missing op, empty op, or non-number ms)
				if (
					!slowOp ||
					typeof slowOp.op !== "string" ||
					!slowOp.op.trim() ||
					typeof slowOp.ms !== "number" ||
					Number.isNaN(slowOp.ms)
				) {
					continue;
				}

				const existing = slowOpsMap.get(slowOp.op);
				if (existing) {
					existing.totalMs += slowOp.ms;
					existing.count++;
				} else {
					slowOpsMap.set(slowOp.op, { totalMs: slowOp.ms, count: 1 });
				}
			}
		}
	}

	const requestCount = snapshots.length;
	const avgRequestMs = requestCount > 0 ? totalRequestMs / requestCount : 0;
	const avgDbMs = requestCount > 0 ? totalDbMs / requestCount : 0;
	const totalCacheOps = totalCacheHits + totalCacheMisses;
	const avgHitRate = totalCacheOps > 0 ? totalCacheHits / totalCacheOps : 0;

	// Get top 5 slow operations
	const topSlowOps = Array.from(slowOpsMap.entries())
		.map(([op, data]) => ({
			op,
			avgMs: data.count > 0 ? data.totalMs / data.count : 0,
			count: data.count,
		}))
		.sort((a, b) => b.avgMs - a.avgMs)
		.slice(0, 5);

	// Calculate periodStart based on the aggregation interval
	// This reflects the actual time window covered by this aggregation run
	const periodStart = new Date(periodEnd.getTime() - aggregationIntervalMs);

	const metrics: AggregatedMetrics = {
		periodStart,
		periodEnd,
		totalRequests: requestCount,
		avgRequestMs: Math.round(avgRequestMs),
		avgDbMs: Math.round(avgDbMs),
		totalCacheHits,
		totalCacheMisses,
		avgHitRate: Math.round(avgHitRate * 100) / 100, // Round to 2 decimal places
		slowRequestCount,
		highComplexityCount,
		topSlowOps,
	};

	// Log aggregated metrics (with error handling)
	try {
		logger.info(
			{
				msg: "Performance metrics aggregation",
				...metrics,
			},
			"Performance metrics aggregated",
		);
	} catch (error) {
		// Log error but don't fail aggregation
		logger.error(
			{
				error: error instanceof Error ? error.message : "Unknown error",
			},
			"Failed to log aggregated metrics",
		);
	}

	return metrics;
}
