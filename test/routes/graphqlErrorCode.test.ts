import type { FastifyInstance } from "fastify";
import {
	type ExecutionResult,
	type GraphQLFormattedError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { graphql } from "~/src/routes/graphql";

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

vi.mock("~/src/utilities/TalawaGraphQLError", () => ({
	TalawaGraphQLError: vi.fn(),
}));

// Import mocked functions
import schemaManager from "~/src/graphql/schemaManager";

describe("GraphQL Error Formatting", () => {
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

		vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(
			new GraphQLSchema({
				query: new GraphQLObjectType({
					name: "Query",
					fields: { hello: { type: GraphQLString } },
				}),
			}),
		);

		await graphql(mockFastifyInstance as unknown as FastifyInstance);

		// Extract the errorFormatter from the register call
		const registerCall = mockFastifyInstance.register.mock.calls[1];
		errorFormatter = registerCall?.[1].errorFormatter;
	});

	it("should map legacy 'invalid_credentials' to UNAUTHENTICATED (401) status but preserve code", () => {
		const result = errorFormatter(
			{
				data: null,
				errors: [
					{
						message: "Invalid credentials",
						locations: undefined,
						extensions: {
							code: "invalid_credentials",
						},
						name: "Error",
						nodes: undefined,
						source: undefined,
						positions: undefined,
						originalError: undefined,
						path: undefined,
						toJSON: () => ({ message: "Invalid credentials" }),
						[Symbol.toStringTag]: "Error",
					},
				],
			},
			{
				reply: {
					request: { id: "req-1", log: { error: vi.fn() } },
					// Simulate non-HTTP context to check statusCode derivation logic directly
					send: undefined,
				},
			},
		);

		const errors = result.response.errors;
		expect(errors).toBeDefined();
		expect(errors?.length).toBeGreaterThan(0);

		if (errors && errors.length > 0) {
			const error = errors[0];
			if (error?.extensions) {
				expect(error.extensions.httpStatus).toBe(401);
				expect(error.extensions.code).toBe("invalid_credentials");
			} else {
				throw new Error("Error or extensions undefined");
			}
		}
	});

	it("should map legacy 'unauthorized_action' to INSUFFICIENT_PERMISSIONS (403) status but preserve code", () => {
		const result = errorFormatter(
			{
				data: null,
				errors: [
					{
						message: "Unauthorized action",
						locations: undefined,
						extensions: {
							code: "unauthorized_action",
						},
						name: "Error",
						nodes: undefined,
						source: undefined,
						positions: undefined,
						originalError: undefined,
						path: undefined,
						toJSON: () => ({ message: "Unauthorized action" }),
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

		const errors = result.response.errors;
		expect(errors).toBeDefined();
		expect(errors?.length).toBeGreaterThan(0);

		if (errors && errors.length > 0) {
			const error = errors[0];
			if (error?.extensions) {
				expect(error.extensions.httpStatus).toBe(403);
				expect(error.extensions.code).toBe("unauthorized_action");
			} else {
				throw new Error("Error or extensions undefined");
			}
		}
	});

	it("should map legacy 'account_locked' to UNAUTHORIZED (403) status but preserve code", () => {
		const result = errorFormatter(
			{
				data: null,
				errors: [
					{
						message: "Account locked",
						locations: undefined,
						extensions: {
							code: "account_locked",
						},
						name: "Error",
						nodes: undefined,
						source: undefined,
						positions: undefined,
						originalError: undefined,
						path: undefined,
						toJSON: () => ({ message: "Account locked" }),
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

		const errors = result.response.errors;
		expect(errors).toBeDefined();
		expect(errors?.length).toBeGreaterThan(0);

		if (errors && errors.length > 0) {
			const error = errors[0];
			if (error?.extensions) {
				expect(error.extensions.httpStatus).toBe(403);
				expect(error.extensions.code).toBe("account_locked");
			} else {
				throw new Error("Error or extensions undefined");
			}
		}
	});
});
