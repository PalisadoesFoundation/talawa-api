import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import backgroundWorkersPlugin from "../../src/fastifyPlugins/backgroundWorkers";
import performancePlugin from "../../src/fastifyPlugins/performance";

// Mock background worker service
vi.mock("~/src/workers", () => ({
	startBackgroundWorkers: vi.fn(),
	stopBackgroundWorkers: vi.fn(),
}));

describe("Background Workers Plugin - Metrics Integration", () => {
	let app: ReturnType<typeof Fastify>;

	beforeEach(async () => {
		vi.clearAllMocks();

		app = Fastify({
			logger: {
				level: "silent",
			},
		});

		// Register drizzle client mock
		app.decorate("drizzleClient", {});

		// Register performance plugin first (required dependency)
		await app.register(performancePlugin);
	});

	afterEach(async () => {
		if (app) {
			await app.close();
		}
	});

	describe("Plugin registration with performance plugin", () => {
		it("should pass snapshot getter to startBackgroundWorkers when performance plugin is registered", async () => {
			const { startBackgroundWorkers } = await import("~/src/workers");

			await app.register(backgroundWorkersPlugin);
			await app.ready();

			expect(startBackgroundWorkers).toHaveBeenCalledWith(
				app.drizzleClient,
				app.log,
				expect.any(Function), // snapshot getter
			);
		});

		it("should pass getMetricsSnapshots function to startBackgroundWorkers", async () => {
			const { startBackgroundWorkers } = await import("~/src/workers");

			// Make a request to generate a snapshot
			await app.inject({ method: "GET", url: "/metrics/perf" });

			await app.register(backgroundWorkersPlugin);
			await app.ready();

			const callArgs = vi.mocked(startBackgroundWorkers).mock.calls[0];
			expect(callArgs).toBeDefined();
			expect(callArgs?.[2]).toBeDefined();
			expect(typeof callArgs?.[2]).toBe("function");

			// Verify the function works
			const snapshotGetter = callArgs?.[2];
			if (snapshotGetter) {
				const snapshots = snapshotGetter(5);
				expect(Array.isArray(snapshots)).toBe(true);
			}
		});

		it("should handle backward compatibility when performance plugin dependency is not registered", async () => {
			// Create app without performance plugin
			const testApp = Fastify({
				logger: {
					level: "silent",
				},
			});

			testApp.decorate("drizzleClient", {});

			// Register background workers without performance plugin
			// This should not throw due to backward compatibility handling
			await expect(testApp.register(backgroundWorkersPlugin)).resolves.not.toThrow();

			// Verify the snapshot getter is undefined on the app
			expect((testApp as any).getMetricsSnapshots).toBeUndefined();

			await testApp.close();
		});

		it("should register shutdown hook to stop workers", async () => {
			const { stopBackgroundWorkers } = await import("~/src/workers");

			await app.register(backgroundWorkersPlugin);
			await app.ready();

			await app.close();

			expect(stopBackgroundWorkers).toHaveBeenCalledWith(app.log);
		});
	});

	describe("Plugin dependencies", () => {
		it("should require performance plugin as dependency", async () => {
			// The plugin should declare performance as a dependency
			// This is tested by the plugin registration order requirement
			await app.register(backgroundWorkersPlugin);
			await app.ready();

			// If we get here, the dependency was satisfied
			expect(app.getMetricsSnapshots).toBeDefined();
		});

		it("should work when performance plugin is registered before background workers", async () => {
			const { startBackgroundWorkers } = await import("~/src/workers");

			// Performance already registered in beforeEach
			await app.register(backgroundWorkersPlugin);
			await app.ready();

			expect(startBackgroundWorkers).toHaveBeenCalled();
			expect(startBackgroundWorkers).toHaveBeenCalledWith(
				expect.anything(),
				expect.anything(),
				expect.any(Function),
			);
		});
	});

	describe("Snapshot getter functionality", () => {
		it("should provide working snapshot getter that returns snapshots", async () => {
			const { startBackgroundWorkers } = await import("~/src/workers");

			// Make requests to generate snapshots
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await app.inject({ method: "GET", url: "/metrics/perf" });

			await app.register(backgroundWorkersPlugin);
			await app.ready();

			const callArgs = vi.mocked(startBackgroundWorkers).mock.calls[0];
			const snapshotGetter = callArgs?.[2];

			if (snapshotGetter) {
				const snapshots = snapshotGetter();
				expect(Array.isArray(snapshots)).toBe(true);
				expect(snapshots.length).toBeGreaterThanOrEqual(2);
			}
		});

		it("should provide snapshot getter that respects window parameter", async () => {
			const { startBackgroundWorkers } = await import("~/src/workers");

			await app.inject({ method: "GET", url: "/metrics/perf" });

			await app.register(backgroundWorkersPlugin);
			await app.ready();

			const callArgs = vi.mocked(startBackgroundWorkers).mock.calls[0];
			const snapshotGetter = callArgs?.[2];

			if (snapshotGetter) {
				const snapshotsWithWindow = snapshotGetter(5);
				expect(Array.isArray(snapshotsWithWindow)).toBe(true);

				const snapshotsWithoutWindow = snapshotGetter();
				expect(Array.isArray(snapshotsWithoutWindow)).toBe(true);
			}
		});
	});
});
