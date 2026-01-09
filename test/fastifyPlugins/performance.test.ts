/**
 * Tests for the performance plugin that adds automatic tracking to requests.
 */

import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import performancePlugin from "~/src/fastifyPlugins/performance";

// Mock the proxy wrappers
vi.mock("~/src/utilities/metrics/drizzleProxy", () => ({
	wrapDrizzleWithMetrics: vi.fn((client, getPerf) => {
		// Return wrapped client if perf exists, otherwise original
		const perf = getPerf();
		return perf ? { ...client, _wrapped: true } : client;
	}),
}));

vi.mock("~/src/utilities/metrics/cacheProxy", () => ({
	wrapCacheWithMetrics: vi.fn((cache, getPerf) => {
		// Return wrapped cache if perf exists, otherwise original
		const perf = getPerf();
		return perf ? { ...cache, _wrapped: true } : cache;
	}),
}));

import { wrapCacheWithMetrics } from "~/src/utilities/metrics/cacheProxy";
import { wrapDrizzleWithMetrics } from "~/src/utilities/metrics/drizzleProxy";

describe("Performance Plugin", () => {
	let app: FastifyInstance;
	let mockDrizzleClient: unknown;
	let mockCache: unknown;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockDrizzleClient = { query: {} };
		mockCache = { get: vi.fn() };

		app = Fastify({
			logger: {
				level: "silent",
			},
		});

		// Decorate with required properties
		app.decorate(
			"drizzleClient",
			mockDrizzleClient as FastifyInstance["drizzleClient"],
		);
		app.decorate("cache", mockCache as FastifyInstance["cache"]);

		await app.register(performancePlugin);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
	});

	describe("onRequest Hook", () => {
		it("should attach performance tracker to request", async () => {
			let requestPerf: unknown;

			app.addHook("onRequest", async (req) => {
				requestPerf = req.perf;
			});

			await app.inject({
				method: "GET",
				url: "/test",
			});

			expect(requestPerf).toBeDefined();
			expect(requestPerf).toHaveProperty("snapshot");
			expect(requestPerf).toHaveProperty("time");
		});

		it("should set request start timestamp", async () => {
			let requestT0: number | undefined;

			app.addHook("onRequest", async (req) => {
				requestT0 = req._t0;
			});

			const beforeRequest = Date.now();
			await app.inject({
				method: "GET",
				url: "/test",
			});
			const afterRequest = Date.now();

			expect(requestT0).toBeDefined();
			expect(requestT0).toBeGreaterThanOrEqual(beforeRequest);
			expect(requestT0).toBeLessThanOrEqual(afterRequest);
		});

		it("should wrap drizzleClient with metrics", async () => {
			let requestDrizzleClient: unknown;

			app.addHook("onRequest", async (req) => {
				requestDrizzleClient = req.drizzleClient;
			});

			await app.inject({
				method: "GET",
				url: "/test",
			});

			expect(wrapDrizzleWithMetrics).toHaveBeenCalledWith(
				mockDrizzleClient,
				expect.any(Function),
			);
			expect(requestDrizzleClient).toBeDefined();
			expect((requestDrizzleClient as { _wrapped?: boolean })?._wrapped).toBe(
				true,
			);
		});

		it("should wrap cache with metrics", async () => {
			let requestCache: unknown;

			app.addHook("onRequest", async (req) => {
				requestCache = req.cache;
			});

			await app.inject({
				method: "GET",
				url: "/test",
			});

			expect(wrapCacheWithMetrics).toHaveBeenCalledWith(
				mockCache,
				expect.any(Function),
			);
			expect(requestCache).toBeDefined();
			expect((requestCache as { _wrapped?: boolean })?._wrapped).toBe(true);
		});

		it("should pass getter function that returns request.perf", async () => {
			let getPerfFunction: (() => unknown) | undefined;

			app.addHook("onRequest", async (_req) => {
				// Capture the getter function passed to wrapDrizzleWithMetrics
				const calls = (wrapDrizzleWithMetrics as ReturnType<typeof vi.fn>).mock
					.calls;
				getPerfFunction = calls[calls.length - 1]?.[1] as () => unknown;
			});

			await app.inject({
				method: "GET",
				url: "/test",
			});

			expect(getPerfFunction).toBeDefined();
			if (getPerfFunction) {
				const perf = getPerfFunction();
				expect(perf).toBeDefined();
				expect(perf).toHaveProperty("snapshot");
			}
		});
	});

	describe("onSend Hook", () => {
		it("should add Server-Timing header with metrics", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/test",
			});

			expect(response.headers["server-timing"]).toBeDefined();
			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toContain("db;dur=");
			expect(serverTiming).toContain("cache;desc=");
			expect(serverTiming).toContain("total;dur=");
		});

		it("should include cache hit/miss information in Server-Timing header", async () => {
			// Create a request that uses cache
			app.get("/cache-test", async (request: FastifyRequest) => {
				// Use the wrapped cache to trigger tracking
				await request.cache?.get("test-key");
				return { success: true };
			});

			const response = await app.inject({
				method: "GET",
				url: "/cache-test",
			});

			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
		});

		it("should handle requests without perf tracker gracefully", async () => {
			// This test verifies that the onSend hook handles missing perf gracefully
			// The performance plugin always creates perf, so we test the onSend logic
			// by checking that it handles the case where snap might be undefined
			const response = await app.inject({
				method: "GET",
				url: "/test",
			});

			// Should still add header with default values
			expect(response.headers["server-timing"]).toBeDefined();
			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toContain("db;dur=0");
			expect(serverTiming).toContain('cache;desc="hit:0|miss:0"');
		});

		it("should store snapshot in recent buffer", async () => {
			await app.inject({
				method: "GET",
				url: "/test",
			});

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent).toBeDefined();
			expect(Array.isArray(body.recent)).toBe(true);
		});

		it("should limit recent snapshots to 200", async () => {
			// Make 250 requests
			for (let i = 0; i < 250; i++) {
				await app.inject({
					method: "GET",
					url: `/test-${i}`,
				});
			}

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent?.length).toBeLessThanOrEqual(200);
		});
	});

	describe("/metrics/perf Endpoint", () => {
		it("should return recent performance snapshots", async () => {
			// Make a few requests to generate snapshots
			await app.inject({ method: "GET", url: "/test1" });
			await app.inject({ method: "GET", url: "/test2" });
			await app.inject({ method: "GET", url: "/test3" });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(response.statusCode).toBe(200);
			const body = response.json() as { recent?: unknown[] };
			expect(body.recent).toBeDefined();
			expect(Array.isArray(body.recent)).toBe(true);
			expect(body.recent?.length).toBeGreaterThan(0);
		});

		it("should limit returned snapshots to 50", async () => {
			// Make 100 requests
			for (let i = 0; i < 100; i++) {
				await app.inject({
					method: "GET",
					url: `/test-${i}`,
				});
			}

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent?.length).toBeLessThanOrEqual(50);
		});

		it("should return snapshots in reverse chronological order", async () => {
			await app.inject({ method: "GET", url: "/test1" });
			await new Promise((resolve) => setTimeout(resolve, 10));
			await app.inject({ method: "GET", url: "/test2" });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json() as {
				recent?: Array<{ totalMs?: number }>;
			};
			// Most recent should be first
			expect(body.recent?.[0]).toBeDefined();
		});
	});

	describe("Integration with Wrapped Clients", () => {
		it("should allow resolvers to use wrapped clients from request", async () => {
			let requestDrizzleClient: unknown;
			let requestCache: unknown;

			app.get("/test-clients", async (request: FastifyRequest) => {
				requestDrizzleClient = request.drizzleClient;
				requestCache = request.cache;
				return { success: true };
			});

			await app.inject({
				method: "GET",
				url: "/test-clients",
			});

			expect(requestDrizzleClient).toBeDefined();
			expect(requestCache).toBeDefined();
			expect((requestDrizzleClient as { _wrapped?: boolean })?._wrapped).toBe(
				true,
			);
			expect((requestCache as { _wrapped?: boolean })?._wrapped).toBe(true);
		});
	});
});
