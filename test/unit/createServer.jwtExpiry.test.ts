vi.mock("@fastify/redis", () => ({
	default: async () => {},
}));

vi.mock("../../src/fastifyPlugins/index", () => ({
	default: async () => {},
}));

vi.mock("../../src/routes/index", () => ({
	default: async () => {},
}));

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "../../src/createServer";

describe("JWT expiration configuration", () => {
	let server: FastifyInstance;
	const API_JWT_EXPIRES_IN_MS = 900000; // 15 minutes in milliseconds

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
				API_JWT_EXPIRES_IN: API_JWT_EXPIRES_IN_MS,
			},
		});

		await server.ready();
	});

	afterEach(async () => {
		if (server) {
			await server.close();
		}
		vi.restoreAllMocks();
	});

	it("converts API_JWT_EXPIRES_IN from milliseconds to seconds for @fastify/jwt", async () => {
		const token = server.jwt.sign({ sub: "test-user-id" });
		const decoded = server.jwt.decode<{ iat: number; exp: number }>(token);

		expect(decoded).toBeDefined();
		expect(decoded?.exp).toBeDefined();
		expect(decoded?.iat).toBeDefined();

		const expectedExpiryInSeconds = Math.floor(API_JWT_EXPIRES_IN_MS / 1000);
		const actualExpiryInSeconds = decoded!.exp - decoded!.iat;

		// Should match 900 seconds (15 minutes), NOT 900000 seconds (~10.4 days)
		expect(actualExpiryInSeconds).toBe(expectedExpiryInSeconds);
	});
});
