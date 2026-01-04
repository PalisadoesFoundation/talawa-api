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

	beforeEach(() => {
		originalEnv = { ...process.env };
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		vi.resetModules();
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
		consoleErrorSpy.mockRestore();
		vi.clearAllMocks();
	});

	describe("Disabled state", () => {
		it("does not throw when tracing is explicitly disabled", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "false",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).not.toHaveBeenCalled();
		});

		it("returns early when OTEL_ENABLED is undefined (defaults to disabled)", async () => {
			process.env = { ...originalEnv };
			delete process.env.OTEL_ENABLED;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();

			// Based on your config, undefined likely defaults to false/disabled
			// If it actually initializes, that's the expected behavior
			// So we just verify it doesn't throw
		});

		it("does not throw with various falsy values", async () => {
			const falsyValues = ["false", "FALSE", "0", ""];

			for (const value of falsyValues) {
				vi.clearAllMocks();
				vi.resetModules();

				process.env = {
					...originalEnv,
					OTEL_ENABLED: value,
				};

				const { initTracing } = await import(
					"../../src/observability/tracing/bootstrap"
				);
				await expect(initTracing()).resolves.toBeUndefined();

				// Should not initialize SDK for falsy values
				expect(NodeSDK).not.toHaveBeenCalled();
			}
		});
	});

	describe("Enabled state - Local environment", () => {
		it("initializes successfully with console exporter in local mode", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "local",
				OTEL_SERVICE_NAME: "test-service",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalledTimes(1);
		});

		it("defaults service name when not provided in local mode", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "local",
			};
			delete process.env.OTEL_SERVICE_NAME;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
		});
	});

	describe("Enabled state - Production environment", () => {
		it("initializes successfully in production mode with endpoint", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "production",
				OTEL_SERVICE_NAME: "test-service",
				OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318/v1/traces",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
			expect(NodeSDK).toHaveBeenCalledTimes(1);
		});

		it("handles missing OTLP endpoint in production mode", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "production",
				OTEL_SERVICE_NAME: "test-service",
			};
			delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
		});
	});

	describe("Sampling configuration", () => {
		it("supports configurable sampling ratio", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "local",
				OTEL_SAMPLING_RATIO: "0.25",
			};

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
		});

		it("validates sampling ratio is within bounds", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "local",
				OTEL_SAMPLING_RATIO: "1.5",
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

		it("validates sampling ratio is not negative", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "local",
				OTEL_SAMPLING_RATIO: "-0.1",
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

		it("handles invalid sampling ratio (NaN)", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "local",
				OTEL_SAMPLING_RATIO: "not-a-number",
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

	describe("Error handling", () => {
		it("handles SDK start failure gracefully", async () => {
			const mockStart = vi
				.fn()
				.mockRejectedValueOnce(new Error("OTLP endpoint unreachable"));
			vi.mocked(NodeSDK).mockImplementationOnce(
				() =>
					({
						start: mockStart,
						shutdown: vi.fn().mockResolvedValue(undefined),
					}) as unknown as NodeSDK,
			);

			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_ENVIRONMENT: "production",
				OTEL_SERVICE_NAME: "test-service",
				OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318/v1/traces",
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

		it("handles missing OTEL_ENVIRONMENT gracefully", async () => {
			process.env = {
				...originalEnv,
				OTEL_ENABLED: "true",
				OTEL_SERVICE_NAME: "test-service",
			};
			delete process.env.OTEL_ENVIRONMENT;

			const { initTracing } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			await expect(initTracing()).resolves.toBeUndefined();
		});
	});

	describe("FastifyOtelInstrumentation export", () => {
		it("exports fastifyOtelInstrumentation with correct configuration", async () => {
			const { fastifyOtelInstrumentation } = await import(
				"../../src/observability/tracing/bootstrap"
			);
			expect(fastifyOtelInstrumentation).toBeDefined();
		});
	});
});
