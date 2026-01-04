import type { FastifyBaseLogger, FastifyInstance } from "fastify";

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

	if (snapshots.length === 0) {
		logger.info("No performance snapshots available for aggregation");
		return {
			periodStart: new Date(),
			periodEnd: new Date(),
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
		totalRequestMs += snap.totalMs;
		totalCacheHits += snap.cacheHits;
		totalCacheMisses += snap.cacheMisses;

		// Sum database operation times
		const dbOps = Object.entries(snap.ops).filter(([key]) =>
			key.startsWith("db:"),
		);
		for (const [, stats] of dbOps) {
			totalDbMs += stats.ms;
		}

		// Count slow requests
		if (snap.totalMs >= 500) {
			slowRequestCount++;
		}

		// Count high complexity queries
		const complexityOp = snap.ops["gql:complexity"];
		if (complexityOp && complexityOp.ms >= 100) {
			highComplexityCount++;
		}

		// Aggregate slow operations
		if (snap.slow && snap.slow.length > 0) {
			for (const slowOp of snap.slow) {
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

	const metrics: AggregatedMetrics = {
		periodStart: new Date(Date.now() - 60000), // Last minute (approximate)
		periodEnd: new Date(),
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

	// Log aggregated metrics
	logger.info(
		{
			msg: "Performance metrics aggregation",
			...metrics,
		},
		"Performance metrics aggregated",
	);

	return metrics;
}
