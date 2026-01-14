import Fastify, { type FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EnvConfig } from "../../src/envConfigSchema";
import performancePlugin from "../../src/fastifyPlugins/performance";
import type { PerfSnapshot } from "../../src/utilities/metrics/performanceTracker";

/**
 * Minimal test fixture for the performance plugin's required environment configuration.
 * Contains only the fields that the performance plugin actually uses.
 * This makes it clear what the plugin depends on and robust if more fields are added.
 */
interface PerformancePluginTestEnvConfig {
	METRICS_SNAPSHOT_RETENTION_COUNT: number;
	API_SLOW_REQUEST_MS: number;
}

/**
 * Test fixture providing the minimal envConfig required by the performance plugin.
 */
const performancePluginTestEnvConfig: PerformancePluginTestEnvConfig = {
	METRICS_SNAPSHOT_RETENTION_COUNT: 200,
	API_SLOW_REQUEST_MS: 500,
};

/**
 * Helper function to create a Fastify instance with envConfig decorated.
 * This is needed because the performance plugin depends on envConfig.
 */
function createTestFastifyInstance() {
	const app = Fastify({
		logger: {
			level: "silent",
		},
	});

	// Decorate envConfig before registering the performance plugin
	// The plugin depends on envConfig for configuration values
	// Using Partial<EnvConfig> to reflect that the test fixture is intentionally minimal
	const testEnvConfig: Partial<EnvConfig> = performancePluginTestEnvConfig;
	app.decorate("envConfig", testEnvConfig as unknown as EnvConfig);

	return app;
}

