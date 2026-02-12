vi.mock("@fastify/redis", () => ({
	default: async () => {},
}));

vi.mock("../src/fastifyPlugins/index", () => ({
	default: async () => {},
}));

vi.mock("../src/routes/index", () => ({
	default: async () => {},
}));

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../src/createServer";

/**
 * UUID v4 regex (case-insensitive)
 */
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("Correlation ID behavior", () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createServer({
			envConfig: {
				API_IS_PINO_PRETTY: false,
				API_IS_GRAPHIQL: false,
				API_COOKIE_SECRET: "12345678901234567890123456789012",
				API_JWT_SECRET:
					"1234567890123456789012345678901212345678901234567890123456789012",
				API_AUTH_JWT_SECRET: "12345678901234567890123456789012",
				API_REDIS_HOST: "redis-test",
				API_REDIS_PORT: 6379,
				API_FRONTEND_URL: "http://localhost:4321",
			},
		});

		server.get("/test", async () => {
			return { ok: true };
		});

		await server.ready();
	});

	afterEach(async () => {
		if (server) {
			await server.close();
		}
		vi.restoreAllMocks();
	});

	it("uses valid x-correlation-id header as request id", async () => {
		const validUuid = "550e8400-e29b-41d4-a716-446655440000";

		const response = await server.inject({
			method: "GET",
			url: "/test",
			headers: {
				"x-correlation-id": validUuid,
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBe(validUuid);
	});

	it("generates a new UUID when x-correlation-id header is missing", async () => {
		const response = await server.inject({
			method: "GET",
			url: "/test",
		});

		const correlationId = response.headers["x-correlation-id"];

		expect(correlationId).toBeDefined();
		expect(typeof correlationId).toBe("string");
		expect(correlationId).toMatch(UUID_REGEX);
	});

	it("generates a new UUID when x-correlation-id header is malformed", async () => {
		const response = await server.inject({
			method: "GET",
			url: "/test",
			headers: {
				"x-correlation-id": "not-a-uuid",
			},
		});

		const correlationId = response.headers["x-correlation-id"];

		expect(correlationId).toBeDefined();
		expect(correlationId).not.toBe("not-a-uuid");
		expect(correlationId).toMatch(UUID_REGEX);
	});

	it("overrides invalid-length UUIDs", async () => {
		const response = await server.inject({
			method: "GET",
			url: "/test",
			headers: {
				"x-correlation-id": "1234",
			},
		});

		const correlationId = response.headers["x-correlation-id"];

		expect(correlationId).toBeDefined();
		expect(correlationId).toMatch(UUID_REGEX);
	});

	it("sets x-correlation-id response header in all cases", async () => {
		const testCases = [
			{
				name: "with valid header",
				headers: { "x-correlation-id": "550e8400-e29b-41d4-a716-446655440000" },
				expectedId: "550e8400-e29b-41d4-a716-446655440000",
			},
			{
				name: "without header",
				headers: {},
				expectedId: null,
			},
			{
				name: "with malformed header",
				headers: { "x-correlation-id": "not-a-uuid" },
				expectedId: null,
			},
		];

		for (const testCase of testCases) {
			const response = await server.inject({
				method: "GET",
				url: "/test",
				headers: testCase.headers,
			});

			const correlationId = response.headers["x-correlation-id"];
			expect(correlationId).toBeDefined();

			if (testCase.expectedId) {
				expect(correlationId).toBe(testCase.expectedId);
			} else {
				expect(correlationId).toMatch(UUID_REGEX);
			}
		}
	});
});

describe("Correlation ID logger integration", () => {
	it("attaches correlationId to request logger via child() with valid header", async () => {
		const validUuid = "550e8400-e29b-41d4-a716-446655440000";
		let loggerBindings: Record<string, unknown> | undefined;

		const testServer = await createServer({
			envConfig: {
				API_IS_PINO_PRETTY: false,
				API_IS_GRAPHIQL: false,
				API_COOKIE_SECRET: "12345678901234567890123456789012",
				API_JWT_SECRET:
					"1234567890123456789012345678901212345678901234567890123456789012",
				API_AUTH_JWT_SECRET: "12345678901234567890123456789012",
				API_REDIS_HOST: "redis-test",
				API_REDIS_PORT: 6379,
				API_FRONTEND_URL: "http://localhost:4321",
			},
		});

		testServer.get("/test", async (request) => {
			loggerBindings = (
				request.log as unknown as { bindings: () => Record<string, unknown> }
			).bindings();
			return { ok: true };
		});

		await testServer.ready();

		await testServer.inject({
			method: "GET",
			url: "/test",
			headers: { "x-correlation-id": validUuid },
		});

		expect(loggerBindings).toBeDefined();
		expect(loggerBindings?.correlationId).toBe(validUuid);

		await testServer.close();
	});

	it("attaches generated correlationId to request logger when header is missing", async () => {
		let loggerBindings: Record<string, unknown> | undefined;

		const testServer = await createServer({
			envConfig: {
				API_IS_PINO_PRETTY: false,
				API_IS_GRAPHIQL: false,
				API_COOKIE_SECRET: "12345678901234567890123456789012",
				API_JWT_SECRET:
					"1234567890123456789012345678901212345678901234567890123456789012",
				API_AUTH_JWT_SECRET: "12345678901234567890123456789012",
				API_REDIS_HOST: "redis-test",
				API_REDIS_PORT: 6379,
				API_FRONTEND_URL: "http://localhost:4321",
			},
		});

		testServer.get("/test", async (request) => {
			loggerBindings = (
				request.log as unknown as { bindings: () => Record<string, unknown> }
			).bindings();
			return { ok: true };
		});

		await testServer.ready();

		const response = await testServer.inject({
			method: "GET",
			url: "/test",
		});

		const responseCorrelationId = response.headers[
			"x-correlation-id"
		] as string;

		expect(loggerBindings).toBeDefined();
		expect(loggerBindings?.correlationId).toBe(responseCorrelationId);
		expect(loggerBindings?.correlationId).toMatch(UUID_REGEX);

		await testServer.close();
	});

	it("attaches generated correlationId to request logger when header is malformed", async () => {
		let loggerBindings: Record<string, unknown> | undefined;

		const testServer = await createServer({
			envConfig: {
				API_IS_PINO_PRETTY: false,
				API_IS_GRAPHIQL: false,
				API_COOKIE_SECRET: "12345678901234567890123456789012",
				API_JWT_SECRET:
					"1234567890123456789012345678901212345678901234567890123456789012",
				API_AUTH_JWT_SECRET: "12345678901234567890123456789012",
				API_REDIS_HOST: "redis-test",
				API_REDIS_PORT: 6379,
				API_FRONTEND_URL: "http://localhost:4321",
			},
		});

		testServer.get("/test", async (request) => {
			loggerBindings = (
				request.log as unknown as { bindings: () => Record<string, unknown> }
			).bindings();
			return { ok: true };
		});

		await testServer.ready();

		const response = await testServer.inject({
			method: "GET",
			url: "/test",
			headers: { "x-correlation-id": "invalid-uuid-format" },
		});

		const responseCorrelationId = response.headers[
			"x-correlation-id"
		] as string;

		expect(loggerBindings).toBeDefined();
		expect(loggerBindings?.correlationId).toBe(responseCorrelationId);
		expect(loggerBindings?.correlationId).toMatch(UUID_REGEX);
		expect(loggerBindings?.correlationId).not.toBe("invalid-uuid-format");

		await testServer.close();
	});
});
