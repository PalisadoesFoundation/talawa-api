import type { FastifyInstance } from "fastify";
import {
	type ExecutionResult,
	type GraphQLError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import schemaManager from "~/src/graphql/schemaManager";
import { graphql } from "~/src/routes/graphql";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock dependencies
vi.mock("@pothos/plugin-complexity", () => ({
	complexityFromQuery: vi.fn(),
}));

vi.mock("~/src/graphql/schemaManager", () => ({
	default: {
		buildInitialSchema: vi.fn(),
		onSchemaUpdate: vi.fn(),
		setLogger: vi.fn(),
	},
}));

vi.mock("~/src/utilities/leakyBucket", () => ({
	default: vi.fn(),
}));

vi.mock("~/src/utilities/dataloaders", () => ({
	createDataloaders: vi.fn().mockReturnValue({}),
}));

vi.mock("~/src/utilities/errors/errorTransformer", () => ({
	normalizeError: vi.fn(),
}));

import { normalizeError } from "~/src/utilities/errors/errorTransformer";

describe("GraphQL Error Validation Logic", () => {
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
			child: ReturnType<typeof vi.fn>;
		};
		graphql: {
			replaceSchema: ReturnType<typeof vi.fn>;
			addHook: ReturnType<typeof vi.fn>;
		};
		drizzleClient: unknown;
		cache: unknown;
		minio: unknown;
		jwt: unknown;
	};

	let errorFormatter: (
		execution: ExecutionResult,
		context: unknown,
	) => { statusCode: number; response: ExecutionResult };

	beforeEach(async () => {
		vi.clearAllMocks();

		// Default implementation for normalizeError
		vi.mocked(normalizeError).mockReturnValue({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Internal Server Error",
			statusCode: 500,
		});

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
				child: vi.fn().mockReturnThis(),
			},
			graphql: {
				replaceSchema: vi.fn(),
				addHook: vi.fn(),
			},
			drizzleClient: {},
			cache: {},
			minio: {},
			jwt: {},
		};

		const mockSchema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: "Query",
				fields: {
					hello: {
						type: GraphQLString,
						resolve: () => "Hello World",
					},
				},
			}),
		});

		vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(mockSchema);

		// Register the plugin to capture the errorFormatter
		await graphql(mockFastifyInstance as unknown as FastifyInstance);

		// Find the mercurius registration call by checking for errorFormatter
		const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
			(call) => {
				const options = call[1];
				return (
					options && typeof options === "object" && "errorFormatter" in options
				);
			},
		);
		expect(mercuriusCall).toBeDefined();
		const mercuriusOptions = mercuriusCall?.[1];
		errorFormatter = mercuriusOptions.errorFormatter;
		expect(errorFormatter).toBeDefined();
	});

	const context = {
		reply: {
			request: {
				id: "test-req-id",
			},
		},
	};

	const assertValidationError = (errorObj: unknown) => {
		const executionResult: ExecutionResult = {
			data: null,
			errors: [errorObj as unknown as GraphQLError],
		};

		const result = errorFormatter(executionResult, context);

		expect(result.statusCode).toBe(400);
		expect(result.response.errors).toHaveLength(1);
		const formattedError = result.response.errors?.[0];

		if (!formattedError) throw new Error("Formatted error should be defined");

		expect(formattedError.extensions?.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(formattedError.extensions?.httpStatus).toBe(400);
		expect(formattedError.extensions?.correlationId).toBe("test-req-id");
		expect(formattedError.locations).toEqual(
			(errorObj as unknown as GraphQLError).locations,
		);
		expect(formattedError.path).toEqual(
			(errorObj as unknown as GraphQLError).path,
		);
	};

	it("should handle error with originalError.code === 'MER_ERR_GQL_VALIDATION'", () => {
		const error = {
			message: "Some internal validation error",
			originalError: {
				code: "MER_ERR_GQL_VALIDATION",
			},
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message 'Graphql validation error'", () => {
		const error = {
			message: "Graphql validation error",
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message starting with 'Cannot query field'", () => {
		const error = {
			message: "Cannot query field 'unknown' on type 'Query'",
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message containing 'Unknown query'", () => {
		const error = {
			message: 'Query "Unknown query" not found', // contrived, just needs to contain string
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message containing 'Unknown field'", () => {
		const error = {
			message: "Unknown field 'foo' on type 'Query'",
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message 'Must provide query string.'", () => {
		const error = {
			message: "Must provide query string.",
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message starting with 'Unknown argument'", () => {
		const error = {
			message: 'Unknown argument "arg" on field "hello"',
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message starting with 'Variable \"$'", () => {
		const error = {
			message: 'Variable "$var" is not defined',
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error with extensions.code === 'GRAPHQL_VALIDATION_FAILED'", () => {
		const error = {
			message: "Validation failed",
			extensions: {
				code: "GRAPHQL_VALIDATION_FAILED",
			},
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error with extensions.code === 'BAD_USER_INPUT'", () => {
		const error = {
			message: "Bad input",
			extensions: {
				code: "BAD_USER_INPUT",
			},
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error with extensions.code === 'GRAPHQL_PARSE_FAILED'", () => {
		const error = {
			message: "Parse failed",
			extensions: {
				code: "GRAPHQL_PARSE_FAILED",
			},
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should handle error message starting with 'Syntax Error:'", () => {
		const error = {
			message: "Syntax Error: Unexpected )",
			locations: [],
			path: [],
		};
		assertValidationError(error);
	});

	it("should use default fallback message when all other messages are missing", () => {
		// Force normalizeError to return undefined message to trigger the fallback
		vi.mocked(normalizeError).mockReturnValueOnce({
			code: ErrorCode.INVALID_ARGUMENTS,
			message: undefined as unknown as string,
			statusCode: 400,
		});

		const error = {
			message: undefined,
			extensions: {
				code: ErrorCode.INVALID_ARGUMENTS,
				// message undefined
			},
			locations: [],
			path: [],
		};

		const executionResult: ExecutionResult = {
			data: null,
			errors: [error as unknown as GraphQLError],
		};

		const result = errorFormatter(executionResult, context);

		expect(result.response.errors).toHaveLength(1);
		const formattedError = result.response.errors?.[0];
		expect(formattedError?.message).toBe("An error occurred");
		expect(formattedError?.extensions?.code).toBe(ErrorCode.INVALID_ARGUMENTS);
	});

	describe("Specific Resolver Error Messages Preservation", () => {
		const assertPreservedError = (
			errorObj: unknown,
			expectedMessage: string,
		) => {
			const executionResult: ExecutionResult = {
				data: null,
				errors: [errorObj as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(500);
			expect(result.response.errors).toHaveLength(1);
			const formattedError = result.response.errors?.[0];
			if (!formattedError) throw new Error("Formatted error should be defined");

			expect(formattedError.message).toBe(expectedMessage);
		};

		it("should preserve message when error has no extensions and message is in specific allowed list", () => {
			const error = {
				message: "Minio removal error",
				locations: [],
				path: [],
			};
			assertPreservedError(error, "Minio removal error");
		});

		it("should preserve message when error has extensions but invalid code and message is in specific allowed list", () => {
			const error = {
				message: "Minio removal error",
				locations: [],
				path: [],
				extensions: {
					code: "SOME_RANDOM_CODE",
				},
			};
			assertPreservedError(error, "Minio removal error");
		});

		it("should mask message when error message starts with 'Database'", () => {
			const error = {
				message: "Database connection error",
				locations: [],
				path: [],
			};
			assertPreservedError(error, "Internal Server Error");
		});

		it("should mask message when error message includes 'query:'", () => {
			const error = {
				message: "Error in query: SELECT * FROM ...",
				locations: [],
				path: [],
			};
			assertPreservedError(error, "Internal Server Error");
		});

		it("should mask message when error message includes 'boom'", () => {
			const error = {
				message: "Something went boom!",
				locations: [],
				path: [],
			};
			assertPreservedError(error, "Internal Server Error");
		});
	});

	describe("Zod Validation and Fallback Error Handling", () => {
		it("should extract message from Zod validation details array", () => {
			const zodMessage = "Specific Zod validation error";
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: JSON.stringify([{ message: zodMessage }]),
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
				locations: [],
				path: [],
				// No extensions ensures we enter the !error.extensions block
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe(zodMessage);
			expect(formattedError?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it("should fallback to specific message parsing when Zod detail parsing fails", () => {
			// Trigger JSON parse error with invalid JSON string
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: "{ invalid json",
				statusCode: 400,
			});

			const specificMsg = "Minio removal error";
			const error = {
				message: `Wrapper error: ${specificMsg}`,
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe(`Wrapper error: ${specificMsg}`);
		});

		it("should fallback to normalized message if specific parsing also fails/doesn't match", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "Normalized Message",
				details: "{ invalid json",
				statusCode: 400,
			});

			const error = {
				message: "Some unknown error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Normalized Message");
		});

		it("should handle already parsed details object/array", () => {
			const detailMessage = "Already parsed details";
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: [{ message: detailMessage }],
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe(detailMessage);
		});

		it("should use fallback message for invalid error code when normalized message is missing", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: undefined as unknown as string,
				statusCode: 500,
			});

			const error = {
				message: "Some weird error",
				locations: [],
				path: [],
				extensions: {
					code: "INVALID_CODE",
				},
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("An error occurred");
		});

		it("should fallback to 500 status code when httpStatus is missing in formatted error", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: "SOME_OTHER_CODE" as ErrorCode,
				message: "Error",
				statusCode: undefined as unknown as number,
			});

			const error = {
				message: "Error",
				locations: [],
				path: [],
				extensions: {
					code: "INVALID_CODE",
				},
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(500);
		});
	});

	describe("Message Fallbacks", () => {
		it("should use default message for TalawaGraphQLError with empty message", () => {
			const error = new TalawaGraphQLError({
				message: "",
				extensions: {
					code: ErrorCode.INTERNAL_SERVER_ERROR,
				},
			});
			error.message = "";

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error],
			};

			const result = errorFormatter(executionResult, context);
			const formattedError = result.response.errors?.[0];
			expect(formattedError).toBeDefined();
			expect(formattedError?.message).toBe("An error occurred");
		});

		it("should use default message for GraphQL validation error with empty message", () => {
			const error = {
				message: "",
				extensions: {
					code: "GRAPHQL_VALIDATION_FAILED",
				},
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);
			const formattedError = result.response.errors?.[0];
			expect(formattedError).toBeDefined();
			expect(formattedError?.message).toBe("GraphQL validation error");
		});

		it("should use default message for error without extensions when normalized message is missing", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: undefined as unknown as string,
				statusCode: 500,
			});

			const error = {
				message: "Some ignored error",
				locations: [],
				path: [],
				// No extensions
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);
			const formattedError = result.response.errors?.[0];
			expect(formattedError).toBeDefined();
			expect(formattedError?.message).toBe("An error occurred");
		});
	});
});
