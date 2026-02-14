import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as oauthConfig from "~/src/config/oauth";
import { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";
import { buildOAuthProviderRegistry } from "~/src/utilities/auth/oauth/providerFactory";

vi.mock("~/src/config/oauth");

describe("buildOAuthProviderRegistry", () => {
	let registry: OAuthProviderRegistry;

	beforeEach(() => {
		// Get and clear the singleton instance before each test
		registry = OAuthProviderRegistry.getInstance();
		registry.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		registry.clear();
		vi.restoreAllMocks();
	});

	describe("with no providers enabled", () => {
		it("should return empty registry when no providers are enabled", () => {
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

			const result = buildOAuthProviderRegistry();

			expect(result).toBe(registry);
			expect(result.listProviders()).toHaveLength(0);
			expect(oauthConfig.loadOAuthConfig).toHaveBeenCalledOnce();
		});
	});

	describe("with Google provider enabled", () => {
		it("should register Google provider when enabled", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "https://example.com/auth/google/callback",
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
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
				redirectUri: "https://example.com/auth/google/callback",
				requestTimeoutMs: 10000,
			});

			const result = buildOAuthProviderRegistry();

			expect(result.listProviders()).toContain("google");
			expect(result.listProviders()).toHaveLength(1);
			expect(result.has("google")).toBe(true);
			expect(oauthConfig.getProviderConfig).toHaveBeenCalledWith("google");
		});

		it("should retrieve registered Google provider correctly", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "https://example.com/auth/google/callback",
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
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
				redirectUri: "https://example.com/auth/google/callback",
				requestTimeoutMs: 10000,
			});

			const result = buildOAuthProviderRegistry();
			const googleProvider = result.get("google");

			expect(googleProvider).toBeDefined();
			expect(googleProvider.getProviderName()).toBe("google");
		});
	});

	describe("with GitHub provider enabled", () => {
		it("should register GitHub provider when enabled", () => {
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
					clientId: "github-client-id",
					clientSecret: "github-client-secret",
					redirectUri: "https://example.com/auth/github/callback",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockReturnValue({
				enabled: true,
				clientId: "github-client-id",
				clientSecret: "github-client-secret",
				redirectUri: "https://example.com/auth/github/callback",
				requestTimeoutMs: 10000,
			});

			const result = buildOAuthProviderRegistry();

			expect(result.listProviders()).toContain("github");
			expect(result.listProviders()).toHaveLength(1);
			expect(result.has("github")).toBe(true);
			expect(oauthConfig.getProviderConfig).toHaveBeenCalledWith("github");
		});

		it("should retrieve registered GitHub provider correctly", () => {
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
					clientId: "github-client-id",
					clientSecret: "github-client-secret",
					redirectUri: "https://example.com/auth/github/callback",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockReturnValue({
				enabled: true,
				clientId: "github-client-id",
				clientSecret: "github-client-secret",
				redirectUri: "https://example.com/auth/github/callback",
				requestTimeoutMs: 10000,
			});

			const result = buildOAuthProviderRegistry();
			const githubProvider = result.get("github");

			expect(githubProvider).toBeDefined();
			expect(githubProvider.getProviderName()).toBe("github");
		});
	});

	describe("with both providers enabled", () => {
		it("should register both Google and GitHub providers", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "https://example.com/auth/google/callback",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: true,
					clientId: "github-client-id",
					clientSecret: "github-client-secret",
					redirectUri: "https://example.com/auth/github/callback",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockImplementation((provider) =>
				provider === "google"
					? {
							enabled: true,
							clientId: "google-client-id",
							clientSecret: "google-client-secret",
							redirectUri: "https://example.com/auth/google/callback",
							requestTimeoutMs: 10000,
						}
					: {
							enabled: true,
							clientId: "github-client-id",
							clientSecret: "github-client-secret",
							redirectUri: "https://example.com/auth/github/callback",
							requestTimeoutMs: 10000,
						},
			);

			const result = buildOAuthProviderRegistry();

			expect(result.listProviders()).toHaveLength(2);
			expect(result.listProviders()).toContain("google");
			expect(result.listProviders()).toContain("github");
			expect(result.has("google")).toBe(true);
			expect(result.has("github")).toBe(true);
		});

		it("should retrieve both providers correctly", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "https://example.com/auth/google/callback",
					requestTimeoutMs: 10000,
				},
				github: {
					enabled: true,
					clientId: "github-client-id",
					clientSecret: "github-client-secret",
					redirectUri: "https://example.com/auth/github/callback",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockImplementation((provider) =>
				provider === "google"
					? {
							enabled: true,
							clientId: "google-client-id",
							clientSecret: "google-client-secret",
							redirectUri: "https://example.com/auth/google/callback",
							requestTimeoutMs: 10000,
						}
					: {
							enabled: true,
							clientId: "github-client-id",
							clientSecret: "github-client-secret",
							redirectUri: "https://example.com/auth/github/callback",
							requestTimeoutMs: 10000,
						},
			);

			const result = buildOAuthProviderRegistry();

			const googleProvider = result.get("google");
			const githubProvider = result.get("github");

			expect(googleProvider.getProviderName()).toBe("google");
			expect(githubProvider.getProviderName()).toBe("github");
		});
	});

	describe("idempotency", () => {
		it("should clear existing providers before rebuilding", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "https://example.com/auth/google/callback",
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
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
				redirectUri: "https://example.com/auth/google/callback",
				requestTimeoutMs: 10000,
			});

			// First build
			const result1 = buildOAuthProviderRegistry();
			expect(result1.listProviders()).toHaveLength(1);
			expect(result1.listProviders()).toContain("google");

			// Second build with different config
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
					clientId: "github-client-id",
					clientSecret: "github-client-secret",
					redirectUri: "https://example.com/auth/github/callback",
					requestTimeoutMs: 10000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockReturnValue({
				enabled: true,
				clientId: "github-client-id",
				clientSecret: "github-client-secret",
				redirectUri: "https://example.com/auth/github/callback",
				requestTimeoutMs: 10000,
			});

			const result2 = buildOAuthProviderRegistry();
			expect(result2.listProviders()).toHaveLength(1);
			expect(result2.listProviders()).toContain("github");
			expect(result2.listProviders()).not.toContain("google");
		});

		it("should return the same singleton instance", () => {
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

			const result1 = buildOAuthProviderRegistry();
			const result2 = buildOAuthProviderRegistry();

			expect(result1).toBe(result2);
		});
	});

	describe("configuration variations", () => {
		it("should handle custom request timeout", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "https://example.com/auth/google/callback",
					requestTimeoutMs: 30000, // Custom timeout
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
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
				redirectUri: "https://example.com/auth/google/callback",
				requestTimeoutMs: 30000,
			});

			const result = buildOAuthProviderRegistry();

			expect(result.has("google")).toBe(true);
			expect(oauthConfig.getProviderConfig).toHaveBeenCalledWith("google");
		});

		it("should propagate getProviderConfig errors", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "https://example.com/auth/google/callback",
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

			vi.mocked(oauthConfig.getProviderConfig).mockImplementation(() => {
				throw new Error("Invalid configuration");
			});

			expect(() => buildOAuthProviderRegistry()).toThrow(
				"Invalid configuration",
			);
		});
	});

	describe("environment-specific scenarios", () => {
		it("should work correctly in development with all providers disabled", () => {
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

			const result = buildOAuthProviderRegistry();

			expect(result.listProviders()).toHaveLength(0);
			expect(() => result.get("google")).toThrow();
			expect(() => result.get("github")).toThrow();
		});

		it("should work correctly in production with all providers enabled", () => {
			vi.mocked(oauthConfig.loadOAuthConfig).mockReturnValue({
				google: {
					enabled: true,
					clientId: "prod-google-client-id",
					clientSecret: "prod-google-client-secret",
					redirectUri: "https://production.com/auth/google/callback",
					requestTimeoutMs: 15000,
				},
				github: {
					enabled: true,
					clientId: "prod-github-client-id",
					clientSecret: "prod-github-client-secret",
					redirectUri: "https://production.com/auth/github/callback",
					requestTimeoutMs: 15000,
				},
			});

			vi.mocked(oauthConfig.getProviderConfig).mockImplementation((provider) =>
				provider === "google"
					? {
							enabled: true,
							clientId: "prod-google-client-id",
							clientSecret: "prod-google-client-secret",
							redirectUri: "https://production.com/auth/google/callback",
							requestTimeoutMs: 15000,
						}
					: {
							enabled: true,
							clientId: "prod-github-client-id",
							clientSecret: "prod-github-client-secret",
							redirectUri: "https://production.com/auth/github/callback",
							requestTimeoutMs: 15000,
						},
			);

			const result = buildOAuthProviderRegistry();

			expect(result.listProviders()).toHaveLength(2);
			expect(result.has("google")).toBe(true);
			expect(result.has("github")).toBe(true);
		});
	});
});
