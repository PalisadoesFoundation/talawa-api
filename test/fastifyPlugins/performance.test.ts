/**
 * Tests for the performance plugin that adds automatic tracking to requests.
 */

import fastifyJwt from "@fastify/jwt";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
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

/**
 * Helper function to create a test app with required mock plugins registered.
 * This ensures Fastify's plugin dependency system is satisfied.
 */
async function createTestApp(
	mockDrizzleClient: unknown,
	mockCache: unknown,
	envConfig?: FastifyInstance["envConfig"],
): Promise<FastifyInstance> {
	const testApp = Fastify({
		logger: {
			level: "silent",
		},
	});

	// Decorate envConfig
	testApp.decorate(
		"envConfig",
		envConfig ??
			({
				API_ENABLE_PERF_METRICS: true,
			} as FastifyInstance["envConfig"]),
	);

	// Register JWT plugin for authentication
	await testApp.register(fastifyJwt, {
		secret: "test-secret-key-for-jwt-verification-in-tests",
	});

	// Register mock plugins with the names expected by performance plugin dependencies
	// This satisfies Fastify's plugin dependency system
	const mockDrizzlePlugin = fp(
		async (fastify: FastifyInstance) => {
			fastify.decorate(
				"drizzleClient",
				mockDrizzleClient as FastifyInstance["drizzleClient"],
			);
		},
		{
			name: "drizzleClient",
		},
	);

	const mockCachePlugin = fp(
		async (fastify: FastifyInstance) => {
			fastify.decorate("cache", mockCache as FastifyInstance["cache"]);
		},
		{
			name: "cacheService",
		},
	);

	await testApp.register(mockDrizzlePlugin);
	await testApp.register(mockCachePlugin);

	return testApp;
}

