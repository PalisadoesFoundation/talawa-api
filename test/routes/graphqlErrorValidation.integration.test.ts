/**
 * Integration tests for GraphQL error validation and formatting.
 *
 * This suite verifies that the GraphQL API returns correctly formatted errors
 * with appropriate status codes, codes, and extensions for various scenarios
 * including rate limiting, authentication, authorization, and validation failures.
 * It ensures the unified error contract is maintained across the application.
 */
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer } from "~/src/createServer";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { testEnvConfig } from "../envConfigSchema";
import { mercuriusClient } from "../graphql/types/client";
import { createRegularUserUsingAdmin } from "../graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createChat,
	Mutation_createOrganization,
	Query_signIn,
} from "../graphql/types/documentNodes";
import { server } from "../server";

describe("GraphQL Error Formatting Integration", () => {
	let adminToken: string;

	beforeAll(async () => {
		// Clear any existing headers
		mercuriusClient.setHeaders({});

		// Sign in as admin
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (signInResult.errors) {
			throw new Error(
				`Failed to sign in as admin: ${JSON.stringify(signInResult.errors)}`,
			);
		}

		adminToken = signInResult.data?.signIn?.authenticationToken as string;
		if (!adminToken) {
			throw new Error("Admin token not found in response");
		}
	});

	it("should return 400 with INVALID_ARGUMENTS for malformed query string (parse error)", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						__typename
						# Missing closing brace
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(400);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);

		const error = body.errors[0];
		expect(error.message).toBeDefined();
		expect(error.extensions).toBeDefined();
		expect(error.extensions.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(error.extensions.httpStatus).toBe(400);
		expect(error.extensions.correlationId).toBeDefined();
		expect(typeof error.extensions.correlationId).toBe("string");
	});

	it("should return 403 with UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES when attempting to delete a chat without sufficient permissions", async () => {
		// Create Organization (Admin)
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						name: `Test Org ${uuidv7()}`,
						description: "Desc",
					},
				},
			},
		);
		const orgId = orgResult.data?.createOrganization?.id;
		if (!orgId) throw new Error("Failed to create org");

		// Create Chat (Admin)
		const chatResult = await mercuriusClient.mutate(Mutation_createChat, {
			headers: { authorization: `Bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId,
					name: "Test Chat",
				},
			},
		});

		const chatId = chatResult.data?.createChat?.id;
		if (!chatId) throw new Error("Failed to create chat");

		// Create Regular User (using helper)
		const { authToken: regularUserToken } = await createRegularUserUsingAdmin();

		// Attempt Delete Chat (Regular User)
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					mutation {
						deleteChat(input: { id: "${chatId}" }) {
							id
						}
					}
				`,
			},
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${regularUserToken}`,
			},
		});

		expect(response.statusCode).toBe(403);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);

		const error = body.errors[0];
		expect(error.extensions).toBeDefined();
		expect(error.extensions.code).toBe(
			ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
		);
		expect(error.extensions.httpStatus).toBe(403);
		expect(error.extensions.correlationId).toBeDefined();
		expect(typeof error.extensions.correlationId).toBe("string");
	});

	it("should return formatted validation error with correct structure and status code", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						nonExistentField
					}
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		// Expect 400 Bad Request for validation errors
		expect(response.statusCode).toBe(400);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);

		const error = body.errors[0];

		// Check message content
		expect(error.message).toBeDefined();
		expect(error.message).toMatch(
			/(cannot query field|graphql validation error)/i,
		);

		// Check extensions structure
		expect(error.extensions).toBeDefined();
		expect(error.extensions.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(error.extensions.httpStatus).toBe(400);
		expect(error.extensions.correlationId).toBeDefined();
		expect(typeof error.extensions.correlationId).toBe("string");
	});

	it.each([
		{
			type: "mutation",
			query: `
					mutation {
						createOrganization(input: {
							name: "Test Org"
							description: "Test Description"
						}) {
							id
						}
					}
				`,
		},
		{
			type: "query",
			query: `
					query {
						fund(input: { id: "test-fund-id" }) {
							id
							name
						}
					}
				`,
		},
	])("should return 401 UNAUTHENTICATED for unauthenticated $type", async ({
		query,
	}) => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(401);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);

		const error = body.errors[0];
		expect(error.extensions).toBeDefined();
		expect(error.extensions.code).toBe(ErrorCode.UNAUTHENTICATED);
		expect(error.extensions.httpStatus).toBe(401);
		expect(error.extensions.correlationId).toBeDefined();
		expect(typeof error.extensions.correlationId).toBe("string");
	});

	it("should return 429 with RATE_LIMIT_EXCEEDED when rate limit is triggered", async () => {
		// Create a server with very low rate limits for testing
		const rateLimitServer = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_RATE_LIMIT_BUCKET_CAPACITY: 1, // Very low capacity
				API_RATE_LIMIT_REFILL_RATE: 0, // No refill
				API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				API_PORT: 0,
			},
		});
		await rateLimitServer.ready();

		// Clear any existing rate limit buckets to ensure clean test state
		const keys = await rateLimitServer.redis.keys("rate-limit:*");
		if (keys.length > 0) {
			await rateLimitServer.redis.del(...keys);
		}

		try {
			const query = `
				query {
					__schema {
						types {
							name
						}
					}
				}
			`;

			const initialResponse = await rateLimitServer.inject({
				method: "POST",
				url: "/graphql",
				payload: { query },
				headers: { "content-type": "application/json" },
			});

			expect(initialResponse.statusCode).toBe(200);
			expect(JSON.parse(initialResponse.body).errors).toBeUndefined();

			const response = await rateLimitServer.inject({
				method: "POST",
				url: "/graphql",
				payload: { query },
				headers: { "content-type": "application/json" },
			});

			expect(response.statusCode).toBe(429);

			const body = JSON.parse(response.body);
			expect(body.errors).toBeDefined();
			expect(body.errors.length).toBeGreaterThan(0);

			const error = body.errors[0];
			expect(error.extensions).toBeDefined();
			expect(error.extensions.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
			expect(error.extensions.httpStatus).toBe(429);
			expect(error.extensions.correlationId).toBeDefined();
			expect(typeof error.extensions.correlationId).toBe("string");
		} finally {
			await rateLimitServer.close();
		}
	});

	it("should propagate custom TalawaGraphQLError extensions.code", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				// deleteChat with non-existent ID throws ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND (404)
				query: `
					mutation {
						deleteChat(input: { id: "${uuidv7()}" }) {
							id
						}
					}
				`,
			},
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${adminToken}`,
			},
		});

		// 404 is mapped from ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND
		expect(response.statusCode).toBe(404);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);

		const error = body.errors[0];
		expect(error.extensions).toBeDefined();
		expect(error.extensions.code).toBe(
			ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
		);
		expect(error.extensions.httpStatus).toBe(404);
		expect(error.extensions.correlationId).toBeDefined();
		expect(typeof error.extensions.correlationId).toBe("string");
	});

	it("should return 400 with INVALID_ARGUMENTS for query validation errors", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						currentUser {
							invalidField
						}
					}
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(400);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);

		const error = body.errors[0];
		expect(error.extensions).toBeDefined();
		expect(error.extensions.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(error.extensions.httpStatus).toBe(400);
		expect(error.extensions.correlationId).toBeDefined();
		expect(typeof error.extensions.correlationId).toBe("string");
	});
});
