import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import oauthProviderRegistry from "~/src/fastifyPlugins/oauthProviderRegistry";
import type { IOAuthProvider } from "~/src/utilities/auth/oauth/interfaces/IOAuthProvider";
import { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";
import { buildOAuthProviderRegistry } from "~/src/utilities/auth/oauth/providerFactory";

vi.mock("~/src/utilities/auth/oauth/providerFactory");

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
			const mockRegistry = OAuthProviderRegistry.getInstance();
			mockRegistry.clear();

			vi.mocked(buildOAuthProviderRegistry).mockReturnValue(mockRegistry);

			const logInfoSpy = vi.spyOn(fastify.log, "info");

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toHaveLength(0);
			expect(logInfoSpy).toHaveBeenCalledWith(
				"Initializing OAuth provider registry...",
			);
			expect(logInfoSpy).toHaveBeenCalledWith(
				"OAuth provider registry initialized with no providers (all disabled in config)",
			);
		});

		it("should initialize registry with Google provider when enabled", async () => {
			const mockRegistry = OAuthProviderRegistry.getInstance();
			mockRegistry.clear();

			// Create a mock Google provider
			const mockGoogleProvider = {
				getProviderName: vi.fn().mockReturnValue("google"),
				getAuthorizationUrl: vi.fn(),
				exchangeCodeForTokens: vi.fn(),
				getUserProfile: vi.fn(),
			};

			mockRegistry.register(mockGoogleProvider as IOAuthProvider);

			vi.mocked(buildOAuthProviderRegistry).mockReturnValue(mockRegistry);

			const logInfoSpy = vi.spyOn(fastify.log, "info");

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toContain("google");
			expect(fastify.oauthProviderRegistry.has("google")).toBe(true);

			const googleProvider = fastify.oauthProviderRegistry.get("google");
			expect(googleProvider.getProviderName()).toBe("google");

			expect(logInfoSpy).toHaveBeenCalledWith(
				"Initializing OAuth provider registry...",
			);
			expect(logInfoSpy).toHaveBeenCalledWith(
				{ providers: ["google"] },
				"OAuth provider registry initialized with 1 provider(s)",
			);
		});

		it("should initialize registry with GitHub provider when enabled", async () => {
			const mockRegistry = OAuthProviderRegistry.getInstance();
			mockRegistry.clear();

			// Create a mock GitHub provider
			const mockGitHubProvider = {
				getProviderName: vi.fn().mockReturnValue("github"),
				getAuthorizationUrl: vi.fn(),
				exchangeCodeForTokens: vi.fn(),
				getUserProfile: vi.fn(),
			};

			mockRegistry.register(mockGitHubProvider as IOAuthProvider);

			vi.mocked(buildOAuthProviderRegistry).mockReturnValue(mockRegistry);

			const logInfoSpy = vi.spyOn(fastify.log, "info");

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toContain("github");
			expect(fastify.oauthProviderRegistry.has("github")).toBe(true);

			const githubProvider = fastify.oauthProviderRegistry.get("github");
			expect(githubProvider.getProviderName()).toBe("github");

			expect(logInfoSpy).toHaveBeenCalledWith(
				"Initializing OAuth provider registry...",
			);
			expect(logInfoSpy).toHaveBeenCalledWith(
				{ providers: ["github"] },
				"OAuth provider registry initialized with 1 provider(s)",
			);
		});

		it("should initialize registry with both providers when enabled", async () => {
			const mockRegistry = OAuthProviderRegistry.getInstance();
			mockRegistry.clear();

			// Create mock providers
			const mockGoogleProvider = {
				getProviderName: vi.fn().mockReturnValue("google"),
				getAuthorizationUrl: vi.fn(),
				exchangeCodeForTokens: vi.fn(),
				getUserProfile: vi.fn(),
			};

			const mockGitHubProvider = {
				getProviderName: vi.fn().mockReturnValue("github"),
				getAuthorizationUrl: vi.fn(),
				exchangeCodeForTokens: vi.fn(),
				getUserProfile: vi.fn(),
			};

			mockRegistry.register(mockGoogleProvider as IOAuthProvider);
			mockRegistry.register(mockGitHubProvider as IOAuthProvider);

			vi.mocked(buildOAuthProviderRegistry).mockReturnValue(mockRegistry);

			const logInfoSpy = vi.spyOn(fastify.log, "info");

			await fastify.register(oauthProviderRegistry);

			expect(fastify.oauthProviderRegistry).toBeDefined();
			expect(fastify.oauthProviderRegistry.listProviders()).toHaveLength(2);
			expect(fastify.oauthProviderRegistry.has("google")).toBe(true);
			expect(fastify.oauthProviderRegistry.has("github")).toBe(true);

			expect(logInfoSpy).toHaveBeenCalledWith(
				"Initializing OAuth provider registry...",
			);
			expect(logInfoSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					providers: expect.arrayContaining(["google", "github"]),
				}),
				"OAuth provider registry initialized with 2 provider(s)",
			);
		});
	});

	describe("registry availability", () => {
		it("should make registry accessible via fastify instance", async () => {
			const mockRegistry = OAuthProviderRegistry.getInstance();
			mockRegistry.clear();

			const mockGoogleProvider = {
				getProviderName: vi.fn().mockReturnValue("google"),
				getAuthorizationUrl: vi.fn(),
				exchangeCodeForTokens: vi.fn(),
				getUserProfile: vi.fn(),
			};

			mockRegistry.register(mockGoogleProvider as IOAuthProvider);

			vi.mocked(buildOAuthProviderRegistry).mockReturnValue(mockRegistry);

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
			const mockRegistry = OAuthProviderRegistry.getInstance();
			mockRegistry.clear();

			const mockGoogleProvider = {
				getProviderName: vi.fn().mockReturnValue("google"),
				getAuthorizationUrl: vi.fn(),
				exchangeCodeForTokens: vi.fn(),
				getUserProfile: vi.fn(),
			};

			mockRegistry.register(mockGoogleProvider as IOAuthProvider);

			vi.mocked(buildOAuthProviderRegistry).mockReturnValue(mockRegistry);

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
		it("should handle initialization gracefully when buildOAuthProviderRegistry throws error", async () => {
			const error = new Error("Configuration error");
			vi.mocked(buildOAuthProviderRegistry).mockImplementation(() => {
				throw error;
			});

			const logErrorSpy = vi.spyOn(fastify.log, "error");

			await expect(fastify.register(oauthProviderRegistry)).rejects.toThrow(
				"Configuration error",
			);

			expect(logErrorSpy).toHaveBeenCalledWith(
				{ error },
				"Failed to initialize OAuth provider registry",
			);
		});
	});
});
