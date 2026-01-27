import Fastify, { type FastifyInstance } from "fastify";
import {
	type ExecutionResult,
	type GraphQLError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from "graphql";
import { createMercuriusTestClient } from "mercurius-integration-testing";
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

		it("should use exact matching for allowlist, not substring matching", () => {
			// Test that substring matching doesn't work - this should be masked
			const error = {
				message: "This contains Invalid UUID but should be masked",
				locations: [],
				path: [],
			};
			assertPreservedError(error, "Internal Server Error");
		});

		it("should preserve exact allowlist matches only", () => {
			// Test that exact matches work
			const error = {
				message: "Invalid UUID",
				locations: [],
				path: [],
			};
			assertPreservedError(error, "Invalid UUID");
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

			// Use an exact allowlist match instead of substring
			const specificMsg = "Minio removal error";
			const error = {
				message: specificMsg,
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe(specificMsg);
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

		it("should handle treeified Zod error format with properties.id.errors containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						id: {
							errors: ["Invalid UUID", "Other error"],
						},
					},
				},
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
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle treeified Zod error format with properties.id.errors not containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						id: {
							errors: ["Some other error", "Another error"],
						},
					},
				},
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
			expect(formattedError?.message).toBe("General Validation Error");
		});

		it("should handle treeified Zod error format with properties but no id field", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						name: {
							errors: ["Name is required"],
						},
					},
				},
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
			expect(formattedError?.message).toBe("General Validation Error");
		});

		it("should handle treeified Zod error format with properties.id but non-array errors", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						id: {
							errors: "Not an array",
						},
					},
				},
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
			expect(formattedError?.message).toBe("General Validation Error");
		});

		it("should handle array format with Invalid UUID message", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: [{ message: "Invalid UUID" }],
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
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle array format with non-Invalid UUID message", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: [{ message: "Some other validation error" }],
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
			expect(formattedError?.message).toBe("Some other validation error");
		});

		it("should handle catch block with originalError.message containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS, // Must be INVALID_ARGUMENTS to enter the Zod handling block
				message: "General Validation Error",
				details: "{ invalid json", // This will trigger JSON parse error
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
				originalError: {
					message: "ZodError: Invalid UUID for field id",
				},
				locations: [],
				path: [],
				// No extensions to ensure we go into the !error.extensions branch
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle catch block with error.message containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS, // Must be INVALID_ARGUMENTS to enter the Zod handling block
				message: "General Validation Error",
				details: "{ invalid json", // This will trigger JSON parse error
				statusCode: 400,
			});

			const error = {
				message: "Validation failed: Invalid UUID",
				locations: [],
				path: [],
				// No extensions to ensure we go into the !error.extensions branch
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle catch block in extensions branch with originalError.message containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: "{ invalid json", // This will trigger JSON parse error
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
				originalError: {
					message: "ZodError: Invalid UUID for field id",
				},
				locations: [],
				path: [],
				extensions: {
					code: "INVALID_CODE", // Invalid code to go into the extensions branch
				},
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle catch block in extensions branch with error.message containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: "{ invalid json", // This will trigger JSON parse error
				statusCode: 400,
			});

			const error = {
				message: "Validation failed: Invalid UUID",
				locations: [],
				path: [],
				extensions: {
					code: "INVALID_CODE", // Invalid code to go into the extensions branch
				},
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle catch block without Invalid UUID and fallback to getPublicErrorMessage", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: "{ invalid json", // This will trigger JSON parse error
				statusCode: 400,
			});

			const error = {
				message: "Minio removal error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Minio removal error");
		});

		it("should handle treeified Zod error format in extensions branch with properties.id.errors containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						id: {
							errors: ["Invalid UUID", "Other error"],
						},
					},
				},
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
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
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle treeified Zod error format in extensions branch with properties.id.errors not containing Invalid UUID", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						id: {
							errors: ["Some other error", "Another error"],
						},
					},
				},
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
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
			expect(formattedError?.message).toBe("General Validation Error");
		});

		it("should handle treeified Zod error format in extensions branch with properties but no id field", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						name: {
							errors: ["Name is required"],
						},
					},
				},
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
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
			expect(formattedError?.message).toBe("General Validation Error");
		});

		it("should handle treeified Zod error format in extensions branch with properties.id but non-array errors", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: {
					properties: {
						id: {
							errors: "Not an array",
						},
					},
				},
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
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
			expect(formattedError?.message).toBe("General Validation Error");
		});

		it("should handle array format in extensions branch with Invalid UUID message", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: [{ message: "Invalid UUID" }],
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
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
			expect(formattedError?.message).toBe("Invalid uuid");
		});

		it("should handle array format in extensions branch with non-Invalid UUID message", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "General Validation Error",
				details: [{ message: "Some other validation error" }],
				statusCode: 400,
			});

			const error = {
				message: "General Validation Error",
				locations: [],
				path: [],
				extensions: {
					code: "INVALID_CODE", // Invalid code to go into the extensions branch
				},
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Some other validation error");
		});

		it("should handle message ending with period in getPublicErrorMessage", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "General Validation Error",
				statusCode: 500,
			});

			const error = {
				message: "Invalid UUID.", // Message with period that should be stripped and matched
				locations: [],
				path: [],
				extensions: {
					code: "INVALID_CODE", // Invalid code to go into the extensions branch
				},
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Invalid UUID"); // Should strip the period and return the allowlisted message
		});

		it("should handle INTERNAL_SERVER_ERROR with Invalid UUID in error message", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "General Validation Error",
				statusCode: 500,
			});

			const error = {
				message: "Validation failed: Invalid UUID",
				locations: [],
				path: [],
				extensions: {
					code: "INVALID_CODE", // Invalid code to go into the extensions branch
				},
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			const formattedError = result.response.errors?.[0];
			expect(formattedError?.message).toBe("Invalid uuid");
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

	describe("Error Code Status Code Mapping", () => {
		it("should return 401 for UNAUTHENTICATED error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.UNAUTHENTICATED,
				message: "You must be authenticated",
				statusCode: 401,
			});

			const error = {
				message: "Auth error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(401);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.UNAUTHENTICATED,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(401);
		});

		it("should return 401 for TOKEN_EXPIRED error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.TOKEN_EXPIRED,
				message: "Token expired",
				statusCode: 401,
			});

			const error = {
				message: "Token expired error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(401);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.TOKEN_EXPIRED,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(401);
		});

		it("should return 401 for TOKEN_INVALID error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.TOKEN_INVALID,
				message: "Token invalid",
				statusCode: 401,
			});

			const error = {
				message: "Token invalid error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(401);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.TOKEN_INVALID,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(401);
		});

		it("should return 403 for UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
				message: "Unauthorized action",
				statusCode: 403,
			});

			const error = {
				message: "Unauthorized error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(403);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(403);
		});

		it("should return 403 for UNAUTHORIZED error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.UNAUTHORIZED,
				message: "Unauthorized",
				statusCode: 403,
			});

			const error = {
				message: "Unauthorized error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(403);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.UNAUTHORIZED,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(403);
		});

		it("should return 403 for INSUFFICIENT_PERMISSIONS error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INSUFFICIENT_PERMISSIONS,
				message: "Insufficient permissions",
				statusCode: 403,
			});

			const error = {
				message: "Insufficient permissions error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(403);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INSUFFICIENT_PERMISSIONS,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(403);
		});

		it("should return 403 for FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
				message: "Forbidden action on args",
				statusCode: 403,
			});

			const error = {
				message: "Forbidden action error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(403);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(403);
		});

		it("should return 403 for FORBIDDEN_ACTION error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.FORBIDDEN_ACTION,
				message: "Forbidden action",
				statusCode: 403,
			});

			const error = {
				message: "Forbidden action error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(403);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.FORBIDDEN_ACTION,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(403);
		});

		it("should return 404 for NOT_FOUND error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.NOT_FOUND,
				message: "Resource not found",
				statusCode: 404,
			});

			const error = {
				message: "Not found error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(404);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.NOT_FOUND,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(404);
		});

		it("should return 404 for ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
				message: "Arguments not found",
				statusCode: 404,
			});

			const error = {
				message: "Arguments not found error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(404);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(404);
		});

		it("should return 400 for INVALID_INPUT error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INVALID_INPUT,
				message: "Invalid input",
				statusCode: 400,
			});

			const error = {
				message: "Invalid input error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(400);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_INPUT,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(400);
		});

		it("should return 429 for RATE_LIMIT_EXCEEDED error code", () => {
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.RATE_LIMIT_EXCEEDED,
				message: "Rate limit exceeded",
				statusCode: 429,
			});

			const error = {
				message: "Rate limit error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			expect(result.statusCode).toBe(429);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.RATE_LIMIT_EXCEEDED,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(429);
		});
	});

	describe("Mercurius Integration", () => {
		it("should format errors correctly using the actual plugin", async () => {
			const testSchema = `
				type Query {
					throwError: String!
				}
			`;

			// Setup mocks for this test
			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(
				testSchema as unknown as GraphQLSchema,
			);
			vi.mocked(normalizeError).mockReturnValue({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Cannot return null for non-nullable field Query.throwError.",
				statusCode: 500,
				details: null,
			});

			const app = Fastify();

			// Decorate app with necessary dependencies
			app.decorate("envConfig", {
				API_IS_GRAPHIQL: true,
				API_GRAPHQL_MUTATION_BASE_COST: 1,
				API_RATE_LIMIT_BUCKET_CAPACITY: 10,
				API_RATE_LIMIT_REFILL_RATE: 1,
			} as unknown as FastifyInstance["envConfig"]);
			app.decorate(
				"drizzleClient",
				{} as unknown as FastifyInstance["drizzleClient"],
			);
			app.decorate("cache", {
				get: vi.fn(),
				set: vi.fn(),
				del: vi.fn(),
			} as unknown as FastifyInstance["cache"]);
			app.decorate("minio", {} as unknown as FastifyInstance["minio"]);
			app.decorate("jwt", {
				sign: vi.fn(),
				verify: vi.fn(),
			} as unknown as FastifyInstance["jwt"]);

			await app.register(graphql);

			const client = createMercuriusTestClient(app);

			const response = await client.query("query { throwError }");

			expect(response.errors).toBeDefined();
			expect(response.errors).toHaveLength(1);

			const firstError = response.errors?.[0];
			if (!firstError) {
				throw new Error("Expected at least one error");
			}

			expect(firstError.message).toContain("Cannot return null");
			expect(firstError.extensions?.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		});
	});

	describe("Multiple Errors Handling", () => {
		it("should pick the highest priority HTTP status code when multiple errors exist", () => {
			vi.mocked(normalizeError)
				.mockReturnValueOnce({
					code: ErrorCode.INVALID_ARGUMENTS,
					message: "Validation error",
					statusCode: 400,
				})
				.mockReturnValueOnce({
					code: ErrorCode.UNAUTHENTICATED,
					message: "Auth error",
					statusCode: 401,
				})
				.mockReturnValueOnce({
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: "Server error",
					statusCode: 500,
				});

			const errors = [
				{
					message: "Validation error",
					locations: [],
					path: [],
				},
				{
					message: "Auth error",
					locations: [],
					path: [],
				},
				{
					message: "Server error",
					locations: [],
					path: [],
				},
			];

			const executionResult: ExecutionResult = {
				data: null,
				errors: errors as unknown as GraphQLError[],
			};

			const result = errorFormatter(executionResult, context);

			// Should pick UNAUTHENTICATED (401) as it has highest priority
			expect(result.statusCode).toBe(401);
			expect(result.response.errors).toHaveLength(3);
		});

		it("should handle mixed TalawaGraphQLError and regular GraphQL errors", () => {
			const talawaError = new TalawaGraphQLError({
				message: "Custom error",
				extensions: {
					code: ErrorCode.NOT_FOUND,
				},
			});

			vi.mocked(normalizeError).mockReturnValueOnce({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "Validation error",
				statusCode: 400,
			});

			const regularError = {
				message: "Validation error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [talawaError, regularError as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, context);

			// TalawaGraphQLError should have 404, regular error should have 400
			// Should pick INVALID_ARGUMENTS (400) as it has higher priority than NOT_FOUND (404)
			expect(result.statusCode).toBe(400);
			expect(result.response.errors).toHaveLength(2);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.NOT_FOUND,
			);
			expect(result.response.errors?.[1]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});
	});

	describe("Subscription Context Handling", () => {
		it("should extract correlationId from subscription context", () => {
			const subscriptionContext = {
				correlationId: "sub-req-id-123",
			};

			const error = {
				message: "Subscription error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, subscriptionContext);

			expect(result.response.errors?.[0]?.extensions?.correlationId).toBe(
				"sub-req-id-123",
			);
		});

		it("should fallback to default correlationId when subscription context is malformed", () => {
			const malformedContext = {
				connection: {
					// Missing context.id
				},
			};

			const error = {
				message: "Subscription error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, malformedContext);

			// Should fallback to a default correlationId or handle gracefully
			expect(result.response.errors?.[0]?.extensions?.correlationId).toBe(
				"unknown",
			);
		});

		it("should handle subscription context without connection property", () => {
			const contextWithoutConnection = {
				someOtherProperty: "value",
			};

			const error = {
				message: "Subscription error",
				locations: [],
				path: [],
			};

			const executionResult: ExecutionResult = {
				data: null,
				errors: [error as unknown as GraphQLError],
			};

			const result = errorFormatter(executionResult, contextWithoutConnection);

			// Should handle gracefully and provide some correlationId
			expect(result.response.errors?.[0]?.extensions?.correlationId).toBe(
				"unknown",
			);
		});
	});
});
