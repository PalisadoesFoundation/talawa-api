import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock external dependencies similar to graphql.integration.test.ts
vi.mock("~/src/fastifyPlugins/backgroundWorkers", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/drizzleClient", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/minioClient", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/seedInitialData", () => ({
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

	beforeEach(async () => {
		server = await createServer({
			envConfig: {
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
				API_RATE_LIMIT_REFILL_RATE: 10000,
				API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
			},
		});
		await server.ready();
	});

	afterEach(async () => {
		if (server) {
			await server.close();
		}
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
});
