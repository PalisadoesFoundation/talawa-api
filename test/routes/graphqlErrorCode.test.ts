import type { FastifyInstance } from "fastify";
import {
	type ExecutionResult,
	type GraphQLFormattedError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("GraphQL Error Formatting", () => {
	// Unit test for isolated errorFormatter testing
	describe("Unit Tests - ErrorFormatter Isolation", () => {
		let mockFastifyInstance: {
			register: ReturnType<typeof vi.fn>;
			envConfig: {
				API_IS_GRAPHIQL: boolean;
				API_GRAPHQL_MUTATION_BASE_COST: number;
				API_RATE_LIMIT_BUCKET_CAPACITY: number;
				API_RATE_LIMIT_REFILL_RATE: number;
			};
			log: {
				info: ReturnType<typeof vi.fn>;
				error: ReturnType<typeof vi.fn>;
			};
			graphql: {
				replaceSchema: ReturnType<typeof vi.fn>;
				addHook: ReturnType<typeof vi.fn>;
			};
		};

		let errorFormatter: (
			execution: ExecutionResult,
			context: unknown,
		) => {
			statusCode: number;
			response: { data: unknown; errors?: GraphQLFormattedError[] };
		};

		beforeEach(async () => {
			// Isolated unit test for errorFormatter internal logic
			// This is needed to test specific error formatting behavior without full GraphQL execution
			vi.mock("~/src/graphql/schemaManager", () => ({
				default: {
					buildInitialSchema: vi.fn(),
					onSchemaUpdate: vi.fn(),
					setLogger: vi.fn(),
				},
			}));

			mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: true,
					API_GRAPHQL_MUTATION_BASE_COST: 10,
					API_RATE_LIMIT_BUCKET_CAPACITY: 100,
					API_RATE_LIMIT_REFILL_RATE: 1,
				},
				log: {
					info: vi.fn(),
					error: vi.fn(),
				},
				graphql: {
					replaceSchema: vi.fn(),
					addHook: vi.fn(),
				},
			};

			const schemaManager = await import("~/src/graphql/schemaManager");
			vi.mocked(schemaManager.default.buildInitialSchema).mockResolvedValue(
				new GraphQLSchema({
					query: new GraphQLObjectType({
						name: "Query",
						fields: { hello: { type: GraphQLString } },
					}),
				}),
			);

			const { graphql } = await import("~/src/routes/graphql");
			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Robust errorFormatter extraction - find mercurius registration by schema property
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call) => call[1]?.schema !== undefined,
			);

			if (!mercuriusCall) {
				throw new Error("Could not find mercurius registration call");
			}

			errorFormatter = mercuriusCall[1].errorFormatter;

			if (!errorFormatter) {
				throw new Error("errorFormatter not found in mercurius registration");
			}
		});

		it("should preserve TalawaGraphQLError extensions and add correlationId", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Sensitive Error",
							extensions: {
								code: ErrorCode.INTERNAL_SERVER_ERROR,
								stack: "stack trace",
								internal: "internal data",
								debug: "debug info",
								raw: "raw data",
								error: "error obj",
								secrets: "hidden",
								exception: "crash",
								safe: "safe data",
							},
						}),
					],
				},
				{
					reply: {
						request: { id: "req-1", log: { error: vi.fn() } },
					},
				},
			);

			const extensions = result.response.errors?.[0]?.extensions;
			expect(extensions).toBeDefined();
			// TalawaGraphQLError preserves all extensions, so we verify they are kept
			// and correlationId is added
			expect(extensions).toHaveProperty(
				"code",
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
			expect(extensions).toHaveProperty("correlationId", "req-1");
			expect(extensions).toHaveProperty("stack", "stack trace");
		});

		it("should correctly format multiple errors", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Error 1",
							extensions: { code: ErrorCode.NOT_FOUND },
						}),
						new TalawaGraphQLError({
							message: "Error 2",
							extensions: { code: ErrorCode.INVALID_ARGUMENTS },
						}),
					],
				},
				{
					reply: {
						request: { id: "req-multi", log: { error: vi.fn() } },
					},
				},
			);

			expect(result.response.errors).toHaveLength(2);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.NOT_FOUND,
			);
			expect(result.response.errors?.[1]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it("should map standard ErrorCode enum values preserving code", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Not Found Error",
							extensions: { code: ErrorCode.NOT_FOUND },
						}),
						new TalawaGraphQLError({
							message: "Invalid Args Error",
							extensions: { code: ErrorCode.INVALID_ARGUMENTS },
						}),
					],
				},
				{
					reply: {
						request: { id: "req-enums", log: { error: vi.fn() } },
					},
				},
			);

			const errors = result.response.errors;
			expect(errors).toBeDefined();

			const notFoundError = errors?.[0];
			expect(notFoundError?.extensions?.code).toBe(ErrorCode.NOT_FOUND);

			const invalidArgsError = errors?.[1];
			expect(invalidArgsError?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it("should include populated details field in output", () => {
			const details = { field: "username", reason: "duplicate" };
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Detailed Error",
							extensions: {
								code: ErrorCode.INVALID_INPUT,
								details,
							},
						}),
					],
				},
				{
					reply: {
						request: { id: "req-details", log: { error: vi.fn() } },
					},
				},
			);

			const error = result.response.errors?.[0];
			expect(error?.extensions?.details).toEqual(details);
		});

		it("should derive status code correctly in real HTTP context", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Error",
							locations: undefined,
							extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Error" }),
							[Symbol.toStringTag]: "Error",
						},
					],
				},
				{
					reply: {
						request: { id: "req-http", log: { error: vi.fn() } },
						send: vi.fn(), // Presence of send implies real HTTP request
					},
				},
			);

			// Should always be 200 for GraphQL over HTTP
			expect(result.statusCode).toBe(200);
		});

		it("should use pre-set correlationId and log in subscription context", () => {
			const correlationId = "sub-123456";
			const logErrorSpy = vi.fn();
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Sub Error",
							extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
						}),
					],
				},
				{
					// Subscription context (no reply)
					correlationId,
					log: { error: logErrorSpy },
				},
			);

			const error = result.response.errors?.[0];
			expect(error?.extensions?.correlationId).toBe(correlationId);
			expect(logErrorSpy).toHaveBeenCalled();
			expect(logErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId,
					msg: "GraphQL error",
				}),
			);
		});

		it("should call structured logging with correlationId and errors", () => {
			const logErrorSpy = vi.fn();
			errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Log Test Error",
							extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
						}),
					],
				},
				{
					reply: {
						request: { id: "req-log-test", log: { error: logErrorSpy } },
					},
				},
			);

			expect(logErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					correlationId: "req-log-test",
					msg: "GraphQL error",
					errors: expect.arrayContaining([
						expect.objectContaining({
							message: "Log Test Error",
							code: ErrorCode.INTERNAL_SERVER_ERROR,
						}),
					]),
				}),
			);
		});
	});
});
