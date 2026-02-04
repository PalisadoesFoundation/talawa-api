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

vi.mock("@opentelemetry/sdk-metrics", () => ({
	PeriodicExportingMetricReader: vi.fn(),
}));

vi.mock("@opentelemetry/auto-instrumentations-node", () => ({
	getNodeAutoInstrumentations: vi.fn().mockReturnValue([]),
}));

vi.mock("@opentelemetry/instrumentation-http", () => ({
	HttpInstrumentation: vi.fn(),
}));

vi.mock("@opentelemetry/resources", () => ({
	resourceFromAttributes: vi.fn(),
}));

vi.mock("@opentelemetry/sdk-trace-base", () => ({
	ConsoleSpanExporter: vi.fn(),
	ParentBasedSampler: vi.fn(),
	TraceIdRatioBasedSampler: vi.fn(),
}));

vi.mock("@fastify/otel", () => ({
	FastifyOtelInstrumentation: vi.fn().mockImplementation(() => ({})),
}));

describe("OTEL bootstrap smoke tests", () => {
	let originalEnv: NodeJS.ProcessEnv;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		originalEnv = { ...process.env };
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { });
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
		it("does not initialize SDK when tracing is disabled via configuration", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "false",
			};

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

	describe("Exporter configuration", () => {
		describe("Console exporter", () => {
			it("initializes SDK with ConsoleSpanExporter when exporterType is console", async () => {
				process.env = {
					...originalEnv,
					API_OTEL_ENABLED: "true",
					API_OTEL_EXPORTER_ENABLED: "true",
					API_OTEL_EXPORTER_TYPE: "console",
					API_OTEL_SERVICE_NAME: "test-service",
				};

				const { ConsoleSpanExporter } = await import(
					"@opentelemetry/sdk-trace-base"
				);
				const { initTracing } = await import(
					"../../src/observability/tracing/bootstrap"
				);

				await expect(initTracing()).resolves.toBeUndefined();
				expect(NodeSDK).toHaveBeenCalledTimes(1);
				expect(ConsoleSpanExporter).toHaveBeenCalled();
			});
		});

		describe("OTLP exporter", () => {
			it("initializes SDK with OTLP exporters when exporterType is otlp", async () => {
				process.env = {
					...originalEnv,
					API_OTEL_ENABLED: "true",
					API_OTEL_EXPORTER_ENABLED: "true",
					API_OTEL_EXPORTER_TYPE: "otlp",
					API_OTEL_SERVICE_NAME: "test-service",
					API_OTEL_EXPORTER_OTLP_TRACE_ENDPOINT: "http://localhost:4317",
					API_OTEL_EXPORTER_OTLP_METRIC_ENDPOINT: "http://localhost:4318/v1/metrics",
				};

				const { OTLPTraceExporter } = await import(
					"@opentelemetry/exporter-trace-otlp-grpc"
				);
				const { OTLPMetricExporter } = await import(
					"@opentelemetry/exporter-metrics-otlp-http"
				);
				const { PeriodicExportingMetricReader } = await import(
					"@opentelemetry/sdk-metrics"
				);

				const { initTracing } = await import(
					"../../src/observability/tracing/bootstrap"
				);

				await expect(initTracing()).resolves.toBeUndefined();
				expect(NodeSDK).toHaveBeenCalledTimes(1);
				expect(OTLPTraceExporter).toHaveBeenCalledWith({
					url: "http://localhost:4317",
				});
				expect(OTLPMetricExporter).toHaveBeenCalledWith({
					url: "http://localhost:4318/v1/metrics",
				});
				expect(PeriodicExportingMetricReader).toHaveBeenCalledWith(
					expect.objectContaining({
						exportIntervalMillis: 60000,
					}),
				);
			});

			it("throws error when otlpTraceEndpoint is missing for otlp exporter", async () => {
				process.env = {
					...originalEnv,
					API_OTEL_ENABLED: "true",
					API_OTEL_EXPORTER_ENABLED: "true",
					API_OTEL_EXPORTER_TYPE: "otlp",
					API_OTEL_SERVICE_NAME: "test-service",
					API_OTEL_EXPORTER_OTLP_METRIC_ENDPOINT: "http://localhost:4318/v1/metrics",
				};

				const { initTracing } = await import(
					"../../src/observability/tracing/bootstrap"
				);

				await expect(initTracing()).rejects.toThrow(
					"otlpEndpoint must be provided when exporterType is 'otlp'",
				);
			});

			it("throws error when otlpMetricEndpoint is missing for otlp exporter", async () => {
				process.env = {
					...originalEnv,
					API_OTEL_ENABLED: "true",
					API_OTEL_EXPORTER_ENABLED: "true",
					API_OTEL_EXPORTER_TYPE: "otlp",
					API_OTEL_SERVICE_NAME: "test-service",
					API_OTEL_EXPORTER_OTLP_TRACE_ENDPOINT: "http://localhost:4317",
				};

				const { initTracing } = await import(
					"../../src/observability/tracing/bootstrap"
				);

				await expect(initTracing()).rejects.toThrow(
					"otlpEndpoint must be provided when exporterType is 'otlp'",
				);
			});
		});

		describe("Exporter disabled", () => {
			it("initializes SDK without exporter when exporterEnabled is false", async () => {
				process.env = {
					...originalEnv,
					API_OTEL_ENABLED: "true",
					API_OTEL_EXPORTER_ENABLED: "false",
					API_OTEL_SERVICE_NAME: "test-service",
				};

				const { OTLPTraceExporter } = await import(
					"@opentelemetry/exporter-trace-otlp-grpc"
				);
				const { ConsoleSpanExporter } = await import(
					"@opentelemetry/sdk-trace-base"
				);

				const { initTracing } = await import(
					"../../src/observability/tracing/bootstrap"
				);

				await expect(initTracing()).resolves.toBeUndefined();
				expect(NodeSDK).toHaveBeenCalledTimes(1);
				expect(OTLPTraceExporter).not.toHaveBeenCalled();
				expect(ConsoleSpanExporter).not.toHaveBeenCalled();
			});
		});

		describe("Unknown exporter type", () => {
			it("initializes SDK with undefined exporter for unknown exporterType", async () => {
				process.env = {
					...originalEnv,
					API_OTEL_ENABLED: "true",
					API_OTEL_EXPORTER_ENABLED: "true",
					API_OTEL_EXPORTER_TYPE: "unknown",
					API_OTEL_SERVICE_NAME: "test-service",
				};

				const { OTLPTraceExporter } = await import(
					"@opentelemetry/exporter-trace-otlp-grpc"
				);
				const { ConsoleSpanExporter } = await import(
					"@opentelemetry/sdk-trace-base"
				);

				const { initTracing } = await import(
					"../../src/observability/tracing/bootstrap"
				);

				await expect(initTracing()).resolves.toBeUndefined();
				expect(NodeSDK).toHaveBeenCalledTimes(1);
				expect(OTLPTraceExporter).not.toHaveBeenCalled();
				expect(ConsoleSpanExporter).not.toHaveBeenCalled();
			});
		});
	});

	describe("Sampling configuration", () => {
		it("accepts valid sampling ratio", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SAMPLING_RATIO: "0.25",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});

		it("rejects sampling ratio > 1", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SAMPLING_RATIO: "1.5",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
		});

		it("rejects negative sampling ratio", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SAMPLING_RATIO: "-0.1",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
		});

		it("rejects non-numeric sampling ratio (NaN)", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SAMPLING_RATIO: "invalid",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
		});
	});

	describe("Error handling", () => {
		it("logs error but continues when SDK start fails", async () => {
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

			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "true",
				API_OTEL_EXPORTER_TYPE: "otlp",
				API_OTEL_SERVICE_NAME: "test-service",
				API_OTEL_EXPORTER_OTLP_TRACE_ENDPOINT: "http://localhost:4317",
				API_OTEL_EXPORTER_OTLP_METRIC_ENDPOINT: "http://localhost:4318/v1/metrics",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				expect.stringContaining("Failed to initialize OpenTelemetry"),
				expect.any(Error),
			);
		});
	});

	describe("Shutdown functionality", () => {
		it("handles shutdown when SDK was never initialized", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "false",
			};

			const { shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(shutdownTracing()).resolves.toBeUndefined();
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

			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
			};

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
	});

	describe("Edge cases", () => {
		it("handles sampling ratio of 0", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SAMPLING_RATIO: "0",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});

		it("handles sampling ratio of 1", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SAMPLING_RATIO: "1",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});

		it("uses default sampling ratio when not provided", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
			};
			delete process.env.API_OTEL_SAMPLING_RATIO;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});
	});

	describe("SDK configuration", () => {
		it("configures SDK with correct resource attributes", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SERVICE_NAME: "my-custom-service",
			};

			const { resourceFromAttributes } = await import(
				"@opentelemetry/resources"
			);
			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			expect(resourceFromAttributes).toHaveBeenCalledWith({
				"service.name": "my-custom-service",
			});
		});

		it("configures SDK with ParentBasedSampler wrapping TraceIdRatioBasedSampler", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
				API_OTEL_SAMPLING_RATIO: "0.5",
			};

			const { ParentBasedSampler, TraceIdRatioBasedSampler } = await import(
				"@opentelemetry/sdk-trace-base"
			);
			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			expect(TraceIdRatioBasedSampler).toHaveBeenCalledWith(0.5);
			expect(ParentBasedSampler).toHaveBeenCalled();
		});

		it("configures SDK with W3CTraceContextPropagator", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
			};

			const { W3CTraceContextPropagator } = await import(
				"@opentelemetry/core"
			);
			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			expect(W3CTraceContextPropagator).toHaveBeenCalled();
		});

		it("includes getNodeAutoInstrumentations in SDK configuration", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
			};

			const { getNodeAutoInstrumentations } = await import(
				"@opentelemetry/auto-instrumentations-node"
			);
			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			expect(getNodeAutoInstrumentations).toHaveBeenCalled();
		});
	});

	describe("Debug logging", () => {
		it("sets diag logger with DEBUG level", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
			};

			const { diag, DiagConsoleLogger, DiagLogLevel } = await import(
				"@opentelemetry/api"
			);

			// Import the bootstrap module (this triggers the diag.setLogger call at module load)
			await import("../../src/observability/tracing/bootstrap");

			expect(DiagConsoleLogger).toHaveBeenCalled();
			expect(diag.setLogger).toHaveBeenCalledWith(
				expect.any(Object),
				DiagLogLevel.DEBUG,
			);
		});

		it("logs success message via diag.info after SDK initialization", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_EXPORTER_ENABLED: "false",
			};

			const { diag } = await import("@opentelemetry/api");
			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			expect(diag.info).toHaveBeenCalledWith(
				"OpenTelemetry tracing initialized successfully",
			);
		});
	});
});