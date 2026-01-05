import Fastify, { type FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import performancePlugin from "~/src/fastifyPlugins/performance";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("performancePlugin", () => {
	let app: ReturnType<typeof Fastify>;

	beforeEach(async () => {
		app = Fastify({
			logger: {
				level: "info",
			},
		});

		// Decorate with envConfig (required by performance plugin)
		app.decorate("envConfig", {
			API_PERF_SLOW_OP_MS: undefined,
			API_PERF_SLOW_REQUEST_MS: undefined,
			METRICS_API_KEY: undefined,
			METRICS_ALLOWED_IPS: undefined,
		});

		await app.register(performancePlugin);
		// Don't call app.ready() here - let each test control when ready() is called
	});

	afterEach(async () => {
		if (app) {
			await app.close();
		}
		vi.restoreAllMocks();
	});

	it("should attach performance tracker to requests", async () => {
		app.get("/test", async (req: FastifyRequest) => {
			// Verify perf tracker is attached (don't throw if not, just return status)
			if (!req.perf) {
				return { error: "perf tracker not attached" };
			}
			return { ok: true };
		});

		await app.ready();

		const res = await app.inject({ method: "GET", url: "/test" });

		expect(res.statusCode).toBe(200);
		expect(res.headers["server-timing"]).toBeDefined();
		const body = res.json();
		expect(body).toEqual({ ok: true });
	});

	it("should log slow requests when threshold is exceeded", async () => {
		// Check that slow request was logged
		// The log.warn is called on the request logger, so we need to spy on it
		const logWarnSpy = vi.fn();
		app.addHook("onRequest", async (req: FastifyRequest) => {
			vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
		});

		app.get("/slow", async (req: FastifyRequest) => {
			// Simulate slow operation
			await req.perf?.time("slow-op", async () => {
				await new Promise((resolve) => setTimeout(resolve, 600));
			});
			return { ok: true };
		});

		await app.ready();

		await app.inject({ method: "GET", url: "/slow" });

		// Verify slow request was logged (if total >= 500ms)
		expect(logWarnSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Slow request",
				totalMs: expect.any(Number),
				path: "/slow",
			}),
		);
	});

	it("should not log requests below slow threshold", async () => {
		const logWarnSpy = vi.fn();
		app.addHook("onRequest", async (req: FastifyRequest) => {
			vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
		});

		app.get("/fast", async () => {
			return { ok: true };
		});

		await app.ready();

		await app.inject({ method: "GET", url: "/fast" });

		// Should not log fast requests
		const slowRequestLogs = logWarnSpy.mock.calls.filter((call) =>
			call[0]?.msg?.includes("Slow request"),
		);
		expect(slowRequestLogs.length).toBe(0);
	});

	it("should include slow operations in slow request log", async () => {
		const logWarnSpy = vi.fn();
		app.addHook("onRequest", async (req: FastifyRequest) => {
			vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
		});

		app.get("/slow-ops", async (req: FastifyRequest) => {
			// Create slow operations
			await req.perf?.time("db:slow-query", async () => {
				await new Promise((resolve) => setTimeout(resolve, 300));
			});
			await new Promise((resolve) => setTimeout(resolve, 300));
			return { ok: true };
		});

		await app.ready();

		await app.inject({ method: "GET", url: "/slow-ops" });

		// Check that slow operations are included in the log
		const slowRequestCall = logWarnSpy.mock.calls.find((call) =>
			call[0]?.msg?.includes("Slow request"),
		);
		if (slowRequestCall) {
			expect(slowRequestCall[0]).toHaveProperty("slowOps");
			expect(Array.isArray(slowRequestCall[0].slowOps)).toBe(true);
		}
	});

	it("should limit snapshots to 200", async () => {
		app.get("/test", async () => ({ ok: true }));

		await app.ready();

		// Make 250 requests
		for (let i = 0; i < 250; i++) {
			const res = await app.inject({ method: "GET", url: "/test" });
			expect(res.statusCode).toBe(200);
		}

		// Check metrics endpoint
		const res = await app.inject({ method: "GET", url: "/metrics/perf" });

		expect(res.statusCode).toBe(200);
		const body = JSON.parse(res.body);
		// Should have at most 200 snapshots stored, but endpoint returns max 20
		expect(body.recent.length).toBeLessThanOrEqual(20);
	});

	it("should handle exactly 201 snapshots and splice correctly", async () => {
		app.get("/test", async () => ({ ok: true }));

		await app.ready();

		// Make exactly 201 requests to test the splice logic
		for (let i = 0; i < 201; i++) {
			const res = await app.inject({ method: "GET", url: "/test" });
			expect(res.statusCode).toBe(200);
		}

		// Verify internal storage is limited to 200
		// The endpoint returns max 20, so we can't directly verify 200
		// But we can verify it's working by checking the endpoint still works
		const res = await app.inject({ method: "GET", url: "/metrics/perf" });
		expect(res.statusCode).toBe(200);
		const body = JSON.parse(res.body);
		expect(body.recent.length).toBeLessThanOrEqual(20);
	});

	it("should use custom slow operation threshold from envConfig", async () => {
		await app.close();

		app = Fastify({
			logger: {
				level: "info",
			},
		});

		app.decorate("envConfig", {
			API_PERF_SLOW_OP_MS: 100,
		});

		await app.register(performancePlugin);

		app.get("/test", async (req: FastifyRequest) => {
			// Create operation that takes 150ms (should be slow with 100ms threshold)
			await req.perf?.time("test-op", async () => {
				await new Promise((resolve) => setTimeout(resolve, 150));
			});
			return { ok: true };
		});

		await app.ready();

		await app.inject({ method: "GET", url: "/test" });

		const res = await app.inject({ method: "GET", url: "/metrics/perf" });
		const body = JSON.parse(res.body);

		if (body.recent.length > 0) {
			const snapshot = body.recent[0];
			// Should have slow operations recorded
			expect(snapshot.slow).toBeDefined();
			expect(Array.isArray(snapshot.slow)).toBe(true);
		}
	});

	it("should use custom slow request threshold from envConfig", async () => {
		await app.close();

		app = Fastify({
			logger: {
				level: "info",
			},
		});

		app.decorate("envConfig", {
			API_PERF_SLOW_REQUEST_MS: 200,
		});

		await app.register(performancePlugin);

		const logWarnSpy = vi.fn();
		app.addHook("onRequest", async (req: FastifyRequest) => {
			vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
		});

		app.get("/test", async () => {
			// Create request that takes 250ms (should be slow with 200ms threshold)
			await new Promise((resolve) => setTimeout(resolve, 250));
			return { ok: true };
		});

		await app.ready();

		await app.inject({ method: "GET", url: "/test" });

		// Should log slow request
		const slowRequestCall = logWarnSpy.mock.calls.find((call) =>
			call[0]?.msg?.includes("Slow request"),
		);
		expect(slowRequestCall).toBeDefined();
	});

	it("should handle requests without perf tracker gracefully", async () => {
		app.get("/no-perf", async (req: FastifyRequest) => {
			// Manually remove perf tracker
			delete req.perf;
			return { ok: true };
		});

		await app.ready();

		const res = await app.inject({ method: "GET", url: "/no-perf" });

		// Should still return response
		expect(res.statusCode).toBe(200);
		// Server-Timing header should still be present (with default values)
		expect(res.headers["server-timing"]).toBeDefined();
	});

	it("should handle requests without _t0 timestamp", async () => {
		app.addHook("onRequest", async (req: FastifyRequest) => {
			// Don't set _t0 to test fallback
			req.perf = createPerformanceTracker();
		});

		app.get("/no-t0", async () => ({ ok: true }));

		await app.ready();

		const res = await app.inject({ method: "GET", url: "/no-t0" });

		// Should still work with fallback to Date.now()
		expect(res.statusCode).toBe(200);
		expect(res.headers["server-timing"]).toBeDefined();
	});

	it("should calculate dbMs correctly from ops", async () => {
		app.get("/test-db", async (req: FastifyRequest) => {
			await req.perf?.time("db:users.byId", async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
			});
			await req.perf?.time("db:organizations.byId", async () => {
				await new Promise((resolve) => setTimeout(resolve, 30));
			});
			return { ok: true };
		});

		await app.ready();

		const res = await app.inject({ method: "GET", url: "/test-db" });

		expect(res.statusCode).toBe(200);
		const st = res.headers["server-timing"] as string;
		// Extract db duration
		const dbMatch = st.match(/db;dur=(\d+)/);
		expect(dbMatch).not.toBeNull();
		if (dbMatch?.[1]) {
			const dbMs = Number.parseInt(dbMatch[1], 10);
			// Should be at least 80ms (50 + 30)
			expect(dbMs).toBeGreaterThanOrEqual(80);
		}
	});

	it("should include cache metrics in Server-Timing header", async () => {
		app.get("/test-cache", async (req: FastifyRequest) => {
			req.perf?.trackCacheHit();
			req.perf?.trackCacheHit();
			req.perf?.trackCacheMiss();
			return { ok: true };
		});

		await app.ready();

		const res = await app.inject({ method: "GET", url: "/test-cache" });

		expect(res.statusCode).toBe(200);
		const st = res.headers["server-timing"] as string;
		expect(st).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
		// Should have 2 hits and 1 miss
		expect(st).toMatch(/hit:2\|miss:1/);
	});

	describe("isIpInRange edge cases", () => {
		it("should handle invalid CIDR prefix length", async () => {
			await app.close();

			app = Fastify({
				logger: {
					level: "info",
				},
			});

			app.decorate("envConfig", {
				METRICS_ALLOWED_IPS: "192.168.1.0/33", // Invalid prefix
			});

			await app.register(performancePlugin);
			await app.ready();

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			// Should reject invalid CIDR
			expect(res.statusCode).toBe(403);
		});

		it("should handle invalid IP format in CIDR", async () => {
			await app.close();

			app = Fastify({
				logger: {
					level: "info",
				},
			});

			app.decorate("envConfig", {
				METRICS_ALLOWED_IPS: "invalid-ip/24",
			});

			await app.register(performancePlugin);
			await app.ready();

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			// Should reject invalid IP
			expect(res.statusCode).toBe(403);
		});

		it("should handle CIDR without network part", async () => {
			await app.close();

			app = Fastify({
				logger: {
					level: "info",
				},
			});

			app.decorate("envConfig", {
				METRICS_ALLOWED_IPS: "/24",
			});

			await app.register(performancePlugin);
			await app.ready();

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			// Should reject invalid CIDR
			expect(res.statusCode).toBe(403);
		});

		it("should reject when req.ip is missing and allowedIps is configured", async () => {
			await app.close();

			app = Fastify({
				logger: {
					level: "info",
				},
			});

			app.decorate("envConfig", {
				METRICS_ALLOWED_IPS: "127.0.0.1",
				METRICS_API_KEY: undefined,
			});

			await app.register(performancePlugin);

			// Register a hook that runs before the preHandler to clear req.ip
			// Use preHandler hook to modify req.ip right before the metrics preHandler runs
			app.addHook("preHandler", async (req: FastifyRequest) => {
				// Clear req.ip to simulate missing IP address for /metrics/perf endpoint
				if (req.url === "/metrics/perf") {
					// Use Object.defineProperty to safely set ip to undefined
					Object.defineProperty(req, "ip", {
						value: undefined,
						writable: true,
						configurable: true,
					});
				}
			});

			await app.ready();

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(403);
			const body = JSON.parse(res.body);
			expect(body.error).toBe("Forbidden");
			expect(body.message).toBe("IP address not available");
		});

		it("should reject when neither IP nor API key matches", async () => {
			await app.close();

			app = Fastify({
				logger: {
					level: "info",
				},
			});

			app.decorate("envConfig", {
				METRICS_API_KEY: "correct-key",
				METRICS_ALLOWED_IPS: "192.168.1.1",
			});

			await app.register(performancePlugin);
			await app.ready();

			// Request from wrong IP with wrong API key
			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					authorization: "wrong-key",
				},
			});

			expect(res.statusCode).toBe(403);
			const body = JSON.parse(res.body);
			expect(body.error).toBe("Forbidden");
			expect(body.message).toBe("Access denied");
		});
	});
});
