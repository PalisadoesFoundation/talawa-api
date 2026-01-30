import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usersTable } from "~/src/drizzle/tables/users";

vi.mock("~/src/fastifyPlugins/backgroundWorkers", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/minioClient", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/pluginSystem", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/performance", () => ({
	default: async () => {},
}));

import type { FastifyInstance } from "fastify";
import { createServer } from "~/src/createServer";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { testEnvConfig } from "../envConfigSchema";

describe("GraphQL Error Formatting Integration", () => {
	let server: FastifyInstance;
	let adminToken: string;

	beforeEach(async () => {
		server = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
				API_RATE_LIMIT_REFILL_RATE: 10000,
				API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				API_PORT: 0,
			},
		});
		await server.ready();

		// Ensure Administrator user exists and has the correct password
		// This handles cases where the DB persists state between tests but with different/unknown passwords
		const adminEmail = server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
		const adminPassword = server.envConfig.API_ADMINISTRATOR_USER_PASSWORD;
		const adminPasswordHash = await hash(adminPassword);

		// Directly connect to DB to bypass server.drizzleClient unavailability in tests
		const connectionString = `postgres://${server.envConfig.API_POSTGRES_USER}:${server.envConfig.API_POSTGRES_PASSWORD}@${server.envConfig.API_POSTGRES_HOST}:${server.envConfig.API_POSTGRES_PORT}/${server.envConfig.API_POSTGRES_DATABASE}`;
		const sql = postgres(connectionString);
		const db = drizzle(sql);

		try {
			const existingUser = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.emailAddress, adminEmail));
			let adminUserId = "";

			const user = existingUser[0];

			if (user) {
				adminUserId = user.id;
				await db
					.update(usersTable)
					.set({ passwordHash: adminPasswordHash })
					.where(eq(usersTable.emailAddress, adminEmail));
			} else {
				console.error(
					"DEBUG: Admin user NOT FOUND in DB for email:",
					adminEmail,
				);
				// Should not happen if seedInitialData runs, but if it does, we can't generate token properly
				throw new Error("Admin user not found in DB");
			}

			// Generate Admin Token manually
			adminToken = server.jwt.sign({
				user: {
					id: adminUserId,
				},
			});
		} finally {
			await sql.end();
		}
	});

	afterEach(async () => {
		if (server) {
			await server.close();
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
		const orgResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: { authorization: `Bearer ${adminToken}` },
			payload: {
				query: `
					mutation { 
						createOrganization(input: { 
							name: "Test Org ${uuidv7()}"
							description: "Desc" 
						}) { 
							id 
						} 
					}
				`,
			},
		});
		const orgId = JSON.parse(orgResponse.body).data?.createOrganization?.id;
		if (!orgId) throw new Error(`Failed to create org: ${orgResponse.body}`);

		// Create Chat (Admin)
		const chatResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: { authorization: `Bearer ${adminToken}` },
			payload: {
				query: `
					mutation { 
						createChat(input: { 
							organizationId: "${orgId}"
							name: "Test Chat" 
						}) { 
							id 
						} 
					}
				`,
			},
		});
		const chatId = JSON.parse(chatResponse.body).data?.createChat?.id;
		if (!chatId) throw new Error(`Failed to create chat: ${chatResponse.body}`);

		// Create Regular User (Sign Up) to act as the unauthorized user
		const signUpResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					mutation {
						signUp(input: {
							name: "Regular User"
							emailAddress: "regular-${uuidv7()}@example.com"
							password: "password123"
							selectedOrganization: "${orgId}"
						}) {
							authenticationToken
						}
					}
				`,
			},
		});
		const regularUserToken = JSON.parse(signUpResponse.body).data?.signUp
			?.authenticationToken;
		if (!regularUserToken)
			throw new Error(`Failed to sign up regular user: ${signUpResponse.body}`);

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
			/(Cannot query field|Graphql validation error)/,
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

			await rateLimitServer.inject({
				method: "POST",
				url: "/graphql",
				payload: { query },
				headers: { "content-type": "application/json" },
			});

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
			expect(error.extensions.correlationId).toBeDefined();
			expect(typeof error.extensions.correlationId).toBe("string");
		} finally {
			await rateLimitServer.close();
		}
	});

	it("should propagate custom TalawaGraphQLError extensions.code", async () => {
		// Use manually generated adminToken

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
		expect(error.extensions.correlationId).toBeDefined();
		expect(typeof error.extensions.correlationId).toBe("string");
	});
});
