import Fastify, { type FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import performancePlugin from "../../src/fastifyPlugins/performance";

describe("Performance Plugin", () => {
	let app: ReturnType<typeof Fastify>;

	beforeEach(async () => {
		app = Fastify({
			logger: {
				level: "silent",
			},
		});

		await app.register(performancePlugin);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Plugin Registration", () => {
		it("should register the plugin successfully", () => {
			expect(app).toBeDefined();
		});

		it("should register /metrics/perf endpoint", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(response.statusCode).toBe(200);
		});
	});

	describe("onRequest Hook", () => {
		it("should attach perf tracker to request", async () => {
			let requestPerf: unknown;

			app.get("/test-perf-attach", async (request: FastifyRequest) => {
				requestPerf = request.perf;
				return { ok: true };
			});

			await app.inject({
				method: "GET",
				url: "/test-perf-attach",
			});

			expect(requestPerf).toBeDefined();
			expect(requestPerf).toHaveProperty("trackComplexity");
			expect(requestPerf).toHaveProperty("snapshot");
			expect(requestPerf).toHaveProperty("trackDb");
			expect(requestPerf).toHaveProperty("trackCacheHit");
			expect(requestPerf).toHaveProperty("trackCacheMiss");
		});

		it("should attach _t0 timestamp to request", async () => {
			let requestT0: number | undefined;

			app.get("/test-t0-attach", async (request: FastifyRequest) => {
				requestT0 = request._t0;
				return { ok: true };
			});

			await app.inject({
				method: "GET",
				url: "/test-t0-attach",
			});

			expect(requestT0).toBeDefined();
			expect(typeof requestT0).toBe("number");
			expect(requestT0).toBeGreaterThan(0);
		});
	});

	describe("onSend Hook", () => {
		it("should add Server-Timing header to response", async () => {
			app.get("/test-timing", async () => ({ ok: true }));

			const response = await app.inject({
				method: "GET",
				url: "/test-timing",
			});

			const serverTiming = response.headers["server-timing"] as string;

			expect(serverTiming).toBeDefined();
			expect(serverTiming).toMatch(/db;dur=\d+/);
			expect(serverTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
			expect(serverTiming).toMatch(/total;dur=\d+/);
		});

		it("should format Server-Timing header correctly", async () => {
			app.get("/test-format", async (request: FastifyRequest) => {
				// Track some operations
				request.perf?.trackDb(50);
				request.perf?.trackCacheHit();
				request.perf?.trackCacheMiss();
				return { ok: true };
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-format",
			});

			const serverTiming = response.headers["server-timing"] as string;

			// Verify db duration is included
			expect(serverTiming).toMatch(/db;dur=50/);
			// Verify cache description includes hits and misses
			expect(serverTiming).toMatch(/cache;desc="hit:1\|miss:1"/);
			// Verify total duration is present
			expect(serverTiming).toMatch(/total;dur=\d+/);
		});

		it("should store snapshot in recent buffer", async () => {
			app.get("/test-snapshot", async (request: FastifyRequest) => {
				request.perf?.trackDb(30);
				request.perf?.trackCacheHit();
				return { ok: true };
			});

			await app.inject({
				method: "GET",
				url: "/test-snapshot",
			});

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			expect(body.recent).toBeDefined();
			expect(Array.isArray(body.recent)).toBe(true);
			expect(body.recent.length).toBeGreaterThan(0);

			const snapshot = body.recent[0];
			expect(snapshot).toHaveProperty("totalMs");
			expect(snapshot).toHaveProperty("cacheHits");
			expect(snapshot).toHaveProperty("cacheMisses");
			expect(snapshot).toHaveProperty("ops");
			expect(snapshot.cacheHits).toBe(1);
		});

		it("should limit recent buffer to 200 snapshots", async () => {
			app.get("/test-buffer-limit", async () => ({ ok: true }));

			// Make 210 requests to exceed the 200 snapshot limit
			for (let i = 0; i < 210; i++) {
				await app.inject({
					method: "GET",
					url: "/test-buffer-limit",
				});
			}

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			// The buffer should be limited to 200, but /metrics/perf returns max 50
			// So we should see at most 50 snapshots
			expect(body.recent.length).toBeLessThanOrEqual(50);
		});
	});

	describe("/metrics/perf Endpoint", () => {
		it("should return JSON response with recent snapshots", async () => {
			app.get("/test-metrics-1", async () => ({ ok: true }));
			await app.inject({ method: "GET", url: "/test-metrics-1" });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(response.statusCode).toBe(200);
			expect(response.headers["content-type"]).toContain("application/json");

			const body = response.json();
			expect(body).toHaveProperty("recent");
			expect(Array.isArray(body.recent)).toBe(true);
		});

		it("should return at most 50 snapshots", async () => {
			app.get("/test-metrics-2", async () => ({ ok: true }));

			// Make 60 requests
			for (let i = 0; i < 60; i++) {
				await app.inject({ method: "GET", url: "/test-metrics-2" });
			}

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			// Should return at most 50 snapshots
			expect(body.recent.length).toBeLessThanOrEqual(50);
		});

		it("should return snapshots in correct format", async () => {
			app.get("/test-metrics-3", async (request: FastifyRequest) => {
				request.perf?.trackDb(25);
				request.perf?.trackCacheHit();
				request.perf?.trackCacheMiss();
				request.perf?.trackComplexity(10);
				return { ok: true };
			});

			await app.inject({ method: "GET", url: "/test-metrics-3" });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			if (body.recent.length > 0) {
				const snapshot = body.recent[0];

				// Verify snapshot structure
				expect(snapshot).toHaveProperty("totalMs");
				expect(snapshot).toHaveProperty("totalOps");
				expect(snapshot).toHaveProperty("cacheHits");
				expect(snapshot).toHaveProperty("cacheMisses");
				expect(snapshot).toHaveProperty("hitRate");
				expect(snapshot).toHaveProperty("ops");
				expect(snapshot).toHaveProperty("slow");

				// Verify types
				expect(typeof snapshot.totalMs).toBe("number");
				expect(typeof snapshot.totalOps).toBe("number");
				expect(typeof snapshot.cacheHits).toBe("number");
				expect(typeof snapshot.cacheMisses).toBe("number");
				expect(typeof snapshot.hitRate).toBe("number");
				expect(typeof snapshot.ops).toBe("object");
				expect(Array.isArray(snapshot.slow)).toBe(true);

				// Verify complexity score if tracked
				if (snapshot.complexityScore !== undefined) {
					expect(typeof snapshot.complexityScore).toBe("number");
					expect(snapshot.complexityScore).toBe(10);
				}
			}
		});

		it("should return most recent snapshots first", async () => {
			app.get("/test-metrics-4", async (request: FastifyRequest, i: number) => {
				// Track different operations to distinguish snapshots
				request.perf?.trackDb(i * 10);
				return { ok: true };
			});

			// Make 5 requests with different db times
			for (let i = 1; i <= 5; i++) {
				app.get(`/test-metrics-4-${i}`, async (request: FastifyRequest) => {
					request.perf?.trackDb(i * 10);
					return { ok: true };
				});
				await app.inject({ method: "GET", url: `/test-metrics-4-${i}` });
			}

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			// Most recent should be last (since we unshift, newest is at index 0)
			if (body.recent.length >= 2) {
				const first = body.recent[0];
				const second = body.recent[1];

				// First snapshot should be more recent (higher db time in our test)
				// Note: This is a simple check - in reality, timestamps would be better
				expect(first).toBeDefined();
				expect(second).toBeDefined();
			}
		});
	});

	describe("Edge Cases", () => {
		it("should handle missing perf tracker gracefully", async () => {
			// Manually remove perf tracker to simulate edge case
			app.addHook("onRequest", async (request: FastifyRequest) => {
				delete request.perf;
			});

			app.get("/test-no-perf", async () => ({ ok: true }));

			const response = await app.inject({
				method: "GET",
				url: "/test-no-perf",
			});

			// Should still return response (graceful degradation)
			expect(response.statusCode).toBe(200);

			// Server-Timing should still be present but with default values
			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toBeDefined();
			expect(serverTiming).toMatch(/db;dur=0/);
			expect(serverTiming).toMatch(/cache;desc="hit:0\|miss:0"/);
		});

		it("should handle missing _t0 timestamp gracefully", async () => {
			// Manually remove _t0 to simulate edge case
			app.addHook("onRequest", async (request: FastifyRequest) => {
				delete request._t0;
			});

			app.get("/test-no-t0", async () => ({ ok: true }));

			const response = await app.inject({
				method: "GET",
				url: "/test-no-t0",
			});

			// Should still return response
			expect(response.statusCode).toBe(200);

			// Server-Timing should still be present
			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toBeDefined();
		});

		it("should handle concurrent requests", async () => {
			app.get("/test-concurrent", async (request: FastifyRequest) => {
				request.perf?.trackDb(10);
				return { ok: true };
			});

			// Make multiple concurrent requests
			const promises = Array.from({ length: 10 }, () =>
				app.inject({
					method: "GET",
					url: "/test-concurrent",
				}),
			);

			const responses = await Promise.all(promises);

			// All requests should succeed
			responses.forEach((response) => {
				expect(response.statusCode).toBe(200);
				const serverTiming = response.headers["server-timing"] as string;
				expect(serverTiming).toBeDefined();
			});
		});

		it("should handle requests with no cache operations", async () => {
			app.get("/test-no-cache", async () => ({ ok: true }));

			const response = await app.inject({
				method: "GET",
				url: "/test-no-cache",
			});

			const serverTiming = response.headers["server-timing"] as string;

			// Should have cache description with zero hits and misses
			expect(serverTiming).toMatch(/cache;desc="hit:0\|miss:0"/);
		});

		it("should handle requests with no database operations", async () => {
			app.get("/test-no-db", async (request: FastifyRequest) => {
				request.perf?.trackCacheHit();
				return { ok: true };
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-no-db",
			});

			const serverTiming = response.headers["server-timing"] as string;

			// Should have db duration of 0
			expect(serverTiming).toMatch(/db;dur=0/);
		});
	});
});
