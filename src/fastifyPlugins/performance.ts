import { timingSafeEqual } from "node:crypto";
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

		/**
		 * Timer end function for GraphQL parsing operation.
		 * Set in preParsing hook and called in preExecution hook to measure parse duration.
		 */
		__parseTimerEnd?: () => void;
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

		/**
		 * Validates if an IP address matches a CIDR range or exact IP.
		 * @param ip - IP address to check (e.g., "192.168.1.1")
		 * @param cidr - CIDR range or exact IP (e.g., "192.168.1.0/24" or "127.0.0.1")
		 * @returns true if IP matches the CIDR range or exact IP
		 */
		const isIpInRange = (ip: string, cidr: string): boolean => {
			if (ip === cidr) return true; // Exact match

			// Check if it's a CIDR notation
			if (!cidr.includes("/")) return false;

			const parts = cidr.split("/");
			const network = parts[0];
			const prefixLength = parts[1];
			if (!network || !prefixLength) return false;

			const prefix = Number.parseInt(prefixLength, 10);
			if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;

			// Convert IPs to numbers for comparison
			const ipToNumber = (addr: string): number => {
				const addrParts = addr
					.split(".")
					.map((s) => Number.parseInt(s.trim(), 10));
				if (addrParts.length !== 4 || addrParts.some(Number.isNaN)) return -1;
				const [a, b, c, d] = addrParts;
				if (
					a === undefined ||
					b === undefined ||
					c === undefined ||
					d === undefined
				) {
					return -1;
				}
				// Validate each octet is in valid range (0-255)
				if (
					a < 0 ||
					a > 255 ||
					b < 0 ||
					b > 255 ||
					c < 0 ||
					c > 255 ||
					d < 0 ||
					d > 255
				) {
					return -1;
				}
				// Coerce to unsigned 32-bit number
				return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
			};

			const ipNum = ipToNumber(ip);
			const networkNum = ipToNumber(network);
			if (ipNum === -1 || networkNum === -1) return false;

			const mask = (0xffffffff << (32 - prefix)) >>> 0;
			return (ipNum & mask) === (networkNum & mask);
		};

		/**
		 * PreHandler to authenticate /metrics/perf endpoint requests.
		 * Validates either API key in Authorization header or client IP address.
		 */
		const metricsAuthPreHandler = async (
			req: FastifyRequest,
			reply: FastifyReply,
		): Promise<void> => {
			const apiKey = app.envConfig.METRICS_API_KEY;
			const allowedIps = app.envConfig.METRICS_ALLOWED_IPS;

			// If no authentication is configured, allow access (not recommended for production)
			if (!apiKey && !allowedIps) {
				app.log.warn(
					"/metrics/perf endpoint is unprotected. Set METRICS_API_KEY or METRICS_ALLOWED_IPS for production.",
				);
				return;
			}

			// Track if IP check was attempted and failed
			let ipCheckFailed = false;

			// Check if IP is in allowed list (only if allowedIps is configured)
			if (allowedIps) {
				// Guard check: ensure req exists before accessing req.ip
				if (!req) {
					reply.status(403).send({
						error: "Forbidden",
						message: "IP address not available",
					});
					return;
				}

				const clientIp = req.ip;
				if (!clientIp) {
					reply.status(403).send({
						error: "Forbidden",
						message: "IP address not available",
					});
					return;
				}

				const allowedIpList = allowedIps.split(",").map((ip) => ip.trim());
				const isAllowed = allowedIpList.some((cidr) =>
					isIpInRange(clientIp, cidr),
				);
				if (isAllowed) {
					return; // IP is allowed, proceed
				}
				// IP check failed, but continue to API key check if configured
				ipCheckFailed = true;
			}

			// Check API key in Authorization header
			if (apiKey) {
				const authHeader = req.headers.authorization;
				if (!authHeader) {
					reply.status(401).send({
						error: "Unauthorized",
						message: "Missing Authorization header",
					});
					return;
				}

				// Support "Bearer <key>" or just "<key>" format
				const providedKey = authHeader.startsWith("Bearer ")
					? authHeader.slice(7)
					: authHeader;

				// Use timing-safe comparison to prevent timing attacks
				const apiKeyBuffer = Buffer.from(apiKey, "utf8");
				const providedKeyBuffer = Buffer.from(providedKey, "utf8");

				// Check lengths first (if different, treat as mismatch without calling timingSafeEqual)
				if (
					apiKeyBuffer.length !== providedKeyBuffer.length ||
					!timingSafeEqual(apiKeyBuffer, providedKeyBuffer)
				) {
					// If IP check also failed, return "Access denied" instead of "Invalid API key"
					if (ipCheckFailed) {
						reply.status(403).send({
							error: "Forbidden",
							message: "Access denied",
						});
					} else {
						reply.status(403).send({
							error: "Forbidden",
							message: "Invalid API key",
						});
					}
					return;
				}

				return; // API key is valid, proceed
			}

			// Neither IP nor API key matched (or only allowedIps was configured and IP didn't match)
			reply.status(403).send({
				error: "Forbidden",
				message: "Access denied",
			});
		};

		// Endpoint to retrieve recent performance snapshots
		app.get(
			"/metrics/perf",
			{
				preHandler: metricsAuthPreHandler,
			},
			async () => {
				const agg = app.perfAggregate;
				const avg = agg.totalRequests > 0 ? agg.totalMs / agg.totalRequests : 0;
				return {
					totalRequests: agg.totalRequests,
					avgMs: Math.round(avg),
					recent: agg.lastSnapshots.slice(0, 20),
				};
			},
		);

		app.log.info({ msg: "Performance plugin registered" });
	},
	{
		name: "performance",
	},
);
