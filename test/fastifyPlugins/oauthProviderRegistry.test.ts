import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as oauthConfig from "~/src/config/oauth";
import oauthProviderRegistry from "~/src/fastifyPlugins/oauthProviderRegistry";

vi.mock("~/src/config/oauth");

describe("oauthProviderRegistry plugin", () => {
	let fastify: FastifyInstance;

	beforeEach(() => {
		fastify = Fastify({ logger: { level: "silent" } });
		vi.clearAllMocks();
	});

	afterEach(async () => {
		if (fastify) {
			await fastify.close();
		}
		vi.restoreAllMocks();
	});

	describe("plugin initialization", () => {
		it("should initialize registry with no providers when all are disabled", async () => {
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

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toHaveLength(0);
		});

		it("should initialize registry with Google provider when enabled", async () => {
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

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toContain("google");
			expect(fastify.oauthProviderRegistry.has("google")).toBe(true);

			const googleProvider = fastify.oauthProviderRegistry.get("google");
			expect(googleProvider.getProviderName()).toBe("google");
		});

		it("should initialize registry with GitHub provider when enabled", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: false,
					clientId: "",
					clientSecret: "",
					redirectUri: "",
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

			vi.mocked(oauthConfig.getProviderConfig).mockReturnValue({
				enabled: true,
				clientId: "test-github-client-id",
				clientSecret: "test-github-client-secret",
				redirectUri: "https://test.com/auth/github/callback",
				requestTimeoutMs: 10000,
			});

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toContain("github");
			expect(fastify.oauthProviderRegistry.has("github")).toBe(true);

			const githubProvider = fastify.oauthProviderRegistry.get("github");
			expect(githubProvider.getProviderName()).toBe("github");
		});

		it("should initialize registry with both providers when enabled", async () => {
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

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toHaveLength(2);
			expect(fastify.oauthProviderRegistry.has("google")).toBe(true);
			expect(fastify.oauthProviderRegistry.has("github")).toBe(true);
		});
	});

	describe("registry availability", () => {
		it("should make registry accessible via fastify instance", async () => {
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

			await fastify.register(oauthProviderRegistry);

			// Registry should be accessible from the fastify instance
			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(typeof fastify.oauthProviderRegistry.get).toBe("function");
			expect(typeof fastify.oauthProviderRegistry.has).toBe("function");
			expect(typeof fastify.oauthProviderRegistry.listProviders).toBe(
				"function",
			);
		});

		it("should maintain registry state across multiple requests", async () => {
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

			await fastify.register(oauthProviderRegistry);

			// First access
			const providers1 = fastify.oauthProviderRegistry.listProviders();
			expect(providers1).toContain("google");

			// Second access - should return same data
			const providers2 = fastify.oauthProviderRegistry.listProviders();
			expect(providers2).toEqual(providers1);
		});
	});

	describe("error handling", () => {
		it("should handle initialization gracefully when config throws error", async () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockImplementation(() => {
				throw new Error("Configuration error");
			});

			await expect(fastify.register(oauthProviderRegistry)).rejects.toThrow(
				"Configuration error",
			);
		});
	});
});
