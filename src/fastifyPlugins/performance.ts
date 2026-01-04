import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
	createPerformanceTracker,
	type PerformanceTracker,
	type PerfSnapshot,
} from "../utilities/metrics/performanceTracker";

declare module "fastify" {
	interface FastifyRequest {
		/**
		 * Performance tracker instance for this request.
		 * Attached by the performance plugin during the onRequest hook.
		 */
		perf?: PerformanceTracker;

		/**
		 * Request start timestamp (milliseconds since epoch).
		 * Used to calculate total request duration.
		 */
		_t0?: number;
	}

	interface FastifyInstance {
		/**
		 * Aggregated performance metrics for background workers.
		 */
		perfAggregate: {
			/** Total number of requests processed */
			totalRequests: number;
			/** Total time spent across all requests (ms) */
			totalMs: number;
			/** Recent performance snapshots (last 200) */
			lastSnapshots: PerfSnapshot[];
		};
	}
}

/**
 * Fastify plugin that adds performance tracking to all requests.
 * - Attaches a performance tracker to each request
 * - Adds Server-Timing headers to responses
 * - Provides /metrics/perf endpoint for recent performance snapshots
 *
 * @example
 * ```typescript
 * // Performance tracker is automatically available on requests
 * app.addHook("onRequest", async (req) => {
 *   await req.perf?.time("custom-op", async () => {
 *     // Your operation
 *   });
 * });
 * ```
 */
export default fp(
	async function perfPlugin(app: FastifyInstance) {
		// Store recent performance snapshots in memory (last 200 requests)
		const recent: PerfSnapshot[] = [];
		let totalRequests = 0;
		let totalMs = 0;

		// Expose aggregated metrics on Fastify instance for background workers
		app.decorate("perfAggregate", {
			get totalRequests() {
				return totalRequests;
			},
			get totalMs() {
				return totalMs;
			},
			get lastSnapshots() {
				return recent.slice();
			},
		});

		// Attach performance tracker to each request
		app.addHook("onRequest", async (req) => {
			const slowOpMs = app.envConfig.API_PERF_SLOW_OP_MS ?? 200;
			req.perf = createPerformanceTracker({ slowMs: slowOpMs });
			req._t0 = Date.now();
		});

		// Add Server-Timing header to each response
		app.addHook("onSend", async (req, reply) => {
			const snap = req.perf?.snapshot?.();
			const total = Date.now() - (req._t0 ?? Date.now());

			// Extract metrics from snapshot
			// Sum all database operations (ops starting with "db:")
			const dbMs = Math.round(
				Object.entries(snap?.ops ?? {})
					.filter(([k]) => k.startsWith("db:"))
					.reduce((a, [, v]) => a + v.ms, 0),
			);
			const cacheDesc = `hit:${snap?.cacheHits ?? 0}|miss:${snap?.cacheMisses ?? 0}`;

			// Add Server-Timing header with db, cache, and total metrics
			reply.header(
				"Server-Timing",
				`db;dur=${dbMs}, cache;desc="${cacheDesc}", total;dur=${Math.round(total)}`,
			);

			// Log slow requests (threshold configurable via API_PERF_SLOW_REQUEST_MS)
			const slowRequestMs = app.envConfig.API_PERF_SLOW_REQUEST_MS ?? 500;
			if (total >= slowRequestMs && snap) {
				req.log.warn({
					msg: "Slow request",
					totalMs: Math.round(total),
					path: req.url,
					dbMs,
					hitRate: snap.hitRate,
					slowOps: snap.slow?.slice(0, 5),
				});
			}

			// Store snapshot in recent buffer and update aggregates
			if (snap) {
				recent.unshift({ ...snap });
				// Keep only last 200 snapshots
				if (recent.length > 200) {
					recent.splice(200);
				}
				totalRequests++;
				totalMs += total;
			}
		});

		// Endpoint to retrieve recent performance snapshots
		app.get("/metrics/perf", async () => {
			const agg = app.perfAggregate;
			const avg = agg.totalRequests > 0 ? agg.totalMs / agg.totalRequests : 0;
			return {
				totalRequests: agg.totalRequests,
				avgMs: Math.round(avg),
				recent: agg.lastSnapshots.slice(0, 20),
			};
		});

		app.log.info({ msg: "Performance plugin registered" });
	},
	{
		name: "performance",
	},
);
