import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock observability config - must be before importing the module under test
vi.mock("~/src/config/observability", () => ({
	observabilityConfig: {
		enabled: true,
		environment: "test",
		serviceName: "talawa-api-test",
		samplingRatio: 1,
		otlpEndpoint: "http://localhost:4318/v1/traces",
	},
}));

// Mock OpenTelemetry trace API
const mockSpan = {
	setAttribute: vi.fn(),
	recordException: vi.fn(),
	end: vi.fn(),
};

const mockTracer = {
	startActiveSpan: vi.fn(
		(
			_name: string,
			fn: (span: typeof mockSpan) => Promise<unknown>,
		): Promise<unknown> => {
			return fn(mockSpan);
		},
	),
	startSpan: vi.fn(() => mockSpan),
};

vi.mock("@opentelemetry/api", () => ({
	trace: {
		getTracer: vi.fn(() => mockTracer),
	},
}));

import { wrapBatchWithTracing } from "~/src/utilities/dataloaders/wrapBatchWithTracing";

describe("wrapBatchWithTracing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create a span with correct name for dataloader batch", async () => {
		const mockBatchFn = vi.fn().mockResolvedValue(["result1", "result2"]);
		const wrappedBatch = wrapBatchWithTracing("users", mockBatchFn);

		await wrappedBatch(["key1", "key2"]);

		expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
			"dataloader:users",
			expect.any(Function),
		);
	});

	it("should set dataloader.name attribute", async () => {
		const mockBatchFn = vi.fn().mockResolvedValue(["result1"]);
		const wrappedBatch = wrapBatchWithTracing("organizations", mockBatchFn);

		await wrappedBatch(["key1"]);

		expect(mockSpan.setAttribute).toHaveBeenCalledWith(
			"dataloader.name",
			"organizations",
		);
	});

	it("should set dataloader.keys.count attribute", async () => {
		const mockBatchFn = vi.fn().mockResolvedValue([null, null, null]);
		const wrappedBatch = wrapBatchWithTracing("events", mockBatchFn);

		await wrappedBatch(["key1", "key2", "key3"]);

		expect(mockSpan.setAttribute).toHaveBeenCalledWith(
			"dataloader.keys.count",
			3,
		);
	});

	it("should call the original batch function with keys", async () => {
		const mockBatchFn = vi.fn().mockResolvedValue(["result1", "result2"]);
		const wrappedBatch = wrapBatchWithTracing("users", mockBatchFn);

		const keys = ["key1", "key2"];
		await wrappedBatch(keys);

		expect(mockBatchFn).toHaveBeenCalledWith(keys);
	});

	it("should return the result from the batch function", async () => {
		const expectedResults = [{ id: "1" }, { id: "2" }];
		const mockBatchFn = vi.fn().mockResolvedValue(expectedResults);
		const wrappedBatch = wrapBatchWithTracing("users", mockBatchFn);

		const result = await wrappedBatch(["key1", "key2"]);

		expect(result).toEqual(expectedResults);
	});

	it("should end the span after successful execution", async () => {
		const mockBatchFn = vi.fn().mockResolvedValue(["result1"]);
		const wrappedBatch = wrapBatchWithTracing("users", mockBatchFn);

		await wrappedBatch(["key1"]);

		expect(mockSpan.end).toHaveBeenCalled();
	});

	it("should record exception and end span when batch function throws", async () => {
		const error = new Error("Database connection failed");
		const mockBatchFn = vi.fn().mockRejectedValue(error);
		const wrappedBatch = wrapBatchWithTracing("users", mockBatchFn);

		await expect(wrappedBatch(["key1"])).rejects.toThrow(
			"Database connection failed",
		);

		expect(mockSpan.recordException).toHaveBeenCalledWith(error);
		expect(mockSpan.end).toHaveBeenCalled();
	});

	it("should convert non-Error exceptions to Error objects", async () => {
		const mockBatchFn = vi.fn().mockRejectedValue("string error");
		const wrappedBatch = wrapBatchWithTracing("users", mockBatchFn);

		await expect(wrappedBatch(["key1"])).rejects.toThrow();

		expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
	});

	it("should not include PII in span attributes", async () => {
		const mockBatchFn = vi
			.fn()
			.mockResolvedValue([{ id: "user-123", email: "test@example.com" }]);
		const wrappedBatch = wrapBatchWithTracing("users", mockBatchFn);

		// Keys contain user IDs which could be considered PII
		await wrappedBatch(["user-123"]);

		// Verify we only set safe attributes
		const setAttributeCalls = mockSpan.setAttribute.mock.calls;
		const attributeNames = setAttributeCalls.map((call) => call[0]);

		// Should only have these safe attributes
		expect(attributeNames).toContain("dataloader.name");
		expect(attributeNames).toContain("dataloader.keys.count");

		// Should NOT include the actual keys or values
		expect(attributeNames).not.toContain("dataloader.keys");
		expect(attributeNames).not.toContain("dataloader.results");
	});
});

describe("wrapBatchWithTracing - disabled observability", () => {
	beforeEach(async () => {
		vi.clearAllMocks();

		// Reset module to test disabled config
		vi.doMock("~/src/config/observability", () => ({
			observabilityConfig: {
				enabled: false,
				environment: "test",
				serviceName: "talawa-api-test",
				samplingRatio: 1,
				otlpEndpoint: "http://localhost:4318/v1/traces",
			},
		}));
	});

	afterEach(() => {
		vi.doUnmock("~/src/config/observability");
	});

	it("should return batch function as-is when tracing is disabled", async () => {
		// Import fresh module with disabled config
		const { wrapBatchWithTracing: wrapBatchDisabled } = await import(
			"~/src/utilities/dataloaders/wrapBatchWithTracing"
		);

		const mockBatchFn = vi.fn().mockResolvedValue(["result1"]);
		const wrappedBatch = wrapBatchDisabled("users", mockBatchFn);

		// When disabled, should not create spans
		await wrappedBatch(["key1"]);

		// The original function should still be called
		expect(mockBatchFn).toHaveBeenCalledWith(["key1"]);
	});
});