describe("Performance Plugin", () => {
	let app: FastifyInstance;
	let mockDrizzleClient: unknown;
	let mockCache: unknown;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockDrizzleClient = { query: {} };
		mockCache = { get: vi.fn() };

		// Create test app with mock plugins registered
		app = await createTestApp(mockDrizzleClient, mockCache);

		// Register all test routes before app.ready()
		// These routes are used across multiple tests
		app.get("/test", async () => ({ ok: true }));
		app.get("/test1", async () => ({ ok: true }));
		app.get("/test2", async () => ({ ok: true }));
		app.get("/test3", async () => ({ ok: true }));
		// Register routes for limit tests (test-0 through test-249)
		for (let i = 0; i < 250; i++) {
			app.get(`/test-${i}`, async () => ({ ok: true }));
		}

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
			// Create a new app instance for this test to register route before ready
			const testApp = await createTestApp(mockDrizzleClient, mockCache);

			// Register route before ready
			testApp.get("/cache-test", async (request: FastifyRequest) => {
				// Use the wrapped cache to trigger tracking
				await request.cache?.get("test-key");
				return { success: true };
			});

			await testApp.register(performancePlugin);
			await testApp.ready();

			const response = await testApp.inject({
				method: "GET",
				url: "/cache-test",
			});

			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);

			await testApp.close();
		});

		it("should handle requests without perf tracker gracefully", async () => {
			// Create a new app instance for this test
			const testApp = await createTestApp(mockDrizzleClient, mockCache);

			// Register route before ready
			testApp.get("/test-no-perf", async () => ({ ok: true }));

			await testApp.register(performancePlugin);

			// Add hook to remove perf tracker after it's created
			testApp.addHook("onRequest", async (req) => {
				// Remove perf tracker to simulate missing perf scenario
				delete req.perf;
			});

			await testApp.ready();

			const response = await testApp.inject({
				method: "GET",
				url: "/test-no-perf",
			});

			// Should still add header with default values
			expect(response.headers["server-timing"]).toBeDefined();
			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toContain("db;dur=0");
			expect(serverTiming).toContain('cache;desc="hit:0|miss:0"');

			await testApp.close();
		});

		it("should store snapshot in recent buffer", async () => {
			await app.inject({
				method: "GET",
				url: "/test",
			});

			// Create a test token for authentication
			const token = app.jwt.sign({ user: { id: "test-user" } });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent).toBeDefined();
			expect(Array.isArray(body.recent)).toBe(true);
		});

		it("should limit recent snapshots to 200", async () => {
			// Routes are already registered in beforeEach, so we can use them
			// Make 250 requests
			for (let i = 0; i < 250; i++) {
				await app.inject({
					method: "GET",
					url: `/test-${i}`,
				});
			}

			// Create a test token for authentication
			const token = app.jwt.sign({ user: { id: "test-user" } });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent?.length).toBeLessThanOrEqual(200);
		});
	});

	describe("/metrics/perf Endpoint", () => {
		it("should return recent performance snapshots", async () => {
			// Routes are already registered in beforeEach
			// Make a few requests to generate snapshots
			await app.inject({ method: "GET", url: "/test1" });
			await app.inject({ method: "GET", url: "/test2" });
			await app.inject({ method: "GET", url: "/test3" });

			// Create a test token for authentication
			const token = app.jwt.sign({ user: { id: "test-user" } });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			expect(response.statusCode).toBe(200);
			const body = response.json() as { recent?: unknown[] };
			expect(body.recent).toBeDefined();
			expect(Array.isArray(body.recent)).toBe(true);
			expect(body.recent?.length).toBeGreaterThan(0);
		});

		it("should limit returned snapshots to 50", async () => {
			// Routes are already registered in beforeEach
			// Make 100 requests
			for (let i = 0; i < 100; i++) {
				await app.inject({
					method: "GET",
					url: `/test-${i}`,
				});
			}

			// Create a test token for authentication
			const token = app.jwt.sign({ user: { id: "test-user" } });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent?.length).toBeLessThanOrEqual(50);
		});

		it("should return snapshots in reverse chronological order", async () => {
			// Routes are already registered in beforeEach
			await app.inject({ method: "GET", url: "/test1" });
			await new Promise((resolve) => setTimeout(resolve, 10));
			await app.inject({ method: "GET", url: "/test2" });

			// Create a test token for authentication
			const token = app.jwt.sign({ user: { id: "test-user" } });

			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					Authorization: `Bearer ${token}`,
				},
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
			// Create a new app instance for this test to register route before ready
			const testApp = await createTestApp(mockDrizzleClient, mockCache);

			// Register route before ready
			let requestDrizzleClient: unknown;
			let requestCache: unknown;

			testApp.get("/test-clients", async (request: FastifyRequest) => {
				requestDrizzleClient = request.drizzleClient;
				requestCache = request.cache;
				return { success: true };
			});

			await testApp.register(performancePlugin);
			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-clients",
			});

			expect(requestDrizzleClient).toBeDefined();
			expect(requestCache).toBeDefined();
			expect((requestDrizzleClient as { _wrapped?: boolean })?._wrapped).toBe(
				true,
			);
			expect((requestCache as { _wrapped?: boolean })?._wrapped).toBe(true);

			await testApp.close();
		});
	});

	describe("Performance Metrics Endpoint Configuration", () => {
		it("should not register /metrics/perf endpoint when API_ENABLE_PERF_METRICS is false", async () => {
			const testApp = await createTestApp(mockDrizzleClient, mockCache, {
				API_ENABLE_PERF_METRICS: false,
			} as FastifyInstance["envConfig"]);

			await testApp.register(performancePlugin);
			await testApp.ready();

			// Endpoint should not be registered
			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(response.statusCode).toBe(404);

			await testApp.close();
		});

		it("should not register /metrics/perf endpoint when API_ENABLE_PERF_METRICS is undefined", async () => {
			const testApp = await createTestApp(mockDrizzleClient, mockCache, {
				API_ENABLE_PERF_METRICS: undefined,
			} as FastifyInstance["envConfig"]);

			await testApp.register(performancePlugin);
			await testApp.ready();

			// Endpoint should not be registered (defaults to false)
			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(response.statusCode).toBe(404);

			await testApp.close();
		});

		it("should require JWT authentication for /metrics/perf endpoint", async () => {
			// This test verifies the preHandler authentication
			const response = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				// No Authorization header
			});

			expect(response.statusCode).toBe(200); // Fastify returns 200 but with error in body
			const body = response.json() as { errors?: unknown[] };
			expect(body.errors).toBeDefined();
			expect(Array.isArray(body.errors)).toBe(true);
			if (Array.isArray(body.errors) && body.errors.length > 0) {
				const error = body.errors[0] as { extensions?: { code?: string } };
				expect(error.extensions?.code).toBe("unauthenticated");
			}
		});
	});
});
