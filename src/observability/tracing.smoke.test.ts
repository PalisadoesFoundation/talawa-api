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

describe("OTEL bootstrap smoke tests", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		vi.resetModules();
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.clearAllMocks();
	});

	it("does not throw when tracing is disabled", async () => {
		process.env = {
			...originalEnv,
			OTEL_ENABLED: "false",
		};

		const { initTracing } = await import(
			"../../src/observability/tracing/bootstrap"
		);

		await expect(initTracing()).resolves.toBeUndefined();
	});

	it("does not crash when OTEL_ENABLED is undefined", async () => {
		process.env = { ...originalEnv };
		delete process.env.OTEL_ENABLED;

		const { initTracing } = await import(
			"../../src/observability/tracing/bootstrap"
		);

		await expect(initTracing()).resolves.toBeUndefined();
	});

	it("initializes successfully when enabled in local mode", async () => {
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
	});

	it("initializes successfully when enabled in production mode with endpoint", async () => {
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

	it("defaults service name when not provided", async () => {
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

	it("should handle SDK start failure gracefully", async () => {
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

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(initTracing()).resolves.toBeUndefined();

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Failed to initialize OpenTelemetry"),
			expect.any(Error),
		);

		consoleErrorSpy.mockRestore();
	});
});
