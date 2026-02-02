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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as oauthConfig from "~/src/config/oauth";
import { createServer } from "~/src/createServer";
import { testEnvConfig } from "../envConfigSchema";

vi.mock("~/src/config/oauth");

describe("GraphQL Context OAuth Provider Registry Integration", () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		vi.clearAllMocks();
	});

	afterEach(async () => {
		if (server) {
			await server.close();
		}
	});

	describe("context creation with OAuth registry", () => {
		it("should include oauthProviderRegistry in GraphQL context when no providers enabled", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
					requestTimeoutMs: 10000,
				},
			});

			server = await createServer({
				envConfig: {
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
					API_RATE_LIMIT_REFILL_RATE: 10000,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});
			await server.ready();

			// Verify registry is attached to server
			expect(server.oauthProviderRegistry).toBeDefined();
			expect(server.oauthProviderRegistry.listProviders()).toHaveLength(0);

			// Test that GraphQL requests work with empty registry
			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: `
						query {
							__typename
						}
					`,
				},
				headers: {
					"content-type": "application/json",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.data.__typename).toBe("Query");
		});

		it("should include oauthProviderRegistry in GraphQL context when Google provider enabled", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "test-google-client-id",
					clientSecret: "test-google-client-secret",
					redirectUri: "https://test.com/auth/google/callback",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockReturnValue({
				enabled: true,
				clientId: "test-google-client-id",
				clientSecret: "test-google-client-secret",
				redirectUri: "https://test.com/auth/google/callback",
				requestTimeoutMs: 10000,
			});

			server = await createServer({
				envConfig: {
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
					API_RATE_LIMIT_REFILL_RATE: 10000,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});
			await server.ready();

			// Verify registry is attached to server with Google provider
			expect(server.oauthProviderRegistry).toBeDefined();
			expect(server.oauthProviderRegistry.listProviders()).toContain("google");
			expect(server.oauthProviderRegistry.has("google")).toBe(true);

			// Test that GraphQL requests work with Google provider
			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: `
						query {
							__typename
						}
					`,
				},
				headers: {
					"content-type": "application/json",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.data.__typename).toBe("Query");
		});

		it("should include oauthProviderRegistry in GraphQL context when both providers enabled", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "test-google-client-id",
					clientSecret: "test-google-client-secret",
					redirectUri: "https://test.com/auth/google/callback",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: true,
					clientId: "test-github-client-id",
					clientSecret: "test-github-client-secret",
					redirectUri: "https://test.com/auth/github/callback",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockImplementation((provider) =>
				provider === "google"
					? {
							enabled: true,
							clientId: "test-google-client-id",
							clientSecret: "test-google-client-secret",
							redirectUri: "https://test.com/auth/google/callback",
							requestTimeoutMs: 10000,
						}
					: {
							enabled: true,
							clientId: "test-github-client-id",
							clientSecret: "test-github-client-secret",
							redirectUri: "https://test.com/auth/github/callback",
							requestTimeoutMs: 10000,
						},
			);

			server = await createServer({
				envConfig: {
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
					API_RATE_LIMIT_REFILL_RATE: 10000,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});
			await server.ready();

			// Verify registry is attached to server with both providers
			expect(server.oauthProviderRegistry).toBeDefined();
			expect(server.oauthProviderRegistry.listProviders()).toHaveLength(2);
			expect(server.oauthProviderRegistry.has("google")).toBe(true);
			expect(server.oauthProviderRegistry.has("github")).toBe(true);

			// Test that GraphQL requests work with both providers
			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: `
						query {
							__typename
						}
					`,
				},
				headers: {
					"content-type": "application/json",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.data.__typename).toBe("Query");
		});

		it("should maintain registry state across multiple GraphQL requests", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "test-google-client-id",
					clientSecret: "test-google-client-secret",
					redirectUri: "https://test.com/auth/google/callback",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockReturnValue({
				enabled: true,
				clientId: "test-google-client-id",
				clientSecret: "test-google-client-secret",
				redirectUri: "https://test.com/auth/google/callback",
				requestTimeoutMs: 10000,
			});

			server = await createServer({
				envConfig: {
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
					API_RATE_LIMIT_REFILL_RATE: 10000,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});
			await server.ready();

			// First request
			const response1 = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: `
						query {
							__typename
						}
					`,
				},
				headers: {
					"content-type": "application/json",
				},
			});

			expect(response1.statusCode).toBe(200);

			// Verify registry state after first request
			expect(server.oauthProviderRegistry.listProviders()).toContain("google");

			// Second request
			const response2 = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: `
						query {
							__typename
						}
					`,
				},
				headers: {
					"content-type": "application/json",
				},
			});

			expect(response2.statusCode).toBe(200);

			// Verify registry state is maintained after second request
			expect(server.oauthProviderRegistry.listProviders()).toContain("google");
		});
	});

	describe("registry accessibility", () => {
		it("should allow providers to be retrieved from registry within resolvers", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "test-client-id",
					clientSecret: "test-client-secret",
					redirectUri: "https://test.com/callback",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockReturnValue({
				enabled: true,
				clientId: "test-client-id",
				clientSecret: "test-client-secret",
				redirectUri: "https://test.com/callback",
				requestTimeoutMs: 10000,
			});

			server = await createServer({
				envConfig: {
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
					API_RATE_LIMIT_REFILL_RATE: 10000,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});
			await server.ready();

			// Verify provider can be retrieved
			const provider = server.oauthProviderRegistry.get("google");
			expect(provider).toBeDefined();
			expect(provider.getProviderName()).toBe("google");
		});

		it("should throw error when accessing non-existent provider", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
					requestTimeoutMs: 10000,
				},
			});

			server = await createServer({
				envConfig: {
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
					API_RATE_LIMIT_REFILL_RATE: 10000,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});
			await server.ready();

			// Attempt to access non-existent provider
			expect(() => server.oauthProviderRegistry.get("google")).toThrow();
		});
	});
});
