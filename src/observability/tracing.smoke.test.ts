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

vi.mock("@opentelemetry/exporter-trace-otlp-http", () => ({
	OTLPTraceExporter: vi.fn(),
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
		vi.useRealTimers(); // Ensure timers are reset after each test
	});

	describe("Disabled state", () => {
		it("does not initialize SDK when API_OTEL_ENABLED is false", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "false",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).not.toHaveBeenCalled();
		});
	});

	describe("Enabled state - Local environment", () => {
		it("initializes SDK successfully in local mode", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
				API_OTEL_SERVICE_NAME: "test-service",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalledTimes(1);
		});
	});

	describe("Enabled state - Production environment", () => {
		it("initializes SDK with OTLP exporter in production", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "production",
				API_OTEL_SERVICE_NAME: "test-service",
				API_OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318/v1/traces",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalledTimes(1);
		});
	});

	describe("Sampling configuration", () => {
		it("accepts valid sampling ratio", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
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
				API_OTEL_ENVIRONMENT: "local",
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
				API_OTEL_ENVIRONMENT: "local",
				API_OTEL_SAMPLING_RATIO: "-0.1",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await expect(initTracing()).rejects.toThrow(/Invalid samplingRatio/);
		});

		it("rejects non-numeric sampling ratio", async () => {
			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
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
				API_OTEL_ENVIRONMENT: "production",
				API_OTEL_SERVICE_NAME: "test-service",
				API_OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318/v1/traces",
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

			// Import without initializing
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

			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
			};

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

			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
			};

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

			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
			};

			const { initTracing, shutdownTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);

			await initTracing();

			// Start the shutdown promise and catch rejections immediately
			const shutdownPromise = shutdownTracing().catch((err) => err);

			// Fast-forward time to trigger timeout
			await vi.advanceTimersByTimeAsync(5001);

			// Verify the promise rejected with timeout error
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

			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
			};

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

			process.env = {
				...originalEnv,
				API_OTEL_ENABLED: "true",
				API_OTEL_ENVIRONMENT: "local",
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
				API_OTEL_ENVIRONMENT: "local",
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
				API_OTEL_ENVIRONMENT: "local",
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
				API_OTEL_ENVIRONMENT: "local",
			};
			delete process.env.API_OTEL_SAMPLING_RATIO;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalled();
		});
	});
});
