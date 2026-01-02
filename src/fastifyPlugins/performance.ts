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
}

/**
 * Fastify plugin that adds performance tracking to all requests.
 * - Attaches a performance tracker to each request
 * - Adds Server-Timing headers to responses
 * - Provides /metrics/perf endpoint for recent performance snapshots
 */
export default fp(async function perfPlugin(app: FastifyInstance) {
	// Store recent performance snapshots in memory (last 200 requests)
	const recent: PerfSnapshot[] = [];

	// Attach performance tracker to each request
	app.addHook("onRequest", async (req) => {
		req.perf = createPerformanceTracker();
		req._t0 = Date.now();
	});

	// Add Server-Timing header to each response
	app.addHook("onSend", async (req, reply) => {
		const snap = req.perf?.snapshot?.();
		const total = Date.now() - (req._t0 ?? Date.now());

		// Extract metrics from snapshot
		const dbMs = Math.round(snap?.ops?.db?.ms ?? 0);
		const cacheDesc = `hit:${snap?.cacheHits ?? 0}|miss:${snap?.cacheMisses ?? 0}`;

		// Check if this is a GraphQL request with operation metadata
		const gqlOp = (req as unknown as Record<string, unknown>)._gqlOperation as
			| { name: string; type: string; complexity: number }
			| undefined;

		// Log slow GraphQL operations
		if (gqlOp && total >= 500) {
			req.log.warn({
				msg: "Slow GraphQL operation",
				operation: gqlOp.name,
				type: gqlOp.type,
				complexity: gqlOp.complexity,
				totalMs: Math.round(total),
				dbMs,
				cacheHits: snap?.cacheHits ?? 0,
				cacheMisses: snap?.cacheMisses ?? 0,
				hitRate: snap?.cacheHits
					? snap.cacheHits / (snap.cacheHits + (snap?.cacheMisses ?? 0))
					: 0,
			});
		}

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
});
