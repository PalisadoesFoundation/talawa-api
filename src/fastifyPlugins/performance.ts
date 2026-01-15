import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { MetricsCacheService } from "../services/metrics";
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

		/**
		 * Metrics cache service for caching aggregated metrics data.
		 * Available after cache service plugin is registered.
		 */
		metricsCache?: MetricsCacheService;
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
		// Get configurable snapshot retention count from env config (default: 1000)
		const rawRetentionCount =
			app.envConfig.API_METRICS_SNAPSHOT_RETENTION_COUNT ?? 1000;
		const retentionCount =
			Number.isFinite(rawRetentionCount) && rawRetentionCount > 0
				? Math.floor(rawRetentionCount)
				: 1000;

		// Cache slow request threshold at plugin initialization (default: 500ms)
		const rawSlowRequestMs = app.envConfig.API_METRICS_SLOW_REQUEST_MS ?? 500;
		const slowRequestThresholdMs =
			Number.isFinite(rawSlowRequestMs) && rawSlowRequestMs > 0
				? Math.floor(rawSlowRequestMs)
				: 500;

		// Get slow operation threshold from env config (default: 200ms)
		const rawSlowOperationMs =
			app.envConfig.API_METRICS_SLOW_OPERATION_MS ?? 200;
		const slowOperationThresholdMs =
			Number.isFinite(rawSlowOperationMs) && rawSlowOperationMs > 0
				? Math.floor(rawSlowOperationMs)
				: 200;

		// Get API key for metrics endpoint authentication (optional)
		const metricsApiKey = app.envConfig.API_METRICS_API_KEY;

		// Warn once at plugin init if API key is not configured
		if (!metricsApiKey) {
			app.log.warn(
				"API_METRICS_API_KEY not configured - metrics endpoint is unprotected",
			);
		}

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
			// Warning is logged once at plugin init, not per-request
			if (!metricsApiKey) {
				return;
			}

			const authHeader = request.headers.authorization;

			if (!authHeader) {
				reply.code(401).send({
					error: "Unauthorized",
					message: "Missing authorization header",
				});
				return;
			}

			// Expect "Bearer <token>" format
			const [scheme, token] = authHeader.split(" ");

			if (scheme?.toLowerCase() !== "bearer" || !token) {
				reply.code(401).send({
					error: "Unauthorized",
					message: "Invalid authorization format. Expected: Bearer <token>",
				});
				return;
			}

			// Validate token using timing-safe comparison to prevent timing attacks
			const tokenBuffer = Buffer.from(token);
			const apiKeyBuffer = Buffer.from(metricsApiKey);

			// Check lengths first, then use timing-safe comparison
			const isValid =
				tokenBuffer.length === apiKeyBuffer.length &&
				crypto.timingSafeEqual(tokenBuffer, apiKeyBuffer);

			if (!isValid) {
				reply
					.code(403)
					.send({ error: "Forbidden", message: "Invalid API key" });
				return;
			}
		}

		// Attach performance tracker to each request
		app.addHook("onRequest", async (req) => {
			req.perf = createPerformanceTracker({
				slowMs: slowOperationThresholdMs,
			});
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
		// Registered before cache init to ensure route is always available
		app.get(
			"/metrics/perf",
			{
				preHandler: metricsAuthPreHandler,
			},
			async () => ({
				recent: recent.slice(0, 50).map((item) => item.snapshot),
			}),
		);

		// Initialize metrics cache service (optional - failures should not break anything)
		try {
			// Check if cache service is available (it should be due to dependency, but be defensive)
			if (!app.cache) {
				app.log.warn(
					"Cache service not available - metrics cache will not be initialized",
				);
				// Don't return - route is already registered above
			} else {
				const cacheTtlSeconds =
					app.envConfig.API_METRICS_CACHE_TTL_SECONDS ?? 300;
				const metricsCache = new MetricsCacheService(
					app.cache,
					app.log,
					cacheTtlSeconds,
				);
				app.metricsCache = metricsCache;
				app.log.debug("Metrics cache service initialized");
			}
		} catch (error) {
			app.log.warn(
				{
					error: error instanceof Error ? error.message : "Unknown error",
				},
				"Failed to initialize metrics cache service (continuing without cache)",
			);
		}
	},
	{
		name: "performance",
		dependencies: ["cacheService"],
	},
);
