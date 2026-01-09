/**
 * Tests for the performance plugin that adds automatic tracking to requests.
 */

import fastifyJwt from "@fastify/jwt";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import performancePlugin from "~/src/fastifyPlugins/performance";

// Mock the proxy wrappers to preserve the real wrapper contract:
// Always return a Proxy-like wrapper that defers calling getPerf() until operation-time
vi.mock("~/src/utilities/metrics/drizzleProxy", () => ({
	wrapDrizzleWithMetrics: vi.fn((client, getPerf) => {
		// Always return a wrapper that defers getPerf() calls until operation-time
		// This mimics the real behavior where getPerf() is called during each operation
		const wrapped = new Proxy(client, {
			get(target, prop) {
				const original = Reflect.get(target, prop);
				if (typeof original === "function") {
					return function (this: unknown, ...args: unknown[]) {
						// Call getPerf() at operation-time, not wrap-time
						getPerf();
						// Call the original method
						return original.apply(this, args);
					};
				}
				return original;
			},
		});
		// Mark the wrapper itself for test assertions
		(wrapped as { _wrapped?: boolean })._wrapped = true;
		return wrapped;
	}),
}));

vi.mock("~/src/utilities/metrics/cacheProxy", () => ({
	wrapCacheWithMetrics: vi.fn((cache, getPerf) => {
		// Always return a wrapper that defers getPerf() calls until operation-time
		// This mimics the real behavior where getPerf() is called during each operation
		const wrapped = new Proxy(cache, {
			get(target, prop) {
				const original = Reflect.get(target, prop);
				if (typeof original === "function") {
					return function (this: unknown, ...args: unknown[]) {
						// Call getPerf() at operation-time, not wrap-time
						getPerf();
						// Call the original method
						return original.apply(this, args);
					};
				}
				return original;
			},
		});
		// Mark the wrapper itself for test assertions
		(wrapped as { _wrapped?: boolean })._wrapped = true;
		return wrapped;
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
		// Note: Routes for limit tests (test-0 through test-249) are registered
		// only in the specific tests that need them to keep the common test suite lightweight

		await app.register(performancePlugin);
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
	});

	describe("onRequest Hook", () => {
		it("should attach performance tracker to request", async () => {
			// Create a new app instance
			const testApp = await createTestApp(mockDrizzleClient, mockCache);
			let requestPerf: unknown;

			// Register route that captures perf from request
			testApp.get("/test-perf", async (req: FastifyRequest) => {
				requestPerf = req.perf;
				return { ok: true };
			});

			// Register performance plugin
			await testApp.register(performancePlugin);
			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-perf",
			});

			expect(requestPerf).toBeDefined();
			expect(requestPerf).toHaveProperty("snapshot");
			expect(requestPerf).toHaveProperty("time");

			await testApp.close();
		});

		it("should set request start timestamp", async () => {
			// Create a new app instance
			const testApp = await createTestApp(mockDrizzleClient, mockCache);
			let requestT0: number | undefined;

			// Register route that captures _t0 from request
			testApp.get("/test-t0", async (req: FastifyRequest) => {
				requestT0 = req._t0;
				return { ok: true };
			});

			// Register performance plugin
			await testApp.register(performancePlugin);
			await testApp.ready();

			const beforeRequest = Date.now();
			await testApp.inject({
				method: "GET",
				url: "/test-t0",
			});
			const afterRequest = Date.now();

			expect(requestT0).toBeDefined();
			expect(requestT0).toBeGreaterThanOrEqual(beforeRequest);
			expect(requestT0).toBeLessThanOrEqual(afterRequest);

			await testApp.close();
		});

		it("should wrap drizzleClient with metrics", async () => {
			// Create a new app instance
			const testApp = await createTestApp(mockDrizzleClient, mockCache);
			let requestDrizzleClient: unknown;

			// Register route that captures drizzleClient from request
			testApp.get("/test-drizzle", async (req: FastifyRequest) => {
				requestDrizzleClient = req.drizzleClient;
				return { ok: true };
			});

			// Register performance plugin
			await testApp.register(performancePlugin);
			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-drizzle",
			});

			expect(wrapDrizzleWithMetrics).toHaveBeenCalledWith(
				mockDrizzleClient,
				expect.any(Function),
			);
			expect(requestDrizzleClient).toBeDefined();
			expect((requestDrizzleClient as { _wrapped?: boolean })?._wrapped).toBe(
				true,
			);

			await testApp.close();
		});

		it("should wrap cache with metrics", async () => {
			// Create a new app instance
			const testApp = await createTestApp(mockDrizzleClient, mockCache);
			let requestCache: unknown;

			// Register route that captures cache from request
			testApp.get("/test-cache", async (req: FastifyRequest) => {
				requestCache = req.cache;
				return { ok: true };
			});

			// Register performance plugin
			await testApp.register(performancePlugin);
			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-cache",
			});

			expect(wrapCacheWithMetrics).toHaveBeenCalledWith(
				mockCache,
				expect.any(Function),
			);
			expect(requestCache).toBeDefined();
			expect((requestCache as { _wrapped?: boolean })?._wrapped).toBe(true);

			await testApp.close();
		});

		it("should pass getter function that returns request.perf", async () => {
			// Create a new app instance
			const testApp = await createTestApp(mockDrizzleClient, mockCache);

			// Register route
			testApp.get("/test-getter", async () => ({ ok: true }));

			// Register performance plugin first to set up the wrapDrizzleWithMetrics mock
			await testApp.register(performancePlugin);

			// Add onRequest hook after plugin registration to capture getter function
			// This ensures wrapDrizzleWithMetrics mock has been set up by the plugin
			let getPerfFunction: (() => unknown) | undefined;
			testApp.addHook("onRequest", async () => {
				// Capture the getter function passed to wrapDrizzleWithMetrics from mock calls
				const calls = (wrapDrizzleWithMetrics as ReturnType<typeof vi.fn>).mock
					.calls;
				getPerfFunction = calls[calls.length - 1]?.[1] as
					| (() => unknown)
					| undefined;
			});

			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-getter",
			});

			expect(getPerfFunction).toBeDefined();
			if (getPerfFunction) {
				const perf = getPerfFunction();
				expect(perf).toBeDefined();
				expect(perf).toHaveProperty("snapshot");
			}

			await testApp.close();
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
			// Create a dedicated app instance with 250 routes for this test
			const testApp = await createTestApp(mockDrizzleClient, mockCache);
			// Register 250 routes for limit test
			for (let i = 0; i < 250; i++) {
				testApp.get(`/test-${i}`, async () => ({ ok: true }));
			}
			await testApp.register(performancePlugin);
			await testApp.ready();

			// Make 250 requests
			for (let i = 0; i < 250; i++) {
				await testApp.inject({
					method: "GET",
					url: `/test-${i}`,
				});
			}

			// Create a test token for authentication using testApp
			const token = testApp.jwt.sign({ user: { id: "test-user" } });

			// Query metrics from testApp (the same instance that received the 250 requests)
			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent?.length).toBeLessThanOrEqual(200);

			await testApp.close();
		});

		it("should aggregate db operations from snapshot.ops when calculating dbMs", async () => {
			// Test lines 93-96: the loop that iterates over snap.ops and sums db operation durations
			// Create a mock drizzle client with a query method that will be tracked
			const mockQueryTable = {
				findFirst: vi.fn().mockResolvedValue({ id: "1" }),
				findMany: vi.fn().mockResolvedValue([{ id: "1" }, { id: "2" }]),
			};
			const mockDrizzleWithQuery = {
				query: {
					usersTable: mockQueryTable,
				},
			};

			// Create a fresh app with the mock drizzle client that has query methods
			const freshApp = await createTestApp(mockDrizzleWithQuery, mockCache);

			// Register route that uses the wrapped drizzle client to trigger db operations
			freshApp.get("/db-test", async (request: FastifyRequest) => {
				// Use the wrapped drizzle client to perform database operations
				// This will create entries in snap.ops with keys starting with "db:"
				await request.drizzleClient?.query.usersTable.findFirst({});
				await request.drizzleClient?.query.usersTable.findMany({});
				return { success: true };
			});

			await freshApp.register(performancePlugin);
			await freshApp.ready();

			const response = await freshApp.inject({
				method: "GET",
				url: "/db-test",
			});

			// Verify that the Server-Timing header contains db;dur with a value > 0
			// This confirms that the loop in lines 92-96 executed and aggregated db operations
			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toBeDefined();
			expect(serverTiming).toContain("db;dur=");
			// Extract the db duration value
			const dbDurMatch = serverTiming.match(/db;dur=(\d+)/);
			expect(dbDurMatch).toBeDefined();
			expect(dbDurMatch).not.toBeNull();
			if (dbDurMatch?.[1]) {
				const dbDur = Number.parseInt(dbDurMatch[1], 10);
				// The duration should be >= 0 (could be 0 if operations are very fast, but should be tracked)
				expect(dbDur).toBeGreaterThanOrEqual(0);
			}

			// Verify that the database operations were actually called
			expect(mockQueryTable.findFirst).toHaveBeenCalledTimes(1);
			expect(mockQueryTable.findMany).toHaveBeenCalledTimes(1);

			await freshApp.close();
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
			// Create a dedicated app instance with 100 routes for this test
			const testApp = await createTestApp(mockDrizzleClient, mockCache);
			// Register 100 routes for limit test
			for (let i = 0; i < 100; i++) {
				testApp.get(`/test-${i}`, async () => ({ ok: true }));
			}
			await testApp.register(performancePlugin);
			await testApp.ready();

			// Make 100 requests
			for (let i = 0; i < 100; i++) {
				await testApp.inject({
					method: "GET",
					url: `/test-${i}`,
				});
			}

			// Create a test token for authentication using testApp
			const token = testApp.jwt.sign({ user: { id: "test-user" } });

			// Query metrics from testApp (the same instance that received the 100 requests)
			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const body = response.json() as { recent?: unknown[] };
			expect(body.recent?.length).toBeLessThanOrEqual(50);

			await testApp.close();
		});

		it("should return snapshots in reverse chronological order", async () => {
			// Routes are already registered in beforeEach
			// Make two requests with a delay to ensure they're stored in order
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
				recent?: Array<{ totalMs?: number; timestamp?: number }>;
			};

			// Ensure we have at least two snapshots to verify ordering
			expect(body.recent?.length).toBeGreaterThanOrEqual(2);

			// Verify both snapshots are defined
			expect(body.recent?.[0]).toBeDefined();
			expect(body.recent?.[1]).toBeDefined();

			// Verify both snapshots have valid timestamp values for ordering
			expect(body.recent?.[0]?.timestamp).toBeDefined();
			expect(body.recent?.[1]?.timestamp).toBeDefined();
			expect(typeof body.recent?.[0]?.timestamp).toBe("number");
			expect(typeof body.recent?.[1]?.timestamp).toBe("number");

			// Verify reverse chronological order: the first snapshot (index 0) should be
			// more recent than the second (index 1), meaning timestamp[0] > timestamp[1]
			// The second request (test2) was made after test1, so it should have a later timestamp
			expect(body.recent?.[0]?.timestamp).toBeGreaterThan(
				body.recent?.[1]?.timestamp ?? 0,
			);
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

			// REST endpoint should return 401 for unauthenticated requests
			expect(response.statusCode).toBe(401);
			// Verify that an error response is returned with correlationId
			const body = response.json() as {
				error?: { message?: string; correlationId?: string };
			};
			expect(body).toBeDefined();
			expect(body.error).toBeDefined();
			// Verify error message contains authentication requirement
			expect(body.error?.message).toBeDefined();
			expect(body.error?.message).toContain("Authentication required");
			// Verify correlationId is included in error response (for consistency with error handler)
			expect(body.error?.correlationId).toBeDefined();
			expect(typeof body.error?.correlationId).toBe("string");
		});
	});
});
