import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import performancePlugin from "../../src/fastifyPlugins/performance";
import { createTestApp } from "../helpers/performanceTestUtils";

describe("Performance Plugin - Metrics Interface", () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		vi.clearAllMocks();
		delete process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT;

		app = createTestApp();

		await app.register(performancePlugin);
		await app.ready();
	});

	afterEach(async () => {
		if (app) {
			await app.close();
		}
	});

	describe("getMetricsSnapshots", () => {
		it("should expose getMetricsSnapshots on Fastify instance", () => {
			expect(app.getMetricsSnapshots).toBeDefined();
			expect(typeof app.getMetricsSnapshots).toBe("function");
		});

		it("should return empty array when no snapshots exist", () => {
			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots).toEqual([]);
		});

		it("should return all snapshots when no window specified", async () => {
			// Make requests to generate snapshots
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await app.inject({ method: "GET", url: "/metrics/perf" });

			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots).toBeDefined();
			expect(snapshots?.length).toBe(3);
		});

		it("should filter snapshots by time window", async () => {
			// Use fake timers for deterministic time control
			vi.useFakeTimers();
			const baseTime = Date.now();
			vi.setSystemTime(baseTime);

			try {
				// Make first request at base time
				await app.inject({ method: "GET", url: "/metrics/perf" });

				// Advance time by 2 minutes
				vi.setSystemTime(baseTime + 2 * 60 * 1000);

				// Make second request 2 minutes later
				await app.inject({ method: "GET", url: "/metrics/perf" });

				// Get snapshots with 1 minute window (should only include the most recent)
				const recentSnapshots = app.getMetricsSnapshots?.(1);
				expect(recentSnapshots).toBeDefined();
				expect(recentSnapshots?.length).toBe(1);

				// Get snapshots with 5 minute window (should include both)
				const allRecentSnapshots = app.getMetricsSnapshots?.(5);
				expect(allRecentSnapshots).toBeDefined();
				expect(allRecentSnapshots?.length).toBe(2);
			} finally {
				// Restore real timers
				vi.useRealTimers();
			}
		});

		it("should return snapshots with correct structure", async () => {
			await app.inject({ method: "GET", url: "/metrics/perf" });

			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots).toBeDefined();
			if (snapshots && snapshots.length > 0) {
				const snapshot = snapshots[0];
				expect(snapshot).toHaveProperty("totalMs");
				expect(snapshot).toHaveProperty("totalOps");
				expect(snapshot).toHaveProperty("cacheHits");
				expect(snapshot).toHaveProperty("cacheMisses");
				expect(snapshot).toHaveProperty("hitRate");
				expect(snapshot).toHaveProperty("ops");
				expect(snapshot).toHaveProperty("slow");
			}
		});

		it("should respect snapshot retention count from env var", async () => {
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT = "5";

			// Create a new app instance to pick up the env var
			const testApp = createTestApp();

			await testApp.register(performancePlugin);
			await testApp.ready();

			// Make more requests than the retention count
			for (let i = 0; i < 10; i++) {
				await testApp.inject({ method: "GET", url: "/metrics/perf" });
			}

			const snapshots = testApp.getMetricsSnapshots?.();
			expect(snapshots).toBeDefined();
			expect(snapshots?.length).toBeLessThanOrEqual(5);

			await testApp.close();
		});

		it("should use default retention count (1000) when env var not set", async () => {
			// Make many requests
			for (let i = 0; i < 50; i++) {
				await app.inject({ method: "GET", url: "/metrics/perf" });
			}

			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots).toBeDefined();
			// Should have all 50 snapshots (less than default 1000)
			expect(snapshots?.length).toBeGreaterThanOrEqual(50);
		});

		it("should handle multiple sequential snapshot reads safely", async () => {
			// Make some requests
			for (let i = 0; i < 10; i++) {
				await app.inject({ method: "GET", url: "/metrics/perf" });
			}

			// Read snapshots sequentially (getMetricsSnapshots is synchronous)
			const results = Array.from({ length: 10 }, () =>
				app.getMetricsSnapshots?.(),
			);

			// All reads should succeed and return arrays
			for (const result of results) {
				expect(result).toBeDefined();
				expect(Array.isArray(result)).toBe(true);
			}
		});

		it("should collect multiple performance snapshots", async () => {
			// Make multiple requests with small delays
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await new Promise((resolve) => setTimeout(resolve, 10));
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await new Promise((resolve) => setTimeout(resolve, 10));
			await app.inject({ method: "GET", url: "/metrics/perf" });

			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots).toBeDefined();
			expect(snapshots?.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe("Integration with background worker", () => {
		it("should allow background worker to access snapshots via getMetricsSnapshots", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			// Make some requests to generate snapshots
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await app.inject({ method: "GET", url: "/metrics/perf" });

			// Spy on getMetricsSnapshots to verify it's called
			const originalGetMetricsSnapshots = app.getMetricsSnapshots;
			if (!originalGetMetricsSnapshots) {
				throw new Error("getMetricsSnapshots is not available");
			}
			const getMetricsSnapshotsSpy = vi.fn(originalGetMetricsSnapshots);
			app.getMetricsSnapshots = getMetricsSnapshotsSpy;

			// Run the metrics aggregation worker
			const result = await runMetricsAggregationWorker(
				getMetricsSnapshotsSpy,
				5,
				app.log,
			);

			// Verify getMetricsSnapshots was called
			expect(getMetricsSnapshotsSpy).toHaveBeenCalled();

			// Verify the worker processed the snapshots
			expect(result).toBeDefined();
			if (result) {
				expect(result.snapshotCount).toBeGreaterThanOrEqual(0);
			}

			// Restore original function
			app.getMetricsSnapshots = originalGetMetricsSnapshots;
		});
	});

	describe("Edge cases", () => {
		it("should handle undefined windowMinutes parameter", () => {
			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots).toBeDefined();
			expect(Array.isArray(snapshots)).toBe(true);
		});

		it("should handle zero windowMinutes (returns all snapshots)", async () => {
			// Make some requests first
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await app.inject({ method: "GET", url: "/metrics/perf" });

			const snapshots = app.getMetricsSnapshots?.(0);
			expect(snapshots).toBeDefined();
			expect(Array.isArray(snapshots)).toBe(true);
			// Should return all snapshots when window is 0 or negative
			expect(snapshots?.length).toBeGreaterThanOrEqual(2);
		});

		it("should handle negative windowMinutes (returns all snapshots)", async () => {
			// Make some requests first
			await app.inject({ method: "GET", url: "/metrics/perf" });

			const snapshots = app.getMetricsSnapshots?.(-1);
			expect(snapshots).toBeDefined();
			expect(Array.isArray(snapshots)).toBe(true);
			// Should return all snapshots when window is negative
			expect(snapshots?.length).toBeGreaterThanOrEqual(1);
		});

		it("should handle very large windowMinutes", () => {
			const snapshots = app.getMetricsSnapshots?.(1000000);
			expect(snapshots).toBeDefined();
			expect(Array.isArray(snapshots)).toBe(true);
		});

		it("should enforce retention limit when exceeded", async () => {
			process.env.API_METRICS_SNAPSHOT_RETENTION_COUNT = "3";

			const testApp = createTestApp();

			await testApp.register(performancePlugin);
			await testApp.ready();

			// Make more requests than retention count
			for (let i = 0; i < 5; i++) {
				await testApp.inject({ method: "GET", url: "/metrics/perf" });
			}

			const snapshots = testApp.getMetricsSnapshots?.();
			expect(snapshots).toBeDefined();
			// Should be capped at retention count
			expect(snapshots?.length).toBeLessThanOrEqual(3);

			await testApp.close();
		});
	});
});
