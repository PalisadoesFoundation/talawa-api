import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
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
		 * Retrieves recent performance snapshots within an optional time window.
		 * @param windowMinutes - Optional time window in minutes. If zero or negative, returns all snapshots; otherwise returns snapshots within this window.
		 * @returns Array of performance snapshots
		 */
		getMetricsSnapshots?: (windowMinutes?: number) => PerfSnapshot[];
	}
}

/**
 * Snapshot with timestamp for time-based filtering.
 */
interface SnapshotWithTimestamp {
	snapshot: PerfSnapshot;
	timestamp: number;
}

/**
 * Fastify plugin that adds performance tracking to all requests.
 * - Attaches a performance tracker to each request
 * - Adds Server-Timing headers to responses
 * - Provides /metrics/perf endpoint for recent performance snapshots (requires authentication)
 * - Exposes getMetricsSnapshots for background worker metrics aggregation
 */
export default fp(
	async function perfPlugin(app: FastifyInstance) {
		// Get configurable snapshot retention count from env var (default: 1000)
		const rawRetentionCount = Number(
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT ?? 1000,
		);
		const retentionCount =
			Number.isFinite(rawRetentionCount) && rawRetentionCount > 0
				? Math.floor(rawRetentionCount)
				: 1000;

		// Cache slow request threshold at plugin initialization (default: 500ms)
		const rawSlowMs = Number(process.env.API_SLOW_REQUEST_MS ?? 500);
		const slowRequestThresholdMs =
			Number.isFinite(rawSlowMs) && rawSlowMs > 0 ? Math.floor(rawSlowMs) : 500;

		// Get API key for metrics endpoint authentication (optional)
		const metricsApiKey = process.env.API_METRICS_API_KEY;

		// Store recent performance snapshots with timestamps in memory
		const recent: SnapshotWithTimestamp[] = [];

		/**
		 * Internal function to retrieve recent snapshots, optionally filtered by time window.
		 * Safe from interleaved modifications since JavaScript is single-threaded and the array
		 * is only mutated by the onSend hook.
		 *
		 * @param windowMinutes - Optional time window in minutes. If zero or negative, returns all snapshots; otherwise returns snapshots within this window.
		 * @returns Array of performance snapshots
		 */
		function getRecentSnapshots(windowMinutes?: number): PerfSnapshot[] {
			if (windowMinutes === undefined || windowMinutes <= 0) {
				// Return all snapshots if no window specified
				return recent.map((item) => item.snapshot);
			}

			// Filter snapshots by time window
			const windowMs = windowMinutes * 60 * 1000;
			const cutoffTime = Date.now() - windowMs;

			return recent
				.filter((item) => item.timestamp >= cutoffTime)
				.map((item) => item.snapshot);
		}

		/**
		 * Pre-handler for metrics endpoint authentication.
		 * Validates bearer token against API_METRICS_API_KEY environment variable.
		 * Returns 401 if no token provided, 403 if token is invalid.
		 */
		async function metricsAuthPreHandler(
			request: FastifyRequest,
			reply: FastifyReply,
		): Promise<void> {
			// If no API key is configured, allow access (for development/testing)
			if (!metricsApiKey) {
				request.log.warn(
					"API_METRICS_API_KEY not configured - metrics endpoint is unprotected",
				);
				return;
			}

			const authHeader = request.headers.authorization;

			if (!authHeader) {
				reply
					.code(401)
					.send({
						error: "Unauthorized",
						message: "Missing authorization header",
					});
				return;
			}

			// Expect "Bearer <token>" format
			const [scheme, token] = authHeader.split(" ");

			if (scheme?.toLowerCase() !== "bearer" || !token) {
				reply
					.code(401)
					.send({
						error: "Unauthorized",
						message: "Invalid authorization format. Expected: Bearer <token>",
					});
				return;
			}

			// Validate token against configured API key
			if (token !== metricsApiKey) {
				reply
					.code(403)
					.send({ error: "Forbidden", message: "Invalid API key" });
				return;
			}
		}

		// Attach performance tracker to each request
		app.addHook("onRequest", async (req) => {
			req.perf = createPerformanceTracker();
			req._t0 = Date.now();
		});

		// Add Server-Timing header to each response
		app.addHook("onSend", async (req, reply) => {
			const snap = req.perf?.snapshot?.();
			const total = Date.now() - (req._t0 ?? Date.now());

			if (total >= slowRequestThresholdMs) {
				req.log.warn({
					msg: "Slow request",
					method: req.method,
					path: req.url,
					totalMs: total,
					slowThresholdMs: slowRequestThresholdMs,
				});
			}

			// Extract metrics from snapshot
			const dbMs = Math.round(snap?.ops?.db?.ms ?? 0);
			const cacheDesc = `hit:${snap?.cacheHits ?? 0}|miss:${snap?.cacheMisses ?? 0}`;

			// Add Server-Timing header with db, cache, and total metrics
			reply.header(
				"Server-Timing",
				`db;dur=${dbMs}, cache;desc="${cacheDesc}", total;dur=${Math.round(total)}`,
			);

			// Store snapshot in recent buffer with timestamp
			if (snap) {
				recent.unshift({
					snapshot: { ...snap },
					timestamp: Date.now(),
				});
				// Keep only last N snapshots (configurable via env var)
				if (recent.length > retentionCount) {
					recent.length = retentionCount;
				}
			}
		});

		// Expose snapshot getter for background workers
		app.getMetricsSnapshots = getRecentSnapshots;

		// Endpoint to retrieve recent performance snapshots (protected)
		app.get(
			"/metrics/perf",
			{
				preHandler: metricsAuthPreHandler,
			},
			async () => ({
				recent: recent.slice(0, 50).map((item) => item.snapshot),
			}),
		);
	},
	{ name: "performance" },
);
