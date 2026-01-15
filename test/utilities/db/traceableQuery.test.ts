import { type Span, SpanStatusCode } from "@opentelemetry/api";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

describe("traceableQuery", () => {
	let mockSpan: {
		setAttribute: Mock;
		recordException: Mock;
		setStatus: Mock;
		end: Mock;
	};
	let mockTracer: {
		startActiveSpan: Mock;
	};

	beforeEach(() => {
		vi.resetModules();
		mockSpan = {
			setAttribute: vi.fn(),
			recordException: vi.fn(),
			setStatus: vi.fn(),
			end: vi.fn(),
		};
		mockTracer = {
			startActiveSpan: vi
				.fn()
				.mockImplementation(
					(_name: string, fn: (span: Span) => Promise<unknown>) => {
						return fn(mockSpan as unknown as Span);
					},
				),
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("when observability is enabled", () => {
		beforeEach(async () => {
			vi.doMock("~/src/config/observability", () => ({
				observabilityConfig: {
					enabled: true,
					serviceName: "talawa-api",
				},
			}));
			const mockGetTracer = vi.fn().mockReturnValue(mockTracer);
			const originalOtel = await vi.importActual<
				typeof import("@opentelemetry/api")
			>("@opentelemetry/api");
			vi.doMock("@opentelemetry/api", () => ({
				trace: {
					getTracer: mockGetTracer,
				},
				SpanStatusCode: originalOtel.SpanStatusCode,
			}));
		});

		it("should create a span with correct name and attributes", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");

			const result = await traceable("users", "batchLoad", async () => {
				return [{ id: "1", name: "Test User" }];
			});

			expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
				"db:users.batchLoad",
				expect.any(Function),
			);
			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"db.system",
				"postgresql",
			);
			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"db.operation",
				"batchLoad",
			);
			expect(mockSpan.setAttribute).toHaveBeenCalledWith("db.model", "users");
			expect(mockSpan.end).toHaveBeenCalled();
			expect(result).toEqual([{ id: "1", name: "Test User" }]);
		});

		it("should record exception on failure", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");
			const testError = new Error("Database connection failed");

			await expect(
				traceable("organizations", "findById", async () => {
					throw testError;
				}),
			).rejects.toThrow("Database connection failed");

			expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
				"db:organizations.findById",
				expect.any(Function),
			);
			expect(mockSpan.recordException).toHaveBeenCalledWith(testError);
			expect(mockSpan.setStatus).toHaveBeenCalledWith({
				code: SpanStatusCode.ERROR,
				message: testError.message,
			});

			const result = await traceable("events", "create", async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { id: "event-1", title: "Test Event" };
			});

			expect(result).toEqual({ id: "event-1", title: "Test Event" });
			expect(mockSpan.end).toHaveBeenCalled();
		});

		it("should work with different model and operation names", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");

			await traceable("actionItems", "delete", async () => {
				return { deleted: true };
			});

			expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
				"db:actionItems.delete",
				expect.any(Function),
			);
			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"db.model",
				"actionItems",
			);
			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"db.operation",
				"delete",
			);
		});

		it("should wrap non-Error exceptions properly", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");

			await expect(
				traceable("users", "update", async () => {
					throw "string error";
				}),
			).rejects.toThrow("string error");

			expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));		expect(mockSpan.setStatus).toHaveBeenCalledWith({
			code: SpanStatusCode.ERROR,
			message: "string error",
		});		});
	});

	describe("when observability is disabled", () => {
		let getTracerSpy: Mock | undefined;

		beforeEach(async () => {
			vi.doMock("~/src/config/observability", () => ({
				observabilityConfig: {
					enabled: false,
				},
			}));

			// Spy on the OpenTelemetry entry point to verify it's not called when disabled
			const otelApi = await import("@opentelemetry/api");
			getTracerSpy = vi.spyOn(otelApi.trace, "getTracer") as Mock;
		});

		it("should execute the function without creating spans", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");

			const result = await traceable("users", "batchLoad", async () => {
				return [{ id: "1", name: "Test User" }];
			});

			expect(result).toEqual([{ id: "1", name: "Test User" }]);
			// Verify OpenTelemetry tracer is never obtained when observability is disabled
			expect(getTracerSpy).not.toHaveBeenCalled();
		});

		it("should propagate errors without span handling", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");
			const testError = new Error("DB error");

			await expect(
				traceable("organizations", "update", async () => {
					throw testError;
				}),
			).rejects.toThrow("DB error");

			// Verify no tracing infrastructure is used when disabled
			expect(getTracerSpy).not.toHaveBeenCalled();
			expect(mockSpan.recordException).not.toHaveBeenCalled();
			expect(mockSpan.end).not.toHaveBeenCalled();
		});
	});
});
