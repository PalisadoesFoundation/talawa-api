import type { FastifyInstance } from "fastify";
import type { GraphQLSchema } from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock observability config
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
	startSpan: vi.fn(() => mockSpan),
	startActiveSpan: vi.fn(
		(
			_name: string,
			fn: (span: typeof mockSpan) => Promise<unknown>,
		): Promise<unknown> => {
			return fn(mockSpan);
		},
	),
};

vi.mock("@opentelemetry/api", () => ({
	trace: {
		getTracer: vi.fn(() => mockTracer),
	},
}));

// Mock other dependencies
vi.mock("@pothos/plugin-complexity", () => ({
	complexityFromQuery: vi.fn().mockReturnValue({ complexity: 10 }),
}));

vi.mock("~/src/graphql/schemaManager", () => ({
	default: {
		buildInitialSchema: vi.fn().mockResolvedValue({}),
		onSchemaUpdate: vi.fn(),
	},
}));

vi.mock("~/src/utilities/leakyBucket", () => ({
	default: vi.fn().mockResolvedValue(true),
}));

vi.mock("mercurius", () => ({
	mercurius: vi.fn().mockImplementation(async () => {}),
}));

vi.mock("mercurius-upload", () => ({
	mercuriusUpload: vi.fn().mockImplementation(async () => {}),
}));

