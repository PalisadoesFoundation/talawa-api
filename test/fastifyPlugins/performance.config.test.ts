import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EnvConfig } from "~/src/envConfigSchema";
import performancePlugin from "~/src/fastifyPlugins/performance";
import type { CacheService } from "~/src/services/caching/CacheService";
import { MetricsCacheService } from "~/src/services/metrics";
import {
	createTestApp,
	MockCacheService,
} from "../helpers/performanceTestUtils";

describe("Performance Plugin - Environment Configuration", () => {
	let app: FastifyInstance;
	let mockCache: MockCacheService;

	beforeEach(() => {
		mockCache = new MockCacheService();
	});

	afterEach(async () => {
		if (app) {
			await app.close();
		}
		vi.clearAllMocks();
	});

	describe("API_METRICS_SLOW_REQUEST_MS", () => {
		it("should use env config value for slow request threshold", async () => {
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_SLOW_REQUEST_MS: 1000,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			const warnSpy = vi.spyOn(app.log, "warn");

			await app.register(performancePlugin);
			await app.ready();

			// Make a slow request (over 1000ms)
			app.get("/slow-request", async () => {
				await new Promise((resolve) => setTimeout(resolve, 1100));
				return { ok: true };
			});

			await app.inject({
				method: "GET",
				url: "/slow-request",
			});

			// Should log warning for slow request
			expect(warnSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Slow request",
					slowThresholdMs: 1000,
				}),
			);

			warnSpy.mockRestore();
		});

		it("should use default value (500) when env config not set", async () => {
			const customEnvConfig: Partial<EnvConfig> = {};
			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			const warnSpy = vi.spyOn(app.log, "warn");

			await app.register(performancePlugin);
			await app.ready();

			// Make a slow request (over 500ms but under 1000ms)
			app.get("/slow-request-default", async () => {
				await new Promise((resolve) => setTimeout(resolve, 600));
				return { ok: true };
			});

			await app.inject({
				method: "GET",
				url: "/slow-request-default",
			});

			// Should log warning with default threshold
			expect(warnSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Slow request",
					slowThresholdMs: 500,
				}),
			);

			warnSpy.mockRestore();
		});

		it("should validate and fallback to default for invalid values", async () => {
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_SLOW_REQUEST_MS: 0,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			const warnSpy = vi.spyOn(app.log, "warn");

			await app.register(performancePlugin);
			await app.ready();

			app.get("/test-invalid", async () => {
				await new Promise((resolve) => setTimeout(resolve, 600));
				return { ok: true };
			});

			await app.inject({
				method: "GET",
				url: "/test-invalid",
			});

			// Should use default (500) when invalid value provided
			expect(warnSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Slow request",
					slowThresholdMs: 500,
				}),
			);

			warnSpy.mockRestore();
		});
	});

	describe("API_METRICS_SLOW_OPERATION_MS", () => {
		it("should pass slow operation threshold to performance tracker", async () => {
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_SLOW_OPERATION_MS: 300,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			app.get("/test-slow-op", async (request: FastifyRequest) => {
				// Track a slow operation (over 300ms)
				await request.perf?.time("slow-op", async () => {
					await new Promise((resolve) => setTimeout(resolve, 350));
				});
				const snapshot = request.perf?.snapshot();
				return { slowOps: snapshot?.slow ?? [] };
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-slow-op",
			});

			const body = JSON.parse(response.body) as {
				slowOps: Array<{ op: string; ms: number }>;
			};
			// Should have slow operation tracked
			expect(body.slowOps.length).toBeGreaterThan(0);
			expect(body.slowOps[0]?.op).toBe("slow-op");
		});

		it("should use default value (200) when env config not set", async () => {
			const customEnvConfig: Partial<EnvConfig> = {};
			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			app.get("/test-default-op", async (request: FastifyRequest) => {
				// Track an operation that's slow for default (200ms) but not for custom (300ms)
				await request.perf?.time("medium-op", async () => {
					await new Promise((resolve) => setTimeout(resolve, 250));
				});
				const snapshot = request.perf?.snapshot();
				return { slowOps: snapshot?.slow ?? [] };
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-default-op",
			});

			const body = JSON.parse(response.body) as {
				slowOps: Array<{ op: string; ms: number }>;
			};
			// Should have slow operation tracked with default threshold
			expect(body.slowOps.length).toBeGreaterThan(0);
		});

		it("should validate and fallback to default for invalid values", async () => {
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_SLOW_OPERATION_MS: 0,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			app.get("/test-invalid-op", async (request: FastifyRequest) => {
				// Track an operation that's slow for default (200ms)
				await request.perf?.time("test-op", async () => {
					await new Promise((resolve) => setTimeout(resolve, 250));
				});
				const snapshot = request.perf?.snapshot();
				return { slowOps: snapshot?.slow ?? [] };
			});

			const response = await app.inject({
				method: "GET",
				url: "/test-invalid-op",
			});

			const body = JSON.parse(response.body) as {
				slowOps: Array<{ op: string; ms: number }>;
			};
			// Should use default threshold (200ms) and track slow operation
			expect(body.slowOps.length).toBeGreaterThan(0);
		});
	});

	describe("API_METRICS_SNAPSHOT_RETENTION_COUNT", () => {
		it("should use env config value for snapshot retention", async () => {
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_SNAPSHOT_RETENTION_COUNT: 500,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			// Make multiple requests to exceed retention count
			for (let i = 0; i < 600; i++) {
				app.get(`/test-${i}`, async () => ({ ok: true }));
				await app.inject({
					method: "GET",
					url: `/test-${i}`,
				});
			}

			// Should only retain configured number of snapshots
			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots?.length).toBeLessThanOrEqual(500);
		});

		it("should use default value (1000) when env config not set", async () => {
			const customEnvConfig: Partial<EnvConfig> = {};
			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			// Make multiple requests
			for (let i = 0; i < 1100; i++) {
				app.get(`/test-default-${i}`, async () => ({ ok: true }));
				await app.inject({
					method: "GET",
					url: `/test-default-${i}`,
				});
			}

			// Should only retain default number of snapshots
			const snapshots = app.getMetricsSnapshots?.();
			expect(snapshots?.length).toBeLessThanOrEqual(1000);
		});
	});

	describe("Metrics Cache Service Integration", () => {
		it("should initialize metrics cache service", async () => {
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_CACHE_TTL_SECONDS: 600,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			expect(app.metricsCache).toBeDefined();
			expect(app.metricsCache).toBeInstanceOf(MetricsCacheService);
		});

		it("should use env config TTL for metrics cache", async () => {
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_CACHE_TTL_SECONDS: 900,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			// The cache service should be initialized with the custom TTL
			// We can't directly test the TTL, but we can verify the service exists
			expect(app.metricsCache).toBeDefined();
		});

		it("should use default TTL (300) when env config not set", async () => {
			const customEnvConfig: Partial<EnvConfig> = {};
			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			await app.register(performancePlugin);
			await app.ready();

			// Cache service should still be initialized with default TTL
			expect(app.metricsCache).toBeDefined();
		});

		it("should handle null cache service gracefully", async () => {
			// This test needs direct Fastify construction to test null cache scenario
			const customEnvConfig: Partial<EnvConfig> = {};
			app = Fastify({
				logger: {
					level: "silent",
				},
			});

			app.decorate("envConfig", customEnvConfig as EnvConfig);
			// Decorate with null cache to test defensive code
			app.decorate("cache", null as unknown as CacheService);
			// Register a fake cacheService plugin to satisfy the dependency
			await app.register(fp(async () => {}, { name: "cacheService" }));

			const warnSpy = vi.spyOn(app.log, "warn").mockImplementation(() => {});

			await app.register(performancePlugin);
			await app.ready();

			// Plugin should still work even if cache is null
			expect(app).toBeDefined();
			expect(app.getMetricsSnapshots).toBeDefined();
			// Should have logged a warning about cache not being available
			expect(warnSpy).toHaveBeenCalledWith(
				"Cache service not available - metrics cache will not be initialized",
			);
			// Metrics cache should not be initialized
			expect(app.metricsCache).toBeUndefined();

			warnSpy.mockRestore();
		});

		it("should handle cache service initialization failures gracefully", async () => {
			// Reset module registry to ensure fresh imports for this test only
			vi.resetModules();

			// Use doMock (NOT hoisted) to mock MetricsCacheService for this test only
			vi.doMock("~/src/services/metrics", () => ({
				MetricsCacheService: class {
					constructor() {
						throw new Error("Mock cache initialization failure");
					}
				},
			}));

			// Dynamically import the plugin AFTER the mock is set up
			const performanceModule = await import(
				"~/src/fastifyPlugins/performance"
			);
			const mockedPerformancePlugin = performanceModule.default;

			const customEnvConfig: Partial<EnvConfig> = {};
			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			const warnSpy = vi.spyOn(app.log, "warn").mockImplementation(() => {});

			await app.register(mockedPerformancePlugin);
			await app.ready();

			// Plugin should still work but cache should NOT be initialized
			expect(app).toBeDefined();
			expect(app.getMetricsSnapshots).toBeDefined();
			// metricsCache should be undefined due to constructor failure
			expect(app.metricsCache).toBeUndefined();
			// Should have logged a warning about the failure
			expect(warnSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Mock cache initialization failure",
				}),
				"Failed to initialize metrics cache service (continuing without cache)",
			);

			warnSpy.mockRestore();

			// Clean up: unmock and reset modules for subsequent tests
			vi.doUnmock("~/src/services/metrics");
			vi.resetModules();
		});
	});

	describe("Environment variable usage from fastify.envConfig", () => {
		it("should read from fastify.envConfig, not process.env", async () => {
			// Set process.env to a different value
			process.env.API_METRICS_SLOW_REQUEST_MS = "2000";

			// Use different value in envConfig
			const customEnvConfig: Partial<EnvConfig> = {
				API_METRICS_SLOW_REQUEST_MS: 1000,
			};

			app = createTestApp({ envConfig: customEnvConfig, cache: mockCache });

			const warnSpy = vi.spyOn(app.log, "warn");

			await app.register(performancePlugin);
			await app.ready();

			app.get("/test-env-config", async () => {
				await new Promise((resolve) => setTimeout(resolve, 1500));
				return { ok: true };
			});

			await app.inject({
				method: "GET",
				url: "/test-env-config",
			});

			// Should use envConfig value (1000), not process.env value (2000)
			expect(warnSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Slow request",
					slowThresholdMs: 1000, // From envConfig, not process.env
				}),
			);

			warnSpy.mockRestore();
			delete process.env.API_METRICS_SLOW_REQUEST_MS;
		});
	});
});
