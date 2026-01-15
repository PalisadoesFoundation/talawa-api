import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import Fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import type { EnvConfig } from "../../src/envConfigSchema";
import backgroundWorkersPlugin from "../../src/fastifyPlugins/backgroundWorkers";
import performancePlugin from "../../src/fastifyPlugins/performance";
import type { CacheService } from "../../src/services/caching/CacheService";

// Mock background worker service
vi.mock("~/src/workers", () => ({
	startBackgroundWorkers: vi.fn(),
	stopBackgroundWorkers: vi.fn(),
}));

/**
 * Mock CacheService for testing.
 */
class MockCacheService implements CacheService {
	store = new Map<string, unknown>();

	async get<T>(key: string): Promise<T | null> {
		return (this.store.get(key) as T) ?? null;
	}

	async set<T>(key: string, value: T, _ttlSeconds: number): Promise<void> {
		this.store.set(key, value);
	}

	async del(_keys: string | string[]): Promise<void> {
		// No-op for tests
	}

	async clearByPattern(_pattern: string): Promise<void> {
		// No-op for tests
	}

	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		return keys.map((k) => (this.store.get(k) as T) ?? null);
	}

	async mset<T>(
		entries: Array<{ key: string; value: T; ttlSeconds: number }>,
	): Promise<void> {
		for (const entry of entries) {
			await this.set(entry.key, entry.value, entry.ttlSeconds);
		}
	}
}

// Create a mock drizzleClient plugin to satisfy the dependency
const mockDrizzleClientPlugin = fp(
	async (app) => {
		app.decorate(
			"drizzleClient",
			{} as unknown as NodePgDatabase<typeof schema>,
		);
	},
	{ name: "drizzleClient" },
);

/**
 * Creates a properly configured Fastify test app with required decorators.
 * Includes envConfig and cache decorators that performancePlugin depends on.
 */
function createTestApp(): FastifyInstance {
	const app = Fastify({
		logger: {
			level: "silent",
		},
	});

	// Add required decorators for performancePlugin
	const envConfig: Partial<EnvConfig> = {};
	app.decorate("envConfig", envConfig as EnvConfig);
	app.decorate("cache", new MockCacheService());

	return app;
}

describe("Background Workers Plugin - Metrics Integration", () => {
	let app: ReturnType<typeof Fastify>;

	beforeEach(async () => {
		vi.clearAllMocks();

		app = createTestApp();

		// Register drizzle client mock as a named plugin (required dependency)
		await app.register(mockDrizzleClientPlugin);

		// Register performance plugin (required dependency)
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

			// Register all plugins first, then make requests
			await app.register(backgroundWorkersPlugin);
			await app.ready();

			// Make a request to generate a snapshot after plugins are registered
			await app.inject({ method: "GET", url: "/metrics/perf" });

			const callArgs = vi.mocked(startBackgroundWorkers).mock.calls[0];
			expect(callArgs).toBeDefined();
			expect(callArgs?.[2]).toBeDefined();
			expect(typeof callArgs?.[2]).toBe("function");

			// Verify the function works
			const snapshotGetter = callArgs?.[2];
			expect(snapshotGetter).toBeDefined();
			const snapshots = snapshotGetter?.(5);
			expect(Array.isArray(snapshots)).toBe(true);
		});

		it("should reject registration when performance plugin dependency is not registered", async () => {
			// Create app without performance plugin
			const testApp = createTestApp();

			// Register drizzleClient as a proper named plugin
			await testApp.register(mockDrizzleClientPlugin);

			// Register background workers without performance plugin
			// This should throw because performance is a required dependency
			await expect(testApp.register(backgroundWorkersPlugin)).rejects.toThrow();

			await testApp.close();
		});

		it("should throw error when getMetricsSnapshots is not provided by performance plugin", async () => {
			// Create app with a fake "performance" plugin that doesn't provide getMetricsSnapshots
			const testApp = createTestApp();

			// Register drizzleClient as a proper named plugin
			await testApp.register(mockDrizzleClientPlugin);

			// Create a mock performance plugin that satisfies dependency but doesn't provide getMetricsSnapshots
			const brokenPerformancePlugin = fp(
				async () => {
					// Don't decorate the app with getMetricsSnapshots
				},
				{ name: "performance" },
			);

			await testApp.register(brokenPerformancePlugin);

			// Register background workers - should throw due to runtime guard
			await expect(testApp.register(backgroundWorkersPlugin)).rejects.toThrow(
				"Required dependency 'getMetricsSnapshots' from performance plugin is not available",
			);

			await testApp.close();
		});

		it("should register shutdown hook to stop workers", async () => {
			const { stopBackgroundWorkers } = await import("~/src/workers");

			await app.register(backgroundWorkersPlugin);
			await app.ready();

			// Capture logger reference before closing the app
			const logger = app.log;

			await app.close();

			expect(stopBackgroundWorkers).toHaveBeenCalledWith(logger);
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

			// Register all plugins first
			await app.register(backgroundWorkersPlugin);
			await app.ready();

			// Make requests to generate snapshots after plugins are registered
			await app.inject({ method: "GET", url: "/metrics/perf" });
			await app.inject({ method: "GET", url: "/metrics/perf" });

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

			// Register all plugins first
			await app.register(backgroundWorkersPlugin);
			await app.ready();

			// Make request after plugins are registered
			await app.inject({ method: "GET", url: "/metrics/perf" });

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
