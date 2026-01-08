import Fastify, { type FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";
import performancePlugin from "~/src/fastifyPlugins/performance";
import type { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("Performance Plugin", () => {
	describe("onRequest Hook", () => {
		it("should attach performance tracker to each request", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			let capturedPerf: ReturnType<typeof createPerformanceTracker> | undefined;

			app.get("/test-perf", async (req) => {
				capturedPerf = req.perf;
				return { ok: true };
			});

			await app.ready();
			await app.inject({ method: "GET", url: "/test-perf" });
			await app.close();

			expect(capturedPerf).toBeDefined();
			expect(capturedPerf?.snapshot).toBeDefined();
			expect(typeof capturedPerf?.snapshot).toBe("function");
		});

		it("should attach request start timestamp", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			let capturedT0: number | undefined;

			app.get("/test-t0", async (req) => {
				capturedT0 = req._t0;
				return { ok: true };
			});

			await app.ready();
			const beforeRequest = Date.now();
			await app.inject({ method: "GET", url: "/test-t0" });
			const afterRequest = Date.now();
			await app.close();

			expect(capturedT0).toBeDefined();
			expect(typeof capturedT0).toBe("number");
			expect(capturedT0).toBeGreaterThanOrEqual(beforeRequest);
			expect(capturedT0).toBeLessThanOrEqual(afterRequest);
		});

		it("should create independent trackers for each request", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			const trackers: Array<ReturnType<typeof createPerformanceTracker>> = [];

			app.get("/test-multiple", async (req) => {
				if (req.perf) {
					trackers.push(req.perf);
					req.perf.trackDb(10);
				}
				return { ok: true };
			});

			await app.ready();
			await app.inject({ method: "GET", url: "/test-multiple" });
			await app.inject({ method: "GET", url: "/test-multiple" });
			await app.close();

			expect(trackers).toHaveLength(2);
			expect(trackers[0]).not.toBe(trackers[1]);

			// Each tracker should have independent state
			const snap1 = trackers[0]?.snapshot();
			const snap2 = trackers[1]?.snapshot();

			expect(snap1?.ops.db?.ms).toBe(10);
			expect(snap2?.ops.db?.ms).toBe(10);
		});
	});

	describe("onSend Hook", () => {
		it("should add Server-Timing header to responses", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-timing", async (req) => {
				req.perf?.trackDb(50);
				req.perf?.trackCacheHit();
				req.perf?.trackCacheMiss();
				return { ok: true };
			});

			await app.ready();
			const res = await app.inject({ method: "GET", url: "/test-timing" });
			await app.close();

			const serverTiming = res.headers["server-timing"] as string;
			expect(serverTiming).toBeDefined();
			expect(serverTiming).toMatch(/db;dur=\d+/);
			expect(serverTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
			expect(serverTiming).toMatch(/total;dur=\d+/);
		});

		it("should include correct db duration in Server-Timing header", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-db-duration", async (req) => {
				req.perf?.trackDb(123);
				return { ok: true };
			});

			await app.ready();
			const res = await app.inject({ method: "GET", url: "/test-db-duration" });
			await app.close();

			const serverTiming = res.headers["server-timing"] as string;
			const dbMatch = serverTiming.match(/db;dur=(\d+)/);
			expect(dbMatch).not.toBeNull();
			if (dbMatch?.[1]) {
				const dbDur = Number.parseInt(dbMatch[1], 10);
				expect(dbDur).toBe(123);
			}
		});

		it("should include cache hit/miss counts in Server-Timing header", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-cache", async (req) => {
				req.perf?.trackCacheHit();
				req.perf?.trackCacheHit();
				req.perf?.trackCacheMiss();
				return { ok: true };
			});

			await app.ready();
			const res = await app.inject({ method: "GET", url: "/test-cache" });
			await app.close();

			const serverTiming = res.headers["server-timing"] as string;
			const cacheMatch = serverTiming.match(
				/cache;desc="hit:(\d+)\|miss:(\d+)"/,
			);
			expect(cacheMatch).not.toBeNull();
			if (cacheMatch?.[1] && cacheMatch[2]) {
				expect(Number.parseInt(cacheMatch[1], 10)).toBe(2);
				expect(Number.parseInt(cacheMatch[2], 10)).toBe(1);
			}
		});

		it("should calculate total duration from request start time", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-total", async (_req) => {
				// Simulate some work with a larger delay to reduce flakiness
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { ok: true };
			});

			await app.ready();
			const res = await app.inject({ method: "GET", url: "/test-total" });
			await app.close();

			const serverTiming = res.headers["server-timing"] as string;
			const totalMatch = serverTiming.match(/total;dur=(\d+)/);
			expect(totalMatch).not.toBeNull();
			if (totalMatch?.[1]) {
				const totalDur = Number.parseInt(totalMatch[1], 10);
				expect(totalDur).toBeGreaterThanOrEqual(50);
			}
		});

		it("should store snapshot in recent buffer", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-snapshot", async (req) => {
				req.perf?.trackDb(25);
				req.perf?.trackCacheHit();
				return { ok: true };
			});

			await app.ready();
			await app.inject({ method: "GET", url: "/test-snapshot" });

			// Request the metrics endpoint
			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});
			await app.close();

			const body = res.json();
			expect(body.recent).toBeDefined();
			expect(Array.isArray(body.recent)).toBe(true);
			expect(body.recent.length).toBeGreaterThan(0);

			// Verify the snapshot structure
			const snapshot = body.recent[0];
			expect(snapshot).toHaveProperty("totalMs");
			expect(snapshot).toHaveProperty("cacheHits");
			expect(snapshot).toHaveProperty("cacheMisses");
			expect(snapshot).toHaveProperty("ops");
			expect(snapshot.ops.db?.ms).toBe(25);
			expect(snapshot.cacheHits).toBe(1);
		});

		it("should handle requests without performance tracker gracefully", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-no-perf", async (req) => {
				// Manually remove perf to simulate edge case
				delete (req as FastifyRequest & { perf?: unknown }).perf;
				return { ok: true };
			});

			await app.ready();
			const res = await app.inject({ method: "GET", url: "/test-no-perf" });
			await app.close();

			// Should still have Server-Timing header with default values
			const serverTiming = res.headers["server-timing"] as string;
			expect(serverTiming).toBeDefined();
			expect(serverTiming).toMatch(/db;dur=0/);
			expect(serverTiming).toMatch(/cache;desc="hit:0\|miss:0"/);
		});
	});

	describe("/metrics/perf endpoint", () => {
		it("should return recent performance snapshots", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-endpoint", async () => ({ ok: true }));

			await app.ready();
			// Make a few requests
			await app.inject({ method: "GET", url: "/test-endpoint" });
			await app.inject({ method: "GET", url: "/test-endpoint" });

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});
			await app.close();

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body).toHaveProperty("recent");
			expect(Array.isArray(body.recent)).toBe(true);
			expect(body.recent.length).toBeGreaterThanOrEqual(2);
		});

		it("should limit returned snapshots to 50", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-many", async () => ({ ok: true }));

			await app.ready();
			// Make 60 requests to exceed the limit
			for (let i = 0; i < 60; i++) {
				await app.inject({ method: "GET", url: "/test-many" });
			}

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});
			await app.close();

			const body = res.json();
			expect(body.recent.length).toBeLessThanOrEqual(50);
		});

		it("should include complexity score in snapshots when tracked", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-complexity", async (req) => {
				req.perf?.trackComplexity(150);
				return { ok: true };
			});

			await app.ready();
			await app.inject({ method: "GET", url: "/test-complexity" });

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});
			await app.close();

			const body = res.json();
			const snapshot = body.recent[0];
			expect(snapshot).toHaveProperty("complexityScore");
			expect(snapshot.complexityScore).toBe(150);
		});

		it("should not include complexity score when not tracked", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-no-complexity", async () => ({ ok: true }));

			await app.ready();
			await app.inject({ method: "GET", url: "/test-no-complexity" });

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});
			await app.close();

			const body = res.json();
			const snapshot = body.recent[0];
			expect(snapshot).not.toHaveProperty("complexityScore");
		});

		it("should return snapshots that conform to PerfSnapshot contract", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-snapshot-contract", async (req) => {
				// Exercise various tracking methods to ensure all fields are populated
				req.perf?.trackDb(50);
				req.perf?.trackCacheHit();
				req.perf?.trackCacheMiss();
				req.perf?.trackComplexity(200);
				return { ok: true };
			});

			await app.ready();
			await app.inject({ method: "GET", url: "/test-snapshot-contract" });

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});
			await app.close();

			const body = res.json();
			expect(body).toHaveProperty("recent");
			expect(Array.isArray(body.recent)).toBe(true);
			expect(body.recent.length).toBeGreaterThan(0);

			const snapshot = body.recent[0] as {
				totalMs: number;
				cacheHits: number;
				cacheMisses: number;
				ops: Record<string, { count: number; ms: number; max: number }>;
				complexityScore?: number;
			};

			// Verify all required PerfSnapshot fields are present
			expect(snapshot).toHaveProperty("totalMs");
			expect(typeof snapshot.totalMs).toBe("number");
			expect(snapshot.totalMs).toBeGreaterThanOrEqual(0);

			expect(snapshot).toHaveProperty("cacheHits");
			expect(typeof snapshot.cacheHits).toBe("number");
			expect(snapshot.cacheHits).toBeGreaterThanOrEqual(0);

			expect(snapshot).toHaveProperty("cacheMisses");
			expect(typeof snapshot.cacheMisses).toBe("number");
			expect(snapshot.cacheMisses).toBeGreaterThanOrEqual(0);

			expect(snapshot).toHaveProperty("ops");
			expect(typeof snapshot.ops).toBe("object");
			expect(Array.isArray(snapshot.ops)).toBe(false); // Should be a record/object

			// Verify ops structure for tracked operations
			const opKeys = Object.keys(snapshot.ops);
			if (opKeys.length > 0) {
				for (const opKey of opKeys) {
					const opStats = snapshot.ops[opKey];
					expect(opStats).toBeDefined();
					if (!opStats) continue;
					expect(opStats).toHaveProperty("count");
					expect(opStats).toHaveProperty("ms");
					expect(opStats).toHaveProperty("max");
					expect(typeof opStats.count).toBe("number");
					expect(typeof opStats.ms).toBe("number");
					expect(typeof opStats.max).toBe("number");
					expect(opStats.count).toBeGreaterThan(0);
					expect(opStats.ms).toBeGreaterThanOrEqual(0);
					expect(opStats.max).toBeGreaterThanOrEqual(0);
				}
			}

			// Verify complexityScore is present when tracked
			expect(snapshot).toHaveProperty("complexityScore");
			expect(typeof snapshot.complexityScore).toBe("number");
			expect(snapshot.complexityScore).toBe(200);
		});

		it("should return snapshots without complexityScore when not tracked via trackComplexity", async () => {
			const app = Fastify({
				logger: {
					level: "silent",
				},
			});

			await app.register(performancePlugin);

			app.get("/test-no-complexity-contract", async (req) => {
				req.perf?.trackDb(30);
				req.perf?.trackCacheHit();
				// Do not call trackComplexity
				return { ok: true };
			});

			await app.ready();
			await app.inject({ method: "GET", url: "/test-no-complexity-contract" });

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});
			await app.close();

			const body = res.json();
			const snapshot = body.recent[0] as {
				totalMs: number;
				cacheHits: number;
				cacheMisses: number;
				ops: Record<string, { count: number; ms: number; max: number }>;
				complexityScore?: number;
			};

			// Verify all required fields are present
			expect(snapshot).toHaveProperty("totalMs");
			expect(snapshot).toHaveProperty("cacheHits");
			expect(snapshot).toHaveProperty("cacheMisses");
			expect(snapshot).toHaveProperty("ops");

			// Verify complexityScore is NOT present when not tracked
			expect(snapshot).not.toHaveProperty("complexityScore");
		});
	});
});
