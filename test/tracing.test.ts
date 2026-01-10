import { beforeEach, describe, expect, it, vi } from "vitest";

describe("tracing.ts", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("calls initTracing on module load", async () => {
		const initTracingMock = vi.fn().mockResolvedValue(undefined);

		vi.doMock("../src/observability/tracing/bootstrap", () => ({
			initTracing: initTracingMock,
			fastifyOtelInstrumentation: { name: "otel-plugin" },
		}));

		const module = await import("../src/tracing");

		expect(initTracingMock).toHaveBeenCalledOnce();
		expect(module.fastifyOtelInstrumentation).toEqual({
			name: "otel-plugin",
		});
	});

	it("logs error and continues when initTracing throws", async () => {
		const error = new Error("boom");

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		vi.doMock("../src/observability/tracing/bootstrap", () => ({
			initTracing: vi.fn().mockRejectedValue(error),
			fastifyOtelInstrumentation: {},
		}));

		await import("../src/tracing");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Failed to initialize tracing, continuing without observability:",
			error,
		);

		consoleErrorSpy.mockRestore();
	});
});
