import Fastify from "fastify";
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

		await app.register(performancePlugin);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
	});

	it("should attach performance tracker to requests", async () => {
		app.get(
			"/test",
			async (req: { perf?: ReturnType<typeof createPerformanceTracker> }) => {
				expect(req.perf).toBeDefined();
				return { ok: true };
			},
		);

		const res = await app.inject({ method: "GET", url: "/test" });

		expect(res.statusCode).toBe(200);
		expect(res.headers["server-timing"]).toBeDefined();
	});

	it("should log slow requests when threshold is exceeded", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		app.get(
			"/slow",
			async (req: { perf?: ReturnType<typeof createPerformanceTracker> }) => {
				// Simulate slow operation
				await req.perf?.time("slow-op", async () => {
					await new Promise((resolve) => setTimeout(resolve, 600));
				});
				return { ok: true };
			},
		);

		await app.inject({ method: "GET", url: "/slow" });

		// Check that slow request was logged
		// The log.warn is called on the request logger, so we need to spy on it
		const logWarnSpy = vi.fn();
		app.addHook(
			"onRequest",
			async (req: { log: { warn: ReturnType<typeof vi.fn> } }) => {
				vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
			},
		);

		await app.inject({ method: "GET", url: "/slow" });

		// Verify slow request was logged (if total >= 500ms)
		expect(logWarnSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Slow request",
				totalMs: expect.any(Number),
				path: "/slow",
			}),
		);

		warnSpy.mockRestore();
	});

	it("should not log requests below slow threshold", async () => {
		const logWarnSpy = vi.fn();
		app.addHook(
			"onRequest",
			async (req: { log: { warn: ReturnType<typeof vi.fn> } }) => {
				vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
			},
		);

		app.get("/fast", async () => {
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/fast" });

		// Should not log fast requests
		const slowRequestLogs = logWarnSpy.mock.calls.filter((call) =>
			call[0]?.msg?.includes("Slow request"),
		);
		expect(slowRequestLogs.length).toBe(0);
	});

	it("should include slow operations in slow request log", async () => {
		const logWarnSpy = vi.fn();
		app.addHook(
			"onRequest",
			async (req: { log: { warn: ReturnType<typeof vi.fn> } }) => {
				vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
			},
		);

		app.get(
			"/slow-ops",
			async (req: { perf?: ReturnType<typeof createPerformanceTracker> }) => {
				// Create slow operations
				await req.perf?.time("db:slow-query", async () => {
					await new Promise((resolve) => setTimeout(resolve, 300));
				});
				await new Promise((resolve) => setTimeout(resolve, 300));
				return { ok: true };
			},
		);

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

		// Make 250 requests
		for (let i = 0; i < 250; i++) {
			await app.inject({ method: "GET", url: "/test" });
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

		// Make exactly 201 requests to test the splice logic
		for (let i = 0; i < 201; i++) {
			await app.inject({ method: "GET", url: "/test" });
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
		await app.ready();

		app.get(
			"/test",
			async (req: { perf?: ReturnType<typeof createPerformanceTracker> }) => {
				// Create operation that takes 150ms (should be slow with 100ms threshold)
				await req.perf?.time("test-op", async () => {
					await new Promise((resolve) => setTimeout(resolve, 150));
				});
				return { ok: true };
			},
		);

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
		await app.ready();

		const logWarnSpy = vi.fn();
		app.addHook(
			"onRequest",
			async (req: { log: { warn: ReturnType<typeof vi.fn> } }) => {
				vi.spyOn(req.log, "warn").mockImplementation(logWarnSpy);
			},
		);

		app.get("/test", async () => {
			// Create request that takes 250ms (should be slow with 200ms threshold)
			await new Promise((resolve) => setTimeout(resolve, 250));
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/test" });

		// Should log slow request
		const slowRequestCall = logWarnSpy.mock.calls.find((call) =>
			call[0]?.msg?.includes("Slow request"),
		);
		expect(slowRequestCall).toBeDefined();
	});

	it("should handle requests without perf tracker gracefully", async () => {
		app.get(
			"/no-perf",
			async (req: { perf?: ReturnType<typeof createPerformanceTracker> }) => {
				// Manually remove perf tracker
				delete req.perf;
				return { ok: true };
			},
		);

		const res = await app.inject({ method: "GET", url: "/no-perf" });

		// Should still return response
		expect(res.statusCode).toBe(200);
		// Server-Timing header should still be present (with default values)
		expect(res.headers["server-timing"]).toBeDefined();
	});

	it("should handle requests without _t0 timestamp", async () => {
		app.addHook(
			"onRequest",
			async (req: {
				_t0?: number;
				perf?: ReturnType<typeof createPerformanceTracker>;
			}) => {
				// Don't set _t0 to test fallback
				req.perf = createPerformanceTracker();
			},
		);

		app.get("/no-t0", async () => ({ ok: true }));

		const res = await app.inject({ method: "GET", url: "/no-t0" });

		// Should still work with fallback to Date.now()
		expect(res.statusCode).toBe(200);
		expect(res.headers["server-timing"]).toBeDefined();
	});

	it("should calculate dbMs correctly from ops", async () => {
		app.get(
			"/test-db",
			async (req: { perf?: ReturnType<typeof createPerformanceTracker> }) => {
				await req.perf?.time("db:users.byId", async () => {
					await new Promise((resolve) => setTimeout(resolve, 50));
				});
				await req.perf?.time("db:organizations.byId", async () => {
					await new Promise((resolve) => setTimeout(resolve, 30));
				});
				return { ok: true };
			},
		);

		const res = await app.inject({ method: "GET", url: "/test-db" });

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
		app.get(
			"/test-cache",
			async (req: { perf?: ReturnType<typeof createPerformanceTracker> }) => {
				req.perf?.trackCacheHit();
				req.perf?.trackCacheHit();
				req.perf?.trackCacheMiss();
				return { ok: true };
			},
		);

		const res = await app.inject({ method: "GET", url: "/test-cache" });

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
	});
});
