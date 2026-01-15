import type { Span } from "@opentelemetry/api";
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
		beforeEach(() => {
			vi.doMock("~/src/config/observability", () => ({
				observabilityConfig: {
					enabled: true,
				},
			}));
			vi.doMock("@opentelemetry/api", () => ({
				trace: {
					getTracer: vi.fn().mockReturnValue(mockTracer),
				},
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
			expect(mockSpan.end).toHaveBeenCalled();
		});

		it("should handle async operations correctly", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");

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

			expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe("when observability is disabled", () => {
		beforeEach(() => {
			vi.doMock("~/src/config/observability", () => ({
				observabilityConfig: {
					enabled: false,
				},
			}));
		});

		it("should execute the function without creating spans", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");

			const result = await traceable("users", "batchLoad", async () => {
				return [{ id: "1", name: "Test User" }];
			});

			expect(result).toEqual([{ id: "1", name: "Test User" }]);
			// mockTracer.startActiveSpan should not be called when disabled
			expect(mockTracer.startActiveSpan).not.toHaveBeenCalled();
		});

		it("should propagate errors without span handling", async () => {
			const { traceable } = await import("~/src/utilities/db/traceableQuery");
			const testError = new Error("DB error");

			await expect(
				traceable("organizations", "update", async () => {
					throw testError;
				}),
			).rejects.toThrow("DB error");

			expect(mockSpan.recordException).not.toHaveBeenCalled();
			expect(mockSpan.end).not.toHaveBeenCalled();
		});
	});
});
