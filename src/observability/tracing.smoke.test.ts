import { NodeSDK } from "@opentelemetry/sdk-node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@opentelemetry/sdk-node", () => {
	return {
		NodeSDK: vi.fn().mockImplementation(() => ({
			start: vi.fn().mockResolvedValue(undefined),
			shutdown: vi.fn().mockResolvedValue(undefined),
		})),
	};
});

vi.mock("@opentelemetry/api", () => ({
	DiagConsoleLogger: vi.fn(),
	DiagLogLevel: {
		DEBUG: 20,
		INFO: 30,
		ERROR: 50,
	},
	diag: {
		setLogger: vi.fn(),
		info: vi.fn(),
	},
}));

vi.mock("@opentelemetry/core", () => ({
	W3CTraceContextPropagator: vi.fn(),
}));

vi.mock("@opentelemetry/exporter-trace-otlp-grpc", () => ({
	OTLPTraceExporter: vi.fn(),
}));

vi.mock("@opentelemetry/exporter-metrics-otlp-http", () => ({
	OTLPMetricExporter: vi.fn(),
}));

vi.mock("@opentelemetry/auto-instrumentations-node", () => ({
	getNodeAutoInstrumentations: vi.fn(),
}));

vi.mock("@opentelemetry/resources", () => ({
	resourceFromAttributes: vi.fn(),
}));

vi.mock("@opentelemetry/sdk-trace-base", () => ({
	ConsoleSpanExporter: vi.fn(),
	ParentBasedSampler: vi.fn(),
	TraceIdRatioBasedSampler: vi.fn(),
}));

vi.mock("@opentelemetry/sdk-metrics", () => ({
	PeriodicExportingMetricReader: vi.fn(),
}));

vi.mock("@fastify/otel", () => ({
	FastifyOtelInstrumentation: vi.fn().mockImplementation(() => ({
		registerOnInitialization: false,
	})),
}));

vi.mock("src/config/observability", () => ({
	observabilityConfig: {
		enabled: true,
		exporterEnabled: true,
		exporterType: "console",
		samplingRatio: 1.0,
		serviceName: "test-service",
		otlpTraceEndpoint: undefined,
		otlpMetricEndpoint: undefined,
	},
}));