describe("GraphQL Tracing Hooks", () => {
	let mockFastifyInstance: Partial<FastifyInstance>;
	let preExecutionHooks: Array<
		(
			schema: GraphQLSchema,
			document: {
				definitions: Array<{
					kind: string;
					operation?: string;
					name?: { value: string };
				}>;
			},
			context: Record<string, unknown>,
		) => Promise<void>
	>;
	let onResolutionHooks: Array<
		(
			execution: { errors?: Array<unknown> },
			context: Record<string, unknown>,
		) => Promise<void>
	>;

	beforeEach(async () => {
		vi.clearAllMocks();
		preExecutionHooks = [];
		onResolutionHooks = [];

		mockFastifyInstance = {
			register: vi.fn(),
			log: {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
			} as unknown as FastifyInstance["log"],
			graphql: {
				addHook: vi
					.fn()
					.mockImplementation((hookName: string, hookFn: unknown) => {
						if (hookName === "preExecution") {
							preExecutionHooks.push(hookFn as (typeof preExecutionHooks)[0]);
						} else if (hookName === "onResolution") {
							onResolutionHooks.push(hookFn as (typeof onResolutionHooks)[0]);
						}
					}),
				replaceSchema: vi.fn(),
			} as unknown as FastifyInstance["graphql"],
			envConfig: {
				API_IS_GRAPHIQL: false,
				API_GRAPHQL_MUTATION_BASE_COST: 10,
				API_RATE_LIMIT_BUCKET_CAPACITY: 100,
				API_RATE_LIMIT_REFILL_RATE: 1,
			} as unknown as FastifyInstance["envConfig"],
			drizzleClient: {} as FastifyInstance["drizzleClient"],
			cache: null as unknown as FastifyInstance["cache"],
			minio: {} as FastifyInstance["minio"],
			jwt: {
				sign: vi.fn(),
				verify: vi.fn(),
			} as unknown as FastifyInstance["jwt"],
		};

		// Import and execute the graphql plugin to register hooks
		const { graphql } = await import("~/src/routes/graphql");
		await graphql(mockFastifyInstance as FastifyInstance);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("preExecution hook - tracing", () => {
		it("should create a span with graphql: prefix and operation name", async () => {
			const mockDocument = {
				definitions: [
					{
						kind: "OperationDefinition",
						operation: "query",
						name: { value: "GetUser" },
					},
				],
			};

			const context: Record<string, unknown> = {};

			// Find the tracing preExecution hook (first one added when observability is enabled)
			const tracingPreExecutionHook = preExecutionHooks[0];
			expect(tracingPreExecutionHook).toBeDefined();

			await tracingPreExecutionHook?.(
				{} as GraphQLSchema,
				mockDocument,
				context,
			);

			expect(mockTracer.startSpan).toHaveBeenCalledWith("graphql:GetUser");
		});

		it("should set graphql.operation.name attribute", async () => {
			const mockDocument = {
				definitions: [
					{
						kind: "OperationDefinition",
						operation: "mutation",
						name: { value: "CreateUser" },
					},
				],
			};

			const context: Record<string, unknown> = {};
			const tracingPreExecutionHook = preExecutionHooks[0];

			await tracingPreExecutionHook?.(
				{} as GraphQLSchema,
				mockDocument,
				context,
			);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"graphql.operation.name",
				"CreateUser",
			);
		});

		it("should set graphql.operation.type attribute", async () => {
			const mockDocument = {
				definitions: [
					{
						kind: "OperationDefinition",
						operation: "mutation",
						name: { value: "DeleteUser" },
					},
				],
			};

			const context: Record<string, unknown> = {};
			const tracingPreExecutionHook = preExecutionHooks[0];

			await tracingPreExecutionHook?.(
				{} as GraphQLSchema,
				mockDocument,
				context,
			);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"graphql.operation.type",
				"mutation",
			);
		});

		it("should use 'anonymous' for operations without a name", async () => {
			const mockDocument = {
				definitions: [
					{
						kind: "OperationDefinition",
						operation: "query",
						// No name property
					},
				],
			};

			const context: Record<string, unknown> = {};
			const tracingPreExecutionHook = preExecutionHooks[0];

			await tracingPreExecutionHook?.(
				{} as GraphQLSchema,
				mockDocument,
				context,
			);

			expect(mockTracer.startSpan).toHaveBeenCalledWith("graphql:anonymous");
			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"graphql.operation.name",
				"anonymous",
			);
		});

		it("should store span on context for later cleanup", async () => {
			const mockDocument = {
				definitions: [
					{
						kind: "OperationDefinition",
						operation: "query",
						name: { value: "GetEvents" },
					},
				],
			};

			const context: Record<string, unknown> = {};
			const tracingPreExecutionHook = preExecutionHooks[0];

			await tracingPreExecutionHook?.(
				{} as GraphQLSchema,
				mockDocument,
				context,
			);

			expect(context._tracingSpan).toBe(mockSpan);
		});
	});

	describe("onResolution hook - tracing", () => {
		it("should end the span on resolution", async () => {
			const context: Record<string, unknown> = {
				_tracingSpan: mockSpan,
			};

			const onResolutionHook = onResolutionHooks[0];
			expect(onResolutionHook).toBeDefined();

			await onResolutionHook?.({ errors: [] }, context);

			expect(mockSpan.end).toHaveBeenCalled();
		});

		it("should set graphql.errors.count when errors exist", async () => {
			const context: Record<string, unknown> = {
				_tracingSpan: mockSpan,
			};

			const errors = [new Error("Error 1"), new Error("Error 2")];
			const onResolutionHook = onResolutionHooks[0];

			await onResolutionHook?.({ errors }, context);

			expect(mockSpan.setAttribute).toHaveBeenCalledWith(
				"graphql.errors.count",
				2,
			);
		});

		it("should not set errors count when no errors", async () => {
			const context: Record<string, unknown> = {
				_tracingSpan: mockSpan,
			};

			// Reset to track only onResolution calls
			mockSpan.setAttribute.mockClear();

			const onResolutionHook = onResolutionHooks[0];
			await onResolutionHook?.({ errors: [] }, context);

			// Should not call setAttribute for errors.count
			expect(mockSpan.setAttribute).not.toHaveBeenCalledWith(
				"graphql.errors.count",
				expect.any(Number),
			);
		});

		it("should handle missing span gracefully", async () => {
			const context: Record<string, unknown> = {};
			const onResolutionHook = onResolutionHooks[0];

			// Should not throw
			await expect(
				onResolutionHook?.({ errors: [] }, context),
			).resolves.toBeUndefined();
		});
	});

	describe("PII safety", () => {
		it("should not include query document in span attributes", async () => {
			const mockDocument = {
				definitions: [
					{
						kind: "OperationDefinition",
						operation: "query",
						name: { value: "GetUser" },
					},
				],
			};

			const context: Record<string, unknown> = {};
			const tracingPreExecutionHook = preExecutionHooks[0];

			await tracingPreExecutionHook?.(
				{} as GraphQLSchema,
				mockDocument,
				context,
			);

			const setAttributeCalls = mockSpan.setAttribute.mock.calls;
			const attributeNames = setAttributeCalls.map((call) => call[0]);

			// Should only have safe attributes
			expect(attributeNames).toContain("graphql.operation.name");
			expect(attributeNames).toContain("graphql.operation.type");

			// Should NOT include document or variables
			expect(attributeNames).not.toContain("graphql.document");
			expect(attributeNames).not.toContain("graphql.query");
			expect(attributeNames).not.toContain("graphql.variables");
		});

		it("should not include error messages in span attributes", async () => {
			const context: Record<string, unknown> = {
				_tracingSpan: mockSpan,
			};

			const errors = [
				new Error("User email@secret.com not found"),
				new Error("Password validation failed"),
			];

			const onResolutionHook = onResolutionHooks[0];
			await onResolutionHook?.({ errors }, context);

			const setAttributeCalls = mockSpan.setAttribute.mock.calls;
			const attributeValues = setAttributeCalls.flatMap((call) =>
				typeof call[1] === "string" ? [call[1]] : [],
			);

			// Should not include error messages
			expect(attributeValues).not.toContain("User email@secret.com not found");
			expect(attributeValues).not.toContain("Password validation failed");
		});
	});
});

