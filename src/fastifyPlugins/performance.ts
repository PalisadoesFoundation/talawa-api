import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { wrapCacheWithMetrics } from "../utilities/metrics/cacheProxy";
import { wrapDrizzleWithMetrics } from "../utilities/metrics/drizzleProxy";
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

		/**
		 * Wrapped Drizzle client with automatic performance tracking.
		 * Attached by the performance plugin during the onRequest hook.
		 */
		drizzleClient?: FastifyInstance["drizzleClient"];

		/**
		 * Wrapped cache service with automatic performance tracking.
		 * Attached by the performance plugin during the onRequest hook.
		 */
		cache?: FastifyInstance["cache"];
	}
}

/**
 * Fastify plugin that adds performance tracking to all requests.
 * - Attaches a performance tracker to each request
 * - Wraps drizzleClient and cache with metrics tracking
 * - Adds Server-Timing headers to responses
 * - Provides /metrics/perf endpoint for recent performance snapshots
 */
export default fp(
	async function perfPlugin(app: FastifyInstance) {
		// Store recent performance snapshots in memory (last 200 requests)
		const recent: PerfSnapshot[] = [];

		// Attach performance tracker to each request
		app.addHook("onRequest", async (req) => {
			req.perf = createPerformanceTracker();
			req._t0 = Date.now();

			// Wrap drizzleClient and cache with metrics tracking
			// Use getter function to access req.perf at runtime
			if (app.drizzleClient) {
				req.drizzleClient = wrapDrizzleWithMetrics(
					app.drizzleClient,
					() => req.perf,
				);
			}

			if (app.cache) {
				req.cache = wrapCacheWithMetrics(app.cache, () => req.perf);
			}
		});

		// Add Server-Timing header to each response
		app.addHook("onSend", async (req, reply) => {
			const snap = req.perf?.snapshot?.();
			const total = Date.now() - (req._t0 ?? Date.now());

			// Extract metrics from snapshot
			const dbMs = Math.round(snap?.ops?.db?.ms ?? 0);
			const cacheDesc = `hit:${snap?.cacheHits ?? 0}|miss:${snap?.cacheMisses ?? 0}`;

			// Add Server-Timing header with db, cache, and total metrics
			reply.header(
				"Server-Timing",
				`db;dur=${dbMs}, cache;desc="${cacheDesc}", total;dur=${Math.round(total)}`,
			);

			// Store snapshot in recent buffer
			if (snap) {
				recent.unshift({ ...snap });
				// Keep only last 200 snapshots
				if (recent.length > 200) {
					recent.splice(200);
				}
			}
		});

		// Endpoint to retrieve recent performance snapshots
		app.get("/metrics/perf", async () => ({
			recent: recent.slice(0, 50),
		}));
	},
	{
		dependencies: ["drizzleClient", "cacheService"],
	},
);