describe("OTEL bootstrap smoke tests", () => {
	let originalEnv: NodeJS.ProcessEnv;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		originalEnv = { ...process.env };
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		vi.resetModules();
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
		consoleErrorSpy.mockRestore();
		consoleLogSpy.mockRestore();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe("Disabled state", () => {
		it("does not initialize SDK when observability is disabled", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = false;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).not.toHaveBeenCalled();
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"[observability] Tracing is disabled via configuration.",
			);
		});
	});

	describe("Enabled state - Console exporter", () => {
		it("initializes SDK successfully with console exporter", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "console";
			observabilityConfig.samplingRatio = 1.0;
			observabilityConfig.serviceName = "test-service";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalledTimes(1);
		});

		it("initializes without metrics when using console exporter", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "console";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			const sdkCall = vi.mocked(NodeSDK).mock.calls[0]?.[0];
			expect(sdkCall?.metricReader).toBeUndefined();
		});
	});

	describe("Enabled state - OTLP exporter with metrics", () => {
		it("initializes SDK with OTLP trace and metric exporters", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "otlp";
			observabilityConfig.otlpTraceEndpoint = "http://localhost:4317";
			observabilityConfig.otlpMetricEndpoint =
				"http://localhost:4318/v1/metrics";
			observabilityConfig.serviceName = "test-service";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalledTimes(1);
		});

		it("throws error when OTLP trace endpoint is missing", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "otlp";
			observabilityConfig.otlpTraceEndpoint = undefined;
			observabilityConfig.otlpMetricEndpoint =
				"http://localhost:4318/v1/metrics";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(
				"otlpEndpoint must be provided when exporterType is 'otlp'",
			);
		});

		it("throws error when OTLP metric endpoint is missing", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "otlp";
			observabilityConfig.otlpTraceEndpoint = "http://localhost:4317";
			observabilityConfig.otlpMetricEndpoint = undefined;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(
				"otlpEndpoint must be provided when exporterType is 'otlp'",
			);
		});

		it("throws error when both OTLP endpoints are missing", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "otlp";
			observabilityConfig.otlpTraceEndpoint = undefined;
			observabilityConfig.otlpMetricEndpoint = undefined;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(
				"otlpEndpoint must be provided when exporterType is 'otlp'",
			);
		});

		it("configures PeriodicExportingMetricReader with correct interval", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			const { PeriodicExportingMetricReader } = await import(
				"@opentelemetry/sdk-metrics"
			);

			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "otlp";
			observabilityConfig.otlpTraceEndpoint = "http://localhost:4317";
			observabilityConfig.otlpMetricEndpoint =
				"http://localhost:4318/v1/metrics";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			expect(PeriodicExportingMetricReader).toHaveBeenCalledWith(
				expect.objectContaining({
					exportIntervalMillis: 60000,
				}),
			);
		});
	});

	describe("Exporter disabled state", () => {
		it("initializes SDK without exporters when exporter is disabled", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = false;
			observabilityConfig.samplingRatio = 1.0;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			const sdkCall = vi.mocked(NodeSDK).mock.calls[0]?.[0];
			expect(sdkCall?.traceExporter).toBeUndefined();
			expect(sdkCall?.metricReader).toBeUndefined();
		});
	});

	describe("Sampling configuration", () => {
		it("accepts valid sampling ratio", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.samplingRatio = 0.25;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});

		it("rejects sampling ratio > 1", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.samplingRatio = 1.5;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
		});

		it("rejects negative sampling ratio", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.samplingRatio = -0.1;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
		});

		it("rejects NaN sampling ratio", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.samplingRatio = NaN;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
		});

		it("handles sampling ratio of 0", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.samplingRatio = 0;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});

		it("handles sampling ratio of 1", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.samplingRatio = 1;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});
	});

	describe("Instrumentation configuration", () => {
		it("includes fastifyOtelInstrumentation in SDK config", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			const sdkCall = vi.mocked(NodeSDK).mock.calls[0]?.[0];
			expect(sdkCall?.instrumentations).toBeDefined();
			expect(Array.isArray(sdkCall?.instrumentations)).toBe(true);
		});
	});

	describe("Error handling", () => {
		it("logs error and sets sdk to undefined when SDK start fails", async () => {
			const mockStart = vi
				.fn()
				.mockRejectedValueOnce(new Error("Connection refused"));
			vi.mocked(NodeSDK).mockImplementationOnce(
				() =>
					({
						start: mockStart,
						shutdown: vi.fn().mockResolvedValue(undefined),
					}) as unknown as NodeSDK,
			);

			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "console";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[observability] Failed to initialize OpenTelemetry. Tracing is disabled.",
				expect.any(Error),
			);
		});

		it("continues execution when SDK initialization throws", async () => {
			vi.mocked(NodeSDK).mockImplementationOnce(() => {
				throw new Error("Initialization error");
			});

			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("Shutdown functionality", () => {
		it("handles shutdown when SDK was never initialized", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = false;

			const { shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(shutdownTracing()).resolves.toBeUndefined();
		});

		it("successfully shuts down initialized SDK", async () => {
			const mockShutdown = vi.fn().mockResolvedValue(undefined);
			vi.mocked(NodeSDK).mockImplementationOnce(
				() =>
					({
						start: vi.fn().mockResolvedValue(undefined),
						shutdown: mockShutdown,
					}) as unknown as NodeSDK,
			);

			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing, shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();
			await shutdownTracing();

			expect(mockShutdown).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				"[observability] OpenTelemetry shut down successfully",
			);
		});

		it("logs error and rethrows when shutdown fails", async () => {
			const shutdownError = new Error("Shutdown failed");
			const mockShutdown = vi.fn().mockRejectedValue(shutdownError);
			vi.mocked(NodeSDK).mockImplementationOnce(
				() =>
					({
						start: vi.fn().mockResolvedValue(undefined),
						shutdown: mockShutdown,
					}) as unknown as NodeSDK,
			);

			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing, shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			await expect(shutdownTracing()).rejects.toThrow("Shutdown failed");
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[observability] Failed to shutdown OpenTelemetry",
				shutdownError,
			);
		});

		it("throws timeout error when shutdown hangs", async () => {
			vi.useFakeTimers();

			const mockShutdown = vi
				.fn()
				.mockImplementation(() => new Promise(() => {}));
			vi.mocked(NodeSDK).mockImplementationOnce(
				() =>
					({
						start: vi.fn().mockResolvedValue(undefined),
						shutdown: mockShutdown,
					}) as unknown as NodeSDK,
			);

			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing, shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			const shutdownPromise = shutdownTracing().catch((err) => err);

			await vi.advanceTimersByTimeAsync(5001);

			const result = await shutdownPromise;
			expect(result).toBeInstanceOf(Error);
			expect(result.message).toMatch(/timeout/i);

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[observability] Shutdown timed out",
			);
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[observability] Failed to shutdown OpenTelemetry",
				expect.any(Error),
			);

			vi.useRealTimers();
		});

		it("clears timeout when shutdown completes successfully", async () => {
			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

			const mockShutdown = vi.fn().mockResolvedValue(undefined);
			vi.mocked(NodeSDK).mockImplementationOnce(
				() =>
					({
						start: vi.fn().mockResolvedValue(undefined),
						shutdown: mockShutdown,
					}) as unknown as NodeSDK,
			);

			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing, shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();
			await shutdownTracing();

			expect(clearTimeoutSpy).toHaveBeenCalled();
			clearTimeoutSpy.mockRestore();
		});

		it("clears timeout even when shutdown fails", async () => {
			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

			const shutdownError = new Error("Shutdown failed");
			const mockShutdown = vi.fn().mockRejectedValue(shutdownError);
			vi.mocked(NodeSDK).mockImplementationOnce(
				() =>
					({
						start: vi.fn().mockResolvedValue(undefined),
						shutdown: mockShutdown,
					}) as unknown as NodeSDK,
			);

			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing, shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			try {
				await shutdownTracing();
			} catch {
				// Expected to throw
			}

			expect(clearTimeoutSpy).toHaveBeenCalled();
			clearTimeoutSpy.mockRestore();
		});
	});

	describe("Module exports", () => {
		it("exports fastifyOtelInstrumentation instance", async () => {
			const { fastifyOtelInstrumentation } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			expect(fastifyOtelInstrumentation).toBeDefined();
		});

		it("fastifyOtelInstrumentation has correct configuration", async () => {
			const { fastifyOtelInstrumentation } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			expect(fastifyOtelInstrumentation).toHaveProperty(
				"registerOnInitialization",
				false,
			);
		});
	});

	describe("SDK configuration", () => {
		it("configures SDK with W3CTraceContextPropagator", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			const sdkCall = vi.mocked(NodeSDK).mock.calls[0]?.[0];
			expect(sdkCall?.textMapPropagator).toBeDefined();
		});

		it("configures SDK with ParentBasedSampler", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			const { ParentBasedSampler } = await import(
				"@opentelemetry/sdk-trace-base"
			);

			observabilityConfig.enabled = true;
			observabilityConfig.samplingRatio = 0.5;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			expect(ParentBasedSampler).toHaveBeenCalled();
		});

		it("configures SDK with service name from config", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			const { resourceFromAttributes } = await import(
				"@opentelemetry/resources"
			);

			observabilityConfig.enabled = true;
			observabilityConfig.serviceName = "my-custom-service";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			expect(resourceFromAttributes).toHaveBeenCalledWith({
				"service.name": "my-custom-service",
			});
		});
	});

	describe("Exporter type edge cases", () => {
		it("handles unknown exporter type gracefully", async () => {
			const { observabilityConfig } = await import("src/config/observability");
			observabilityConfig.enabled = true;
			observabilityConfig.exporterEnabled = true;
			observabilityConfig.exporterType = "unknown";

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await initTracing();

			const sdkCall = vi.mocked(NodeSDK).mock.calls[0]?.[0];
			expect(sdkCall?.traceExporter).toBeUndefined();
			expect(sdkCall?.metricReader).toBeUndefined();
		});
	});
});
