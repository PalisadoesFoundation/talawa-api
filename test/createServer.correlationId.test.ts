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
				API_COOKIE_SECRET: "test",
				API_JWT_SECRET: "test",
				API_REDIS_HOST: "redis-test",
				API_REDIS_PORT: 6379,
				FRONTEND_URL: "http://localhost:4321",
			},
		});

		// Minimal route for testing
		server.get("/test", async () => {
			return { ok: true };
		});

		await server.ready();
	});

	afterEach(async () => {
		await server.close();
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
});
