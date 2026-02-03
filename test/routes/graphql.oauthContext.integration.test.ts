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
import { initGraphQLTada } from "gql.tada";
import { createMercuriusTestClient } from "mercurius-integration-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as oauthConfig from "~/src/config/oauth";
import { createServer } from "~/src/createServer";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";
import { testEnvConfig } from "../envConfigSchema";
import type { introspection } from "../graphql/types/gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_Typename = gql(`
	query Query_Typename {
		__typename
	}
`);

vi.mock("~/src/config/oauth");

function assertRegistryInContext(
	capturedContext: Record<string, unknown> | null,
	expectedProviders: string[],
): void {
	expect(capturedContext).toBeDefined();
	const registry =
		capturedContext?.oauthProviderRegistry as OAuthProviderRegistry;
	expect(registry).toBeDefined();
	expect(registry.listProviders()).toHaveLength(expectedProviders.length);
	for (const provider of expectedProviders) {
		expect(registry.has(provider)).toBe(true);
	}
}

describe("GraphQL Context OAuth Provider Registry Integration", () => {
	let server: FastifyInstance;
	let mercuriusClient: ReturnType<typeof createMercuriusTestClient>;

	beforeEach(async () => {
		vi.resetAllMocks();
	});

	afterEach(async () => {
		if (server) {
			await server.close();
		}
		//Clear singleton registry after each test
		OAuthProviderRegistry.getInstance().clear();
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

			mercuriusClient = createMercuriusTestClient(server, {
				url: "/graphql",
			});

			// Verify registry is attached to server
			expect(server.oauthProviderRegistry).toBeDefined();
			expect(server.oauthProviderRegistry.listProviders()).toHaveLength(0);

			// Test resolver-level access to oauthProviderRegistry in context
			// Use preExecution hook to capture context and verify oauthProviderRegistry
			let capturedContext: Record<string, unknown> | null = null;
			server.graphql.addHook(
				"preExecution",
				async (_schema, _document, context) => {
					capturedContext = context as unknown as Record<string, unknown>;
				},
			);

			const response = await mercuriusClient.query(Query_Typename);

			expect(response.data?.__typename).toBe("Query");

			// Assert that the resolver context includes oauthProviderRegistry
			assertRegistryInContext(capturedContext, []);
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

			mercuriusClient = createMercuriusTestClient(server, {
				url: "/graphql",
			});

			// Verify registry is attached to server with Google provider
			expect(server.oauthProviderRegistry).toBeDefined();
			expect(server.oauthProviderRegistry.listProviders()).toContain("google");
			expect(server.oauthProviderRegistry.has("google")).toBe(true);

			// Test resolver-level access to oauthProviderRegistry with Google provider
			let capturedContext: Record<string, unknown> | null = null;
			server.graphql.addHook(
				"preExecution",
				async (_schema, _document, context) => {
					capturedContext = context as unknown as Record<string, unknown>;
				},
			);

			const response = await mercuriusClient.query(Query_Typename);

			expect(response.data?.__typename).toBe("Query");

			// Assert that the resolver context includes oauthProviderRegistry with Google provider
			assertRegistryInContext(capturedContext, ["google"]);
			expect(
				(
					(capturedContext as Record<string, unknown> | null)
						?.oauthProviderRegistry as { has: (name: string) => boolean }
				).has("google"),
			).toBe(true);
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

			mercuriusClient = createMercuriusTestClient(server, {
				url: "/graphql",
			});

			// Verify registry is attached to server with both providers
			expect(server.oauthProviderRegistry).toBeDefined();
			expect(server.oauthProviderRegistry.listProviders()).toHaveLength(2);
			expect(server.oauthProviderRegistry.has("google")).toBe(true);
			expect(server.oauthProviderRegistry.has("github")).toBe(true);

			// Test resolver-level access to oauthProviderRegistry with both providers
			let capturedContext: Record<string, unknown> | null = null;
			server.graphql.addHook(
				"preExecution",
				async (_schema, _document, context) => {
					capturedContext = context as unknown as Record<string, unknown>;
				},
			);

			const response = await mercuriusClient.query(Query_Typename);

			expect(response.data?.__typename).toBe("Query");

			// Assert that the resolver context includes oauthProviderRegistry with both providers
			assertRegistryInContext(capturedContext, ["google", "github"]);
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

			mercuriusClient = createMercuriusTestClient(server, {
				url: "/graphql",
			});

			// First request
			const response1 = await mercuriusClient.query(Query_Typename);

			expect(response1.data?.__typename).toBe("Query");

			// Verify registry state after first request
			expect(server.oauthProviderRegistry.listProviders()).toContain("google");

			// Second request
			const response2 = await mercuriusClient.query(Query_Typename);

			expect(response2.data?.__typename).toBe("Query");

			// Verify registry state is maintained after second request
			expect(server.oauthProviderRegistry.listProviders()).toContain("google");
		});
	});
});
