import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
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
		// Using push/shift pattern (Array.shift() is O(n), but buffer is small so cost is negligible)
		const recent: PerfSnapshot[] = [];

		// Check if performance metrics endpoint is enabled
		// Sources: app.envConfig.API_ENABLE_PERF_METRICS (parsed from schema) or process.env.API_ENABLE_PERF_METRICS (raw env var)
		const rawEnablePerfMetrics =
			app.envConfig.API_ENABLE_PERF_METRICS ??
			process.env.API_ENABLE_PERF_METRICS ??
			"false";
		// Explicitly handle both boolean and string types
		const enablePerfMetrics =
			typeof rawEnablePerfMetrics === "boolean"
				? rawEnablePerfMetrics
				: String(rawEnablePerfMetrics).toLowerCase() === "true";

		// Attach performance tracker to each request
		app.addHook("onRequest", async (req) => {
			req.perf = createPerformanceTracker();
			req._t0 = Date.now();

			// Wrap drizzleClient and cache with metrics tracking
			// Use getter function to access req.perf at runtime
			// Dependencies ["drizzleClient", "cacheService"] are guaranteed by plugin dependencies array,
			// so app.drizzleClient and app.cache are always available (no conditional checks needed)
			req.drizzleClient = wrapDrizzleWithMetrics(
				app.drizzleClient,
				() => req.perf,
			);

			req.cache = wrapCacheWithMetrics(app.cache, () => req.perf);
		});

		// Add Server-Timing header to each response
		app.addHook("onSend", async (req, reply) => {
			const snap = req.perf?.snapshot?.();
			// Ensure _t0 is defined - if not, use current time as fallback (shouldn't happen in normal flow)
			const t0 = req._t0 ?? Date.now();
			const total = Date.now() - t0;

			// Extract metrics from snapshot - aggregate all db operations
			// Database operations are keyed as "db:query.tableName.method" or "db:execute", etc.
			let dbMs = 0;
			if (snap?.ops) {
				for (const [key, op] of Object.entries(snap.ops)) {
					if (key.startsWith("db:")) {
						dbMs += op.ms;
					}
				}
			}
			dbMs = Math.round(dbMs);
			const cacheDesc = `hit:${snap?.cacheHits ?? 0}|miss:${snap?.cacheMisses ?? 0}`;

			// Add Server-Timing header with db, cache, and total metrics
			reply.header(
				"Server-Timing",
				`db;dur=${dbMs}, cache;desc="${cacheDesc}", total;dur=${Math.round(total)}`,
			);

			// Store snapshot in recent buffer
			if (snap) {
				// Add timestamp for chronological ordering - use t0 which is guaranteed to be defined
				recent.push({ ...snap, timestamp: t0 });
				// Keep only last 200 snapshots (FIFO)
				// Note: Array.shift() is O(n), but with a small buffer (200 items) the cost is negligible
				if (recent.length > 200) {
					recent.shift();
				}
			}
		});

		// Endpoint to retrieve recent performance snapshots
		// Only register if enabled via environment variable and protect with authentication
		// This endpoint is gated behind API_ENABLE_PERF_METRICS to prevent exposure in production
		// unless explicitly enabled, and requires JWT authentication for security
		if (enablePerfMetrics) {
			app.get(
				"/metrics/perf",
				{
					preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
						// Require authentication via JWT - endpoint is protected and only accessible
						// to authenticated users when API_ENABLE_PERF_METRICS is enabled
						try {
							await req.jwtVerify();
						} catch (_error) {
							// Use Fastify's standard HTTP error response for REST endpoints
							// Send 401 Unauthorized with error message
							// Include correlationId for consistency with error handler format
							const correlationId = req.id as string;
							return reply.code(401).send({
								error: {
									message:
										"Authentication required to access performance metrics",
									correlationId,
								},
							});
						}
					},
				},
				async () => {
					// Return most recent 50 snapshots in reverse chronological order
					// (newest first, matching original behavior)
					// Note: This endpoint is only registered when enablePerfMetrics is true
					// Optimize: slice first, then reverse to avoid unnecessary operations
					const last50 = recent.slice(-50);
					return {
						recent: last50.reverse(),
					};
				},
			);
		}
	},
	{
		dependencies: ["drizzleClient", "cacheService"],
	},
);