describe("GraphQL Tracing Hooks - disabled observability", () => {
	let mockFastifyInstance: Partial<FastifyInstance>;
	let preExecutionHooks: Array<
		(
			schema: GraphQLSchema,
			document: {
				definitions: Array<{
					kind: string;
					operation?: string;
					name?: { value: string };
				}>;
			},
			context: Record<string, unknown>,
		) => Promise<void>
	>;
	let onResolutionHooks: Array<
		(
			execution: { errors?: Array<unknown> },
			context: Record<string, unknown>,
		) => Promise<void>
	>;

	beforeEach(async () => {
		vi.resetModules();

		// Mock observability as disabled
		vi.doMock("~/src/config/observability", () => ({
			observabilityConfig: {
				enabled: false,
				environment: "test",
				serviceName: "talawa-api-test",
				samplingRatio: 1,
				otlpEndpoint: "http://localhost:4318/v1/traces",
			},
		}));

		// Re-mock other dependencies after module reset
		vi.doMock("@opentelemetry/api", () => ({
			trace: {
				getTracer: vi.fn(() => ({
					startSpan: vi.fn(),
					startActiveSpan: vi.fn(),
				})),
			},
		}));

		vi.doMock("@pothos/plugin-complexity", () => ({
			complexityFromQuery: vi.fn().mockReturnValue({ complexity: 10 }),
		}));

		vi.doMock("~/src/graphql/schemaManager", () => ({
			default: {
				buildInitialSchema: vi.fn().mockResolvedValue({}),
				onSchemaUpdate: vi.fn(),
			},
		}));

		vi.doMock("~/src/utilities/leakyBucket", () => ({
			default: vi.fn().mockResolvedValue(true),
		}));

		vi.doMock("mercurius", () => ({
			mercurius: vi.fn().mockImplementation(async () => {}),
		}));

		vi.doMock("mercurius-upload", () => ({
			mercuriusUpload: vi.fn().mockImplementation(async () => {}),
		}));

		preExecutionHooks = [];
		onResolutionHooks = [];

		mockFastifyInstance = {
			register: vi.fn(),
			log: {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
			} as unknown as FastifyInstance["log"],
			graphql: {
				addHook: vi
					.fn()
					.mockImplementation((hookName: string, hookFn: unknown) => {
						if (hookName === "preExecution") {
							preExecutionHooks.push(hookFn as (typeof preExecutionHooks)[0]);
						} else if (hookName === "onResolution") {
							onResolutionHooks.push(hookFn as (typeof onResolutionHooks)[0]);
						}
					}),
				replaceSchema: vi.fn(),
			} as unknown as FastifyInstance["graphql"],
			envConfig: {
				API_IS_GRAPHIQL: false,
				API_GRAPHQL_MUTATION_BASE_COST: 10,
				API_RATE_LIMIT_BUCKET_CAPACITY: 100,
				API_RATE_LIMIT_REFILL_RATE: 1,
			} as unknown as FastifyInstance["envConfig"],
			drizzleClient: {} as FastifyInstance["drizzleClient"],
			cache: null as unknown as FastifyInstance["cache"],
			minio: {} as FastifyInstance["minio"],
			jwt: {
				sign: vi.fn(),
				verify: vi.fn(),
			} as unknown as FastifyInstance["jwt"],
		};

		// Import and execute the graphql plugin with disabled observability
		const { graphql } = await import("~/src/routes/graphql");
		await graphql(mockFastifyInstance as FastifyInstance);
	});

	afterEach(() => {
		vi.doUnmock("~/src/config/observability");
		vi.doUnmock("@opentelemetry/api");
		vi.doUnmock("@pothos/plugin-complexity");
		vi.doUnmock("~/src/graphql/schemaManager");
		vi.doUnmock("~/src/utilities/leakyBucket");
		vi.doUnmock("mercurius");
		vi.doUnmock("mercurius-upload");
		vi.clearAllMocks();
	});

	it("should not register tracing hooks when observability is disabled", async () => {
		// When observability is disabled, only the complexity/rate-limiting preExecution hook
		// should be registered (1 hook), not the tracing hooks
		// The tracing hooks add: 1 preExecution + 1 onResolution
		// So with tracing enabled: 2 preExecution hooks, 1 onResolution hook
		// With tracing disabled: 1 preExecution hook (complexity), 0 onResolution hooks

		// Verify no onResolution hooks are registered (tracing adds this)
		expect(onResolutionHooks).toHaveLength(0);

		// Verify only 1 preExecution hook (complexity/rate-limiting, not tracing)
		expect(preExecutionHooks).toHaveLength(1);
	});
});
