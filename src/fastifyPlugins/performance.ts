import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
	createPerformanceTracker,
	type PerfSnapshot,
} from "../utilities/metrics/performanceTracker";

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
		// @ts-expect-error - Dynamically attach perf tracker to request
		req.perf = createPerformanceTracker();
		// @ts-expect-error - Track request start time
		req._t0 = Date.now();
	});

	// Add Server-Timing header to each response
	app.addHook("onSend", async (req, reply) => {
		// @ts-expect-error - Access dynamic perf field
		const snap = req.perf?.snapshot?.();
		// @ts-expect-error - Access dynamic _t0 field
		const total = Date.now() - (req._t0 ?? Date.now());

		// Extract metrics from snapshot
		const dbMs = Math.round(snap?.ops?.db?.ms ?? 0);
		const cacheDesc = `hit:${snap?.cacheHits ?? 0}|miss:${snap?.cacheMiss ?? 0}`;

		// Add Server-Timing header with db, cache, and total metrics
		reply.header(
			"Server-Timing",
			`db;dur=${dbMs}, cache;desc="${cacheDesc}", total;dur=${Math.round(total)}`,
		);

		// Store snapshot in recent buffer
		if (snap) {
			recent.unshift({ ...snap });
			// Keep only last 200 snapshots
			while (recent.length > 200) {
				recent.pop();
			}
		}
	});

	// Endpoint to retrieve recent performance snapshots
	app.get("/metrics/perf", async () => ({
		recent: recent.slice(0, 50),
	}));
});
