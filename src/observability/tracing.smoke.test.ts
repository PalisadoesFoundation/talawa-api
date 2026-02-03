// import { NodeSDK } from "@opentelemetry/sdk-node";
// import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// // Create a mutable config object that we can modify per test
// let mockConfig = {
// 	enabled: true,
// 	samplingRatio: 1,
// 	serviceName: "test-service",
// 	exporterEnabled: true,
// 	exporterType: "console" as "console" | "otlp",
// 	otlpTraceEndpoint: undefined as string | undefined,
// 	otlpMetricEndpoint: undefined as string | undefined,
// };

// vi.mock("@opentelemetry/sdk-node", () => {
// 	return {
// 		NodeSDK: vi.fn().mockImplementation(() => ({
// 			start: vi.fn().mockResolvedValue(undefined),
// 			shutdown: vi.fn().mockResolvedValue(undefined),
// 		})),
// 	};
// });

// vi.mock("@opentelemetry/api", () => ({
// 	DiagConsoleLogger: vi.fn(),
// 	DiagLogLevel: {
// 		DEBUG: 20,
// 		INFO: 30,
// 		ERROR: 50,
// 	},
// 	diag: {
// 		setLogger: vi.fn(),
// 		info: vi.fn(),
// 	},
// }));

// vi.mock("@opentelemetry/core", () => ({
// 	W3CTraceContextPropagator: vi.fn(),
// }));

// vi.mock("@opentelemetry/exporter-trace-otlp-grpc", () => ({
// 	OTLPTraceExporter: vi.fn(),
// }));

// vi.mock("@opentelemetry/exporter-metrics-otlp-http", () => ({
// 	OTLPMetricExporter: vi.fn(),
// }));

// vi.mock("@opentelemetry/auto-instrumentations-node", () => ({
// 	getNodeAutoInstrumentations: vi.fn(),
// }));

// vi.mock("@opentelemetry/resources", () => ({
// 	resourceFromAttributes: vi.fn(),
// }));

// vi.mock("@opentelemetry/sdk-trace-base", () => ({
// 	ConsoleSpanExporter: vi.fn(),
// 	ParentBasedSampler: vi.fn(),
// 	TraceIdRatioBasedSampler: vi.fn(),
// }));

// vi.mock("@opentelemetry/sdk-metrics", () => ({
// 	PeriodicExportingMetricReader: vi.fn(),
// }));

// vi.mock("@fastify/otel", () => ({
// 	FastifyOtelInstrumentation: vi.fn().mockImplementation(() => ({})),
// }));

// // Mock the observability config with a getter that returns our mutable config
// vi.mock("../../config/observability", () => ({
// 	get observabilityConfig() {
// 		return mockConfig;
// 	},
// }));

// describe("OTEL bootstrap smoke tests", () => {
// 	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
// 	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

// 	// Helper to ensure module is imported with fresh config
// 	async function importWithConfig(configOverrides: Partial<typeof mockConfig>) {
// 		// Update config first
// 		Object.assign(mockConfig, configOverrides);
// 		// Force module reset
// 		vi.resetModules();
// 		// Import fresh module
// 		return await import("../../src/observability/tracing/bootstrap");
// 	}

// 	beforeEach(() => {
// 		// Clear mocks first
// 		vi.clearAllMocks();
// 		// Reset modules to clear any cached state
// 		vi.resetModules();

// 		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
// 		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

// 		// Reset to default config
// 		mockConfig = {
// 			enabled: true,
// 			samplingRatio: 1,
// 			serviceName: "test-service",
// 			exporterEnabled: true,
// 			exporterType: "console",
// 			otlpTraceEndpoint: undefined,
// 			otlpMetricEndpoint: undefined,
// 		};
// 	});

// 	afterEach(() => {
// 		consoleErrorSpy.mockRestore();
// 		consoleLogSpy.mockRestore();
// 		vi.clearAllMocks();
// 		vi.useRealTimers();
// 	});

// 	describe("Disabled state", () => {
// 		it("does not initialize SDK when observability is disabled", async () => {
// 			const { initTracing } = await importWithConfig({
// 				enabled: false,
// 			});

// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).not.toHaveBeenCalled();
// 			expect(consoleLogSpy).toHaveBeenCalledWith(
// 				"[observability] Tracing is disabled via configuration.",
// 			);
// 		});
// 	});

// 	describe("Enabled state - Console exporter", () => {
// 		it("initializes SDK successfully with console exporter", async () => {
// 			mockConfig.enabled = true;
// 			mockConfig.exporterEnabled = true;
// 			mockConfig.exporterType = "console";

// 			const { initTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);
// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).toHaveBeenCalledTimes(1);
// 		});
// 	});

