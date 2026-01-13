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
		 * Retrieves recent performance snapshots for metrics aggregation.
		 * Returns a copy of the snapshots array to prevent external modification.
		 *
		 * @param limit - Maximum number of snapshots to return (default: all available)
		 * @returns Array of performance snapshots
		 */
		getPerformanceSnapshots(limit?: number): PerfSnapshot[];
	}
}

/**
 * Manual deep copy implementation for performance snapshots.
 * Creates new objects for ops and slow arrays to ensure full immutability.
 * Exported for testing purposes to allow direct testing of the fallback path.
 *
 * @param snap - The snapshot to deep clone
 * @returns A deep-cloned copy of the snapshot
 */
export const manualDeepCopySnapshot = (snap: PerfSnapshot): PerfSnapshot => {
	return {
		...snap,
		ops: Object.fromEntries(
			Object.entries(snap.ops).map(([key, value]) => [key, { ...value }]),
		),
		slow: snap.slow.map((item) => ({ ...item })),
	};
};

/**
 * Fastify plugin that adds performance tracking to all requests.
 * - Attaches a performance tracker to each request
 * - Adds Server-Timing headers to responses
 * - Provides /metrics/perf endpoint for recent performance snapshots
 * - Exposes metrics aggregation interface for background workers
 */
const perfPlugin = async (app: FastifyInstance) => {
	// Get configurable snapshot retention count from validated environment config
	// Falls back to 1000 if not set (matching schema default)
	// Use optional chaining to handle cases where envConfig might not be available (e.g., in tests)
	const retentionCount =
		app.envConfig?.METRICS_SNAPSHOT_RETENTION_COUNT ?? 1000;

	// Store recent performance snapshots in memory (most recent first)
	// Note: unshift is O(n) but acceptable for typical retention counts (< 1000)
	const recent: PerfSnapshot[] = [];

	/**
	 * Deep clones a performance snapshot to prevent external mutation of nested structures.
	 * Uses structuredClone when available (Node.js 17+), falls back to manual deep copy.
	 *
	 * @param snap - The snapshot to deep clone
	 * @returns A deep-cloned copy of the snapshot
	 */
	const deepCopySnapshot = (snap: PerfSnapshot): PerfSnapshot => {
		// Use structuredClone for reliable deep cloning (available in Node.js 17+)
		// Falls back to manual deep copy if structuredClone is not available
		if (typeof structuredClone !== "undefined") {
			return structuredClone(snap);
		}

		// Manual deep copy fallback
		return manualDeepCopySnapshot(snap);
	};

	/**
	 * Retrieves recent performance snapshots for metrics aggregation.
	 * Returns deep-cloned snapshots to prevent external modification of nested structures.
	 *
	 * @param limit - Maximum number of snapshots to return (default: all available). Returns empty array if limit is 0 or negative.
	 * @returns Array of deep-cloned performance snapshots
	 */
	app.decorate("getPerformanceSnapshots", (limit?: number): PerfSnapshot[] => {
		if (limit !== undefined) {
			if (limit <= 0) {
				return [];
			}
			return recent.slice(0, limit).map(deepCopySnapshot);
		}
		return recent.map(deepCopySnapshot);
	});

	// Attach performance tracker to each request
	app.addHook("onRequest", async (req) => {
		req.perf = createPerformanceTracker();
		req._t0 = Date.now();
	});

	// Add Server-Timing header to each response
	app.addHook("onSend", async (req, reply) => {
		const snap = req.perf?.snapshot?.();
		const total = Date.now() - (req._t0 ?? Date.now());
		// Get slow request threshold from validated environment config
		// Falls back to 500 if not set (matching schema default)
		// Use optional chaining to handle cases where envConfig might not be available (e.g., in tests)
		const slowMs = app.envConfig?.API_SLOW_REQUEST_MS ?? 500;

		if (total >= slowMs) {
			req.log.warn({
				msg: "Slow request",
				method: req.method,
				path: req.url,
				totalMs: total,
				slowThresholdMs: slowMs,
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

		// Store snapshot in recent buffer (most recent first)
		// Note: unshift is O(n) but acceptable for typical retention counts (< 1000)
		// For better performance with very large retention counts, consider a proper ring buffer
		if (snap) {
			recent.unshift(deepCopySnapshot(snap));
			// Keep only the configured number of snapshots
			// Use splice to remove from the end (more efficient than pop in a loop)
			if (recent.length > retentionCount) {
				recent.length = retentionCount;
			}
		}
	});

	// Endpoint to retrieve recent performance snapshots
	app.get("/metrics/perf", async () => ({
		recent: recent.slice(0, 50).map(deepCopySnapshot),
	}));
};

export default fp(perfPlugin, {
	name: "performance",
});