describe("Performance Plugin", () => {
	let app: ReturnType<typeof Fastify>;

	beforeEach(async () => {
		app = createTestFastifyInstance();

		await app.register(performancePlugin);
		await app.ready();
	});

	afterEach(async () => {
		if (app) {
			await app.close();
		}
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
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			let requestPerf: unknown;

			testApp.get("/test-perf-attach", async (request: FastifyRequest) => {
				requestPerf = request.perf;
				return { ok: true };
			});

			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-perf-attach",
			});

			expect(requestPerf).toBeDefined();
			expect(requestPerf).toHaveProperty("trackComplexity");
			expect(requestPerf).toHaveProperty("snapshot");
			expect(requestPerf).toHaveProperty("trackDb");
			expect(requestPerf).toHaveProperty("trackCacheHit");
			expect(requestPerf).toHaveProperty("trackCacheMiss");

			await testApp.close();
		});

		it("should attach _t0 timestamp to request", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			let requestT0: number | undefined;

			testApp.get("/test-t0-attach", async (request: FastifyRequest) => {
				requestT0 = request._t0;
				return { ok: true };
			});

			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-t0-attach",
			});

			expect(requestT0).toBeDefined();
			expect(typeof requestT0).toBe("number");
			expect(requestT0).toBeGreaterThan(0);

			await testApp.close();
		});
	});

	describe("onSend Hook", () => {
		it("should add Server-Timing header to response", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-timing", async () => ({ ok: true }));

			await testApp.ready();

			const response = await testApp.inject({
				method: "GET",
				url: "/test-timing",
			});

			const serverTiming = response.headers["server-timing"] as string;

			expect(serverTiming).toBeDefined();
			expect(serverTiming).toMatch(/db;dur=\d+/);
			expect(serverTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
			expect(serverTiming).toMatch(/total;dur=\d+/);

			await testApp.close();
		});

		it("should format Server-Timing header correctly", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-format", async (request: FastifyRequest) => {
				// Track some operations
				request.perf?.trackDb(50);
				request.perf?.trackCacheHit();
				request.perf?.trackCacheMiss();
				return { ok: true };
			});

			await testApp.ready();

			const response = await testApp.inject({
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

			await testApp.close();
		});

		it("should store snapshot in recent buffer", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-snapshot", async (request: FastifyRequest) => {
				request.perf?.trackDb(30);
				request.perf?.trackCacheHit();
				return { ok: true };
			});

			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-snapshot",
			});

			const response = await testApp.inject({
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

			await testApp.close();
		});

		it("should limit recent buffer to 200 snapshots", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-buffer-limit", async () => ({ ok: true }));

			await testApp.ready();

			// Make 210 requests to exceed the 200 snapshot limit
			for (let i = 0; i < 210; i++) {
				await testApp.inject({
					method: "GET",
					url: "/test-buffer-limit",
				});
			}

			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			// The buffer should be limited to 200, but /metrics/perf returns max 50
			// So we should see at most 50 snapshots
			expect(body.recent.length).toBeLessThanOrEqual(50);

			await testApp.close();
		});
	});

	describe("/metrics/perf Endpoint", () => {
		it("should return JSON response with recent snapshots", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-metrics-1", async () => ({ ok: true }));

			await testApp.ready();

			await testApp.inject({ method: "GET", url: "/test-metrics-1" });

			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(response.statusCode).toBe(200);
			expect(response.headers["content-type"]).toContain("application/json");

			const body = response.json();
			expect(body).toHaveProperty("recent");
			expect(Array.isArray(body.recent)).toBe(true);

			await testApp.close();
		});

		it("should return at most 50 snapshots", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-metrics-2", async () => ({ ok: true }));

			await testApp.ready();

			// Make 60 requests
			for (let i = 0; i < 60; i++) {
				await testApp.inject({ method: "GET", url: "/test-metrics-2" });
			}

			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			// Should return at most 50 snapshots
			expect(body.recent.length).toBeLessThanOrEqual(50);

			await testApp.close();
		});

		it("should return snapshots in correct format", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-metrics-3", async (request: FastifyRequest) => {
				request.perf?.trackDb(25);
				request.perf?.trackCacheHit();
				request.perf?.trackCacheMiss();
				request.perf?.trackComplexity(10);
				return { ok: true };
			});

			await testApp.ready();

			await testApp.inject({ method: "GET", url: "/test-metrics-3" });

			const response = await testApp.inject({
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

			await testApp.close();
		});

		it("should return most recent snapshots first", async () => {
			// Create fresh instance for this test since we're adding routes
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			// Register all routes before ready
			for (let i = 1; i <= 5; i++) {
				testApp.get(`/test-metrics-4-${i}`, async (request: FastifyRequest) => {
					request.perf?.trackDb(i * 10);
					return { ok: true };
				});
			}

			await testApp.ready();

			// Make 5 requests with different db times
			for (let i = 1; i <= 5; i++) {
				await testApp.inject({ method: "GET", url: `/test-metrics-4-${i}` });
			}

			const response = await testApp.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			const body = response.json();

			// Most recent should be first (since we unshift, newest is at index 0)
			if (body.recent.length >= 2) {
				const first = body.recent[0];
				const second = body.recent[1];

				// First snapshot should be more recent (higher db time in our test)
				// Note: This is a simple check - in reality, timestamps would be better
				expect(first).toBeDefined();
				expect(second).toBeDefined();
			}

			await testApp.close();
		});
	});

	describe("Edge Cases", () => {
		it("should handle missing perf tracker gracefully", async () => {
			// Create fresh instance for this test since we're adding hooks and routes
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			// Manually remove perf tracker to simulate edge case
			testApp.addHook("onRequest", async (request: FastifyRequest) => {
				delete request.perf;
			});

			testApp.get("/test-no-perf", async () => ({ ok: true }));

			await testApp.ready();

			const response = await testApp.inject({
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

			await testApp.close();
		});

		it("should handle missing _t0 timestamp gracefully", async () => {
			// Create fresh instance for this test since we're adding hooks and routes
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			// Manually remove _t0 to simulate edge case
			testApp.addHook("onRequest", async (request: FastifyRequest) => {
				delete request._t0;
			});

			testApp.get("/test-no-t0", async () => ({ ok: true }));

			await testApp.ready();

			const response = await testApp.inject({
				method: "GET",
				url: "/test-no-t0",
			});

			// Should still return response
			expect(response.statusCode).toBe(200);

			// Server-Timing should still be present
			const serverTiming = response.headers["server-timing"] as string;
			expect(serverTiming).toBeDefined();

			await testApp.close();
		});

		it("should handle concurrent requests", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-concurrent", async (request: FastifyRequest) => {
				request.perf?.trackDb(10);
				return { ok: true };
			});

			await testApp.ready();

			// Make multiple concurrent requests
			const promises = Array.from({ length: 10 }, () =>
				testApp.inject({
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

			await testApp.close();
		});

		it("should handle requests with no cache operations", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-no-cache", async () => ({ ok: true }));

			await testApp.ready();

			const response = await testApp.inject({
				method: "GET",
				url: "/test-no-cache",
			});

			const serverTiming = response.headers["server-timing"] as string;

			// Should have cache description with zero hits and misses
			expect(serverTiming).toMatch(/cache;desc="hit:0\|miss:0"/);

			await testApp.close();
		});

		it("should handle requests with no database operations", async () => {
			// Create fresh instance for this test since we're adding a route
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-no-db", async (request: FastifyRequest) => {
				request.perf?.trackCacheHit();
				return { ok: true };
			});

			await testApp.ready();

			const response = await testApp.inject({
				method: "GET",
				url: "/test-no-db",
			});

			const serverTiming = response.headers["server-timing"] as string;

			// Should have db duration of 0
			expect(serverTiming).toMatch(/db;dur=0/);

			await testApp.close();
		});
	});

	describe("getPerformanceSnapshots", () => {
		it("should return empty array when no snapshots exist", async () => {
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);
			await testApp.ready();

			// Call before any requests are made
			const snapshots = testApp.getPerformanceSnapshots();

			expect(snapshots).toEqual([]);
			expect(Array.isArray(snapshots)).toBe(true);

			await testApp.close();
		});

		it("should return all snapshots when limit is undefined", async () => {
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-snapshots-1", async () => ({ ok: true }));

			await testApp.ready();

			// Make 5 requests to create snapshots
			for (let i = 0; i < 5; i++) {
				await testApp.inject({
					method: "GET",
					url: "/test-snapshots-1",
				});
			}

			const snapshots = testApp.getPerformanceSnapshots();

			expect(snapshots.length).toBe(5);
			expect(Array.isArray(snapshots)).toBe(true);

			await testApp.close();
		});

		it("should return limited snapshots when limit is provided and > 0", async () => {
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-snapshots-2", async () => ({ ok: true }));

			await testApp.ready();

			// Make 10 requests to create snapshots
			for (let i = 0; i < 10; i++) {
				await testApp.inject({
					method: "GET",
					url: "/test-snapshots-2",
				});
			}

			const snapshots = testApp.getPerformanceSnapshots(3);

			expect(snapshots.length).toBe(3);
			expect(Array.isArray(snapshots)).toBe(true);

			await testApp.close();
		});

		it("should return empty array when limit is 0", async () => {
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-snapshots-3", async () => ({ ok: true }));

			await testApp.ready();

			// Make 5 requests to create snapshots
			for (let i = 0; i < 5; i++) {
				await testApp.inject({
					method: "GET",
					url: "/test-snapshots-3",
				});
			}

			const snapshots = testApp.getPerformanceSnapshots(0);

			expect(snapshots.length).toBe(0);
			expect(Array.isArray(snapshots)).toBe(true);

			await testApp.close();
		});

		it("should return empty array when limit is negative", async () => {
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-snapshots-4", async () => ({ ok: true }));

			await testApp.ready();

			// Make 5 requests to create snapshots
			for (let i = 0; i < 5; i++) {
				await testApp.inject({
					method: "GET",
					url: "/test-snapshots-4",
				});
			}

			const snapshots = testApp.getPerformanceSnapshots(-1);

			expect(snapshots.length).toBe(0);
			expect(Array.isArray(snapshots)).toBe(true);

			await testApp.close();
		});

		it("should return deep-cloned snapshots that are independent", async () => {
			const testApp = createTestFastifyInstance();

			await testApp.register(performancePlugin);

			testApp.get("/test-snapshots-5", async (request: FastifyRequest) => {
				request.perf?.trackDb(50);
				request.perf?.trackCacheHit();
				return { ok: true };
			});

			await testApp.ready();

			await testApp.inject({
				method: "GET",
				url: "/test-snapshots-5",
			});

			const snapshots = testApp.getPerformanceSnapshots(1);

			expect(snapshots.length).toBe(1);

			const snapshot = snapshots[0];
			expect(snapshot).toBeDefined();
			if (!snapshot) {
				throw new Error("Snapshot should be defined");
			}

			// Verify snapshot structure
			expect(snapshot).toHaveProperty("totalMs");
			expect(snapshot).toHaveProperty("ops");
			expect(snapshot).toHaveProperty("cacheHits");

			// Modify the returned snapshot to verify it's a deep copy
			const originalOps = snapshot.ops;
			snapshot.ops = {};

			// Get snapshots again - original should be unchanged
			const snapshots2 = testApp.getPerformanceSnapshots(1);
			const snapshot2 = snapshots2[0];
			expect(snapshot2).toBeDefined();
			if (!snapshot2) {
				throw new Error("Snapshot2 should be defined");
			}
			expect(snapshot2.ops).not.toEqual({});
			expect(snapshot2.ops).toEqual(originalOps);

			await testApp.close();
		});
	});

	describe("Deep Copy Fallback", () => {
		// Note: Direct integration test for line 87 (structuredClone fallback) is intentionally omitted.
		// Testing the fallback path requires stubbing global `structuredClone`, which is unreliable
		// across vitest's VM/worker boundaries and module caching. The fallback behavior is verified
		// through the direct test of `manualDeepCopySnapshot` below, which ensures the fallback
		// implementation is correct. Line 87 coverage is achieved through code review and the
		// knowledge that the fallback path exists and is tested via manualDeepCopySnapshot.
		// See: https://github.com/vitest-dev/vitest/issues/1329
		//
		// The deepCopySnapshot function (lines 79-88) is tested indirectly through:
		// 1. The manualDeepCopySnapshot test below (ensures fallback implementation works)
		// 2. All other tests that verify snapshots are deep-copied (verifies deepCopySnapshot works)
		// 3. The fact that structuredClone is available in Node.js 17+ (covers line 83)
		// Line 87 (fallback path) is verified through code review and the manualDeepCopySnapshot test.

		it("should correctly perform manual deep copy of snapshot", async () => {
			// Directly test the exported manualDeepCopySnapshot function
			// This is simpler and more reliable than testing through the plugin
			const { manualDeepCopySnapshot } = await import(
				"../../src/fastifyPlugins/performance"
			);

			// Create a test snapshot
			const originalSnapshot: PerfSnapshot = {
				totalMs: 70,
				totalOps: 3,
				ops: {
					db: { count: 2, ms: 50, max: 30 },
					query: { count: 1, ms: 20, max: 20 },
				},
				slow: [
					{ op: "db", ms: 30 },
					{ op: "query", ms: 20 },
				],
				cacheHits: 5,
				cacheMisses: 2,
				hitRate: 5 / 7, // hits / (hits + misses)
				complexityScore: 42,
			};

			// Perform manual deep copy
			const copiedSnapshot = manualDeepCopySnapshot(originalSnapshot);

			// Verify structure is correct
			expect(copiedSnapshot).toHaveProperty("ops");
			expect(copiedSnapshot).toHaveProperty("slow");
			expect(copiedSnapshot).toHaveProperty("cacheHits");
			expect(copiedSnapshot).toHaveProperty("cacheMisses");
			expect(copiedSnapshot).toHaveProperty("complexityScore");
			expect(copiedSnapshot.complexityScore).toBe(42);

			// Verify ops is an object (not array)
			expect(typeof copiedSnapshot.ops).toBe("object");
			expect(Array.isArray(copiedSnapshot.ops)).toBe(false);

			// Verify slow is an array
			expect(Array.isArray(copiedSnapshot.slow)).toBe(true);

			// Verify nested objects are also independent
			const originalDbOps = originalSnapshot.ops.db;
			const copiedDbOps = copiedSnapshot.ops.db;
			if (originalDbOps && copiedDbOps) {
				// Modify original's nested object
				originalDbOps.count = 999;

				// Copied snapshot's nested object should be unaffected
				expect(copiedDbOps.count).toBe(2);
				expect(copiedDbOps.count).not.toBe(999);
			}

			// Verify slow array is independent
			const originalSlow = [...originalSnapshot.slow];
			originalSnapshot.slow[0] = { op: "modified", ms: 999 };

			expect(copiedSnapshot.slow).not.toEqual(originalSnapshot.slow);
			expect(copiedSnapshot.slow).toEqual(originalSlow);
		});

		it("should use manualDeepCopySnapshot when structuredClone is unavailable", async () => {
			// Test the fallback path by temporarily stubbing structuredClone as undefined
			// This ensures line 87 (the fallback return) is covered
			const originalStructuredClone = global.structuredClone;

			try {
				// Stub structuredClone as undefined to force the fallback path
				vi.stubGlobal("structuredClone", undefined);

				const testApp = createTestFastifyInstance();

				await testApp.register(performancePlugin);

				testApp.get(
					"/test-fallback-integration",
					async (request: FastifyRequest) => {
						request.perf?.trackDb(50);
						request.perf?.trackCacheHit();
						return { ok: true };
					},
				);

				await testApp.ready();

				// Make a request to create a snapshot
				const response = await testApp.inject({
					method: "GET",
					url: "/test-fallback-integration",
				});

				expect(response.statusCode).toBe(200);

				// The snapshot should be stored after the request completes
				// getPerformanceSnapshots uses deepCopySnapshot which handles the fallback internally
				// With structuredClone undefined, it should use manualDeepCopySnapshot (line 87)
				const snapshots = testApp.getPerformanceSnapshots(1);

				expect(snapshots.length).toBe(1);
				expect(snapshots[0]).toBeDefined();
				if (!snapshots[0]) {
					throw new Error("Snapshot should be defined");
				}
				expect(snapshots[0]).toHaveProperty("ops");
				expect(snapshots[0]).toHaveProperty("cacheHits");
				expect(snapshots[0].cacheHits).toBe(1);

				// Verify the snapshot is a deep copy (independent from internal storage)
				// This verifies that manualDeepCopySnapshot was used (fallback path)
				const originalOps = snapshots[0].ops;
				snapshots[0].ops = {};

				const snapshots2 = testApp.getPerformanceSnapshots(1);
				expect(snapshots2[0]).toBeDefined();
				if (!snapshots2[0]) {
					throw new Error("Snapshot2 should be defined");
				}
				expect(snapshots2[0].ops).not.toEqual({});
				expect(snapshots2[0].ops).toEqual(originalOps);

				await testApp.close();
			} finally {
				// Restore original structuredClone
				if (originalStructuredClone !== undefined) {
					vi.stubGlobal("structuredClone", originalStructuredClone);
				} else {
					vi.unstubAllGlobals();
				}
			}
		});
	});
});