// 	describe("Enabled state - OTLP exporter", () => {
// 		it("initializes SDK with OTLP exporter when endpoints are provided", async () => {
// 			mockConfig.enabled = true;
// 			mockConfig.exporterEnabled = true;
// 			mockConfig.exporterType = "otlp";
// 			mockConfig.otlpTraceEndpoint = "http://localhost:4317/v1/traces";
// 			mockConfig.otlpMetricEndpoint = "http://localhost:4318/v1/metrics";

// 			const { initTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);
// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).toHaveBeenCalledTimes(1);
// 		});

// 		it("throws error when OTLP trace endpoint is missing", async () => {
// 			const { initTracing } = await importWithConfig({
// 				exporterType: "otlp",
// 				otlpTraceEndpoint: undefined,
// 				otlpMetricEndpoint: "http://localhost:4318/v1/metrics",
// 			});

// 			await expect(initTracing()).rejects.toThrow(
// 				"otlpEndpoint must be provided when exporterType is 'otlp'",
// 			);
// 		});

// 		it("throws error when OTLP metric endpoint is missing", async () => {
// 			const { initTracing } = await importWithConfig({
// 				exporterType: "otlp",
// 				otlpTraceEndpoint: "http://localhost:4317/v1/traces",
// 				otlpMetricEndpoint: undefined,
// 			});

// 			await expect(initTracing()).rejects.toThrow(
// 				"otlpEndpoint must be provided when exporterType is 'otlp'",
// 			);
// 		});

// 		it("throws error when both OTLP endpoints are missing", async () => {
// 			const { initTracing } = await importWithConfig({
// 				exporterType: "otlp",
// 				otlpTraceEndpoint: undefined,
// 				otlpMetricEndpoint: undefined,
// 			});

// 			await expect(initTracing()).rejects.toThrow(
// 				"otlpEndpoint must be provided when exporterType is 'otlp'",
// 			);
// 		});
// 	});

// 	describe("Exporter disabled", () => {
// 		it("initializes SDK with no exporter when exporterEnabled is false", async () => {
// 			mockConfig.enabled = true;
// 			mockConfig.exporterEnabled = false;

// 			const { initTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);
// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).toHaveBeenCalledTimes(1);
// 		});
// 	});

// 	describe("Unknown exporter type", () => {
// 		it("initializes SDK with undefined exporter for unknown type", async () => {
// 			mockConfig.enabled = true;
// 			mockConfig.exporterEnabled = true;
// 			mockConfig.exporterType = "unknown-type" as any;

// 			const { initTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);
// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).toHaveBeenCalledTimes(1);
// 		});
// 	});

// 	describe("Sampling configuration", () => {
// 		it("accepts valid sampling ratio", async () => {
// 			const { initTracing } = await importWithConfig({
// 				samplingRatio: 0.25,
// 			});

// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).toHaveBeenCalled();
// 		});

// 		it("rejects sampling ratio > 1", async () => {
// 			const { initTracing } = await importWithConfig({
// 				samplingRatio: 1.5,
// 			});

// 			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
// 		});

// 		it("rejects negative sampling ratio", async () => {
// 			const { initTracing } = await importWithConfig({
// 				samplingRatio: -0.1,
// 			});

// 			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
// 		});

// 		it("rejects NaN sampling ratio", async () => {
// 			const { initTracing } = await importWithConfig({
// 				samplingRatio: NaN,
// 			});

// 			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
// 		});

// 		it("handles sampling ratio of 0", async () => {
// 			const { initTracing } = await importWithConfig({
// 				samplingRatio: 0,
// 			});

// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).toHaveBeenCalled();
// 		});

// 		it("handles sampling ratio of 1", async () => {
// 			const { initTracing } = await importWithConfig({
// 				samplingRatio: 1,
// 			});

// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(NodeSDK).toHaveBeenCalled();
// 		});
// 	});

// 	describe("Error handling", () => {
// 		it("logs error and sets sdk to undefined when SDK start fails", async () => {
// 			const mockStart = vi
// 				.fn()
// 				.mockRejectedValueOnce(new Error("Connection refused"));
// 			vi.mocked(NodeSDK).mockImplementationOnce(
// 				() =>
// 					({
// 						start: mockStart,
// 						shutdown: vi.fn().mockResolvedValue(undefined),
// 					}) as unknown as NodeSDK,
// 			);

// 			mockConfig.enabled = true;

// 			const { initTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);
// 			await expect(initTracing()).resolves.toBeUndefined();
// 			expect(consoleErrorSpy).toHaveBeenCalledWith(
// 				expect.stringContaining(
// 					"[observability] Failed to initialize OpenTelemetry. Tracing is disabled.",
// 				),
// 				expect.any(Error),
// 			);
// 		});
// 	});

// 	describe("Shutdown functionality", () => {
// 		it("handles shutdown when SDK was never initialized", async () => {
// 			mockConfig.enabled = false;

// 			// Import and call initTracing first to ensure SDK is not initialized
// 			const module = await import("../../src/observability/tracing/bootstrap");
// 			await module.initTracing();

