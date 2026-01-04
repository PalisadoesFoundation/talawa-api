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
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.INTERNAL_SERVER_ERROR,
					},
					message: "Could not find mercurius registration call",
				});
			}

			errorFormatter = mercuriusCall[1].errorFormatter;

			if (!errorFormatter) {
				throw new TalawaGraphQLError({
					extensions: {
						code: ErrorCode.INTERNAL_SERVER_ERROR,
					},
					message: "errorFormatter not found in mercurius registration",
				});
			}
		});

		it("should remove sensitive extension keys", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Sensitive Error",
							locations: undefined,
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
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: ["test"],
							toJSON: () => ({ message: "Sensitive Error" }),
							[Symbol.toStringTag]: "Error",
						},
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
			expect(extensions).not.toHaveProperty("stack");
			expect(extensions).not.toHaveProperty("internal");
			expect(extensions).not.toHaveProperty("debug");
			expect(extensions).not.toHaveProperty("raw");
			expect(extensions).not.toHaveProperty("error");
			expect(extensions).not.toHaveProperty("secrets");
			expect(extensions).not.toHaveProperty("exception");
			expect(extensions).toHaveProperty("safe", "safe data");
		});

		it("should correctly format multiple errors", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Error 1",
							locations: undefined,
							extensions: { code: ErrorCode.NOT_FOUND },
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Error 1" }),
							[Symbol.toStringTag]: "Error",
						},
						{
							message: "Error 2",
							locations: undefined,
							extensions: { code: ErrorCode.INVALID_ARGUMENTS },
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Error 2" }),
							[Symbol.toStringTag]: "Error",
						},
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

		it("should map standard ErrorCode enum values preserving code and setting httpStatus", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Not Found Error",
							locations: undefined,
							extensions: { code: ErrorCode.NOT_FOUND },
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Not Found Error" }),
							[Symbol.toStringTag]: "Error",
						},
						{
							message: "Invalid Args Error",
							locations: undefined,
							extensions: { code: ErrorCode.INVALID_ARGUMENTS },
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Invalid Args Error" }),
							[Symbol.toStringTag]: "Error",
						},
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
			expect(notFoundError?.extensions?.httpStatus).toBe(404);

			const invalidArgsError = errors?.[1];
			expect(invalidArgsError?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
			expect(invalidArgsError?.extensions?.httpStatus).toBe(400);
		});

		it("should include populated details field in output", () => {
			const details = { field: "username", reason: "duplicate" };
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Detailed Error",
							locations: undefined,
							extensions: {
								code: ErrorCode.INVALID_INPUT,
								details,
							},
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Detailed Error" }),
							[Symbol.toStringTag]: "Error",
						},
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
						{
							message: "Sub Error",
							locations: undefined,
							extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Sub Error" }),
							[Symbol.toStringTag]: "Error",
						},
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

		it("should call structured logging with correlationId, statusCode, and errors", () => {
			const logErrorSpy = vi.fn();
			errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Log Test Error",
							locations: undefined,
							extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
							name: "Error",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							path: undefined,
							toJSON: () => ({ message: "Log Test Error" }),
							[Symbol.toStringTag]: "Error",
						},
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
					statusCode: 500, // Non-HTTP context falls back to error status
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
