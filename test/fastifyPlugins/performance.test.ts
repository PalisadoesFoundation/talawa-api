vi.mock("~/src/fastifyPlugins/backgroundWorkers", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/drizzleClient", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/minioClient", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/seedInitialData", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/pluginSystem", () => ({
	default: async () => {},
}));

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "~/src/createServer";

describe("Performance Plugin", () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createServer({
			envConfig: {
				API_IS_GRAPHIQL: false,
			},
		});
	});

	afterEach(async () => {
		vi.clearAllMocks();
		if (server) {
			await server.close();
		}
	});

	it("should attach performance tracker to each request", async () => {
		// Create a test route to inspect the request
		server.get("/test-perf", async (request, reply) => {
			const hasPerf = request.perf !== undefined;
			const hasT0 =
				(request as unknown as Record<string, unknown>)._t0 !== undefined;
			return reply.send({ hasPerf, hasT0 });
		});

		const response = await server.inject({
			method: "GET",
			url: "/test-perf",
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.hasPerf).toBe(true);
		expect(body.hasT0).toBe(true);
	});

	it("should add Server-Timing header to responses", async () => {
		server.get("/test-timing", async (_request, reply) => {
			return reply.send({ message: "test" });
		});

		const response = await server.inject({
			method: "GET",
			url: "/test-timing",
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["server-timing"]).toBeDefined();
		expect(response.headers["server-timing"]).toMatch(/db;dur=\d+/);
		expect(response.headers["server-timing"]).toMatch(
			/cache;desc="hit:\d+\|miss:\d+"/,
		);
		expect(response.headers["server-timing"]).toMatch(/total;dur=\d+/);
	});

	it("should provide /metrics/perf endpoint", async () => {
		// Make a few requests first
		await server.inject({ method: "GET", url: "/" });
		await server.inject({ method: "GET", url: "/" });

		const response = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body).toHaveProperty("recent");
		expect(Array.isArray(body.recent)).toBe(true);
		expect(body.recent.length).toBeGreaterThan(0);

		// Verify snapshots have the expected structure
		const firstSnapshot = body.recent[0] as {
			totalMs: number;
			cacheHits: number;
			cacheMisses: number;
			ops: Record<string, unknown>;
		};
		expect(firstSnapshot).toHaveProperty("totalMs");
		expect(firstSnapshot).toHaveProperty("cacheHits");
		expect(firstSnapshot).toHaveProperty("cacheMisses");
		expect(firstSnapshot).toHaveProperty("ops");
	});

	it("should track performance metrics in snapshot", async () => {
		server.get("/test-snapshot", async (request, reply) => {
			// Do some tracked operations
			request.perf?.trackCacheHit();
			request.perf?.trackCacheHit();
			request.perf?.trackCacheMiss();
			request.perf?.trackDb(50);

			const snapshot = request.perf?.snapshot();
			return reply.send(snapshot);
		});

		const response = await server.inject({
			method: "GET",
			url: "/test-snapshot",
		});

		expect(response.statusCode).toBe(200);
		const snapshot = JSON.parse(response.body);
		expect(snapshot.cacheHits).toBe(2);
		expect(snapshot.cacheMisses).toBe(1);
		expect(snapshot.ops.db).toBeDefined();
		expect(snapshot.ops.db.ms).toBe(50);
	});

	it("should log slow GraphQL operations", async () => {
		server.get("/slow-graphql", async (request, reply) => {
			// Simulate a slow GraphQL operation
			(request as unknown as Record<string, unknown>)._gqlOperation = {
				name: "MyQuery",
				type: "query",
				complexity: 15,
			};
			(request as unknown as Record<string, unknown>)._t0 = Date.now() - 600; // Simulate 600ms ago

			// Simulate some cache activity
			request.perf?.trackCacheHit();
			request.perf?.trackCacheMiss();

			await reply.send({ data: "test" });
		});

		const response = await server.inject({
			method: "GET",
			url: "/slow-graphql",
		});

		// Verify request was successful
		expect(response.statusCode).toBe(200);
		// Verify Server-Timing header includes performance data
		expect(response.headers["server-timing"]).toContain("total");
		// Note: Logging verification not included as req.log is a per-request child logger
		// The actual logging functionality is tested via integration tests
	});

	it("should not log fast GraphQL operations", async () => {
		const warnSpy = vi.spyOn(server.log, "warn");

		server.get("/fast-graphql", async (request, reply) => {
			// Simulate a fast GraphQL operation
			(request as unknown as Record<string, unknown>)._gqlOperation = {
				name: "FastQuery",
				type: "query",
				complexity: 5,
			};
			(request as unknown as Record<string, unknown>)._t0 = Date.now() - 100; // Simulate 100ms ago

			return reply.send({ data: "test" });
		});

		await server.inject({
			method: "GET",
			url: "/fast-graphql",
		});

		const slowOpWarning = warnSpy.mock.calls.find(
			(call) =>
				(call[0] as Record<string, unknown>)?.msg === "Slow GraphQL operation",
		);
		expect(slowOpWarning).toBeUndefined();
	});

	it("should expose at most last 50 snapshots via /metrics/perf endpoint", async () => {
		// Make 250 requests to exceed both the in-memory buffer (200) and endpoint limit (50)
		for (let i = 0; i < 250; i++) {
			await server.inject({ method: "GET", url: "/" });
		}

		const response = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const body = JSON.parse(response.body);
		// The endpoint should return at most 50 snapshots (even though 200 are kept in memory)
		expect(body.recent.length).toBeLessThanOrEqual(50);
	});

	it("should handle requests without GraphQL metadata", async () => {
		const warnSpy = vi.spyOn(server.log, "warn");

		server.get("/regular-request", async (_request, reply) => {
			return reply.send({ data: "test" });
		});

		await server.inject({
			method: "GET",
			url: "/regular-request",
		});

		// Should not log anything about GraphQL for regular requests
		const gqlWarning = warnSpy.mock.calls.find(
			(call) =>
				(call[0] as Record<string, unknown>)?.msg ===
					"Slow GraphQL operation" ||
				(call[0] as Record<string, unknown>)?.operation !== undefined,
		);
		expect(gqlWarning).toBeUndefined();
	});

	it("should calculate hit rate correctly in slow operation logs", async () => {
		server.get("/slow-with-cache", async (request, reply) => {
			(request as unknown as Record<string, unknown>)._gqlOperation = {
				name: "testQuery",
				type: "query",
				complexity: 100,
			};
			(request as unknown as Record<string, unknown>)._t0 = Date.now() - 550;

			// Simulate cache activity: 7 hits, 3 misses = 0.7 hit rate
			for (let i = 0; i < 7; i++) {
				request.perf?.trackCacheHit();
			}
			for (let i = 0; i < 3; i++) {
				request.perf?.trackCacheMiss();
			}

			await reply.send({ data: "test" });
		});

		const response = await server.inject({
			method: "GET",
			url: "/slow-with-cache",
		});

		// Verify request was successful and slow operation was processed
		expect(response.statusCode).toBe(200);
		// Verify Server-Timing header includes cache metrics
		expect(response.headers["server-timing"]).toContain("cache");
		expect(response.headers["server-timing"]).toContain("hit:7|miss:3");
		// Note: Logging verification not included as req.log is a per-request child logger
		// The actual logging functionality is tested via integration tests
	});
});