// 			await expect(module.shutdownTracing()).resolves.toBeUndefined();
// 		});

// 		it("successfully shuts down initialized SDK", async () => {
// 			const mockShutdown = vi.fn().mockResolvedValue(undefined);
// 			vi.mocked(NodeSDK).mockImplementationOnce(
// 				() =>
// 					({
// 						start: vi.fn().mockResolvedValue(undefined),
// 						shutdown: mockShutdown,
// 					}) as unknown as NodeSDK,
// 			);

// 			mockConfig.enabled = true;

// 			const { initTracing, shutdownTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);

// 			await initTracing();
// 			await shutdownTracing();

// 			expect(mockShutdown).toHaveBeenCalledTimes(1);
// 			expect(consoleLogSpy).toHaveBeenCalledWith(
// 				"[observability] OpenTelemetry shut down successfully",
// 			);
// 		});

// 		it("logs error and rethrows when shutdown fails", async () => {
// 			const shutdownError = new Error("Shutdown failed");
// 			const mockShutdown = vi.fn().mockRejectedValue(shutdownError);
// 			vi.mocked(NodeSDK).mockImplementationOnce(
// 				() =>
// 					({
// 						start: vi.fn().mockResolvedValue(undefined),
// 						shutdown: mockShutdown,
// 					}) as unknown as NodeSDK,
// 			);

// 			mockConfig.enabled = true;

// 			const { initTracing, shutdownTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);

// 			await initTracing();

// 			await expect(shutdownTracing()).rejects.toThrow("Shutdown failed");
// 			expect(consoleErrorSpy).toHaveBeenCalledWith(
// 				"[observability] Failed to shutdown OpenTelemetry",
// 				shutdownError,
// 			);
// 		});

// 		it("throws timeout error when shutdown hangs", async () => {
// 			vi.useFakeTimers();

// 			const mockShutdown = vi
// 				.fn()
// 				.mockImplementation(() => new Promise(() => {}));
// 			vi.mocked(NodeSDK).mockImplementationOnce(
// 				() =>
// 					({
// 						start: vi.fn().mockResolvedValue(undefined),
// 						shutdown: mockShutdown,
// 					}) as unknown as NodeSDK,
// 			);

// 			mockConfig.enabled = true;

// 			const { initTracing, shutdownTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);

// 			await initTracing();

// 			const shutdownPromise = shutdownTracing().catch((err) => err);

// 			await vi.advanceTimersByTimeAsync(5001);

// 			const result = await shutdownPromise;
// 			expect(result).toBeInstanceOf(Error);
// 			expect(result.message).toMatch(/timeout/i);

// 			expect(consoleErrorSpy).toHaveBeenCalledWith(
// 				"[observability] Shutdown timed out",
// 			);
// 			expect(consoleErrorSpy).toHaveBeenCalledWith(
// 				"[observability] Failed to shutdown OpenTelemetry",
// 				expect.any(Error),
// 			);

// 			vi.useRealTimers();
// 		});

// 		it("clears timeout when shutdown completes successfully", async () => {
// 			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

// 			const mockShutdown = vi.fn().mockResolvedValue(undefined);
// 			vi.mocked(NodeSDK).mockImplementationOnce(
// 				() =>
// 					({
// 						start: vi.fn().mockResolvedValue(undefined),
// 						shutdown: mockShutdown,
// 					}) as unknown as NodeSDK,
// 			);

// 			mockConfig.enabled = true;

// 			const { initTracing, shutdownTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);

// 			await initTracing();
// 			await shutdownTracing();

// 			expect(clearTimeoutSpy).toHaveBeenCalled();
// 			clearTimeoutSpy.mockRestore();
// 		});

// 		it("clears timeout even when shutdown fails", async () => {
// 			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

// 			const shutdownError = new Error("Shutdown failed");
// 			const mockShutdown = vi.fn().mockRejectedValue(shutdownError);
// 			vi.mocked(NodeSDK).mockImplementationOnce(
// 				() =>
// 					({
// 						start: vi.fn().mockResolvedValue(undefined),
// 						shutdown: mockShutdown,
// 					}) as unknown as NodeSDK,
// 			);

// 			mockConfig.enabled = true;

// 			const { initTracing, shutdownTracing } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);

// 			await initTracing();

// 			try {
// 				await shutdownTracing();
// 			} catch {
// 				// Expected to throw
// 			}

// 			expect(clearTimeoutSpy).toHaveBeenCalled();
// 			clearTimeoutSpy.mockRestore();
// 		});
// 	});

// 	describe("Module exports", () => {
// 		it("exports fastifyOtelInstrumentation instance", async () => {
// 			const { fastifyOtelInstrumentation } = await import(
// 				"../../src/observability/tracing/bootstrap"
// 			);
// 			expect(fastifyOtelInstrumentation).toBeDefined();
// 		});
// 	});
// });
