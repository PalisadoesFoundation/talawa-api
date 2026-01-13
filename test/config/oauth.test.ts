import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getProviderConfig, loadOAuthConfig } from "~/src/config/oauth";

describe("OAuth Configuration", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		// Save original environment
		originalEnv = { ...process.env };
	});

	afterEach(() => {
		// Restore original environment
		process.env = originalEnv;
	});

	describe("loadOAuthConfig", () => {
		it("should load valid configuration when all required environment variables are present", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				GITHUB_CLIENT_ID: "github-client-id",
				GITHUB_CLIENT_SECRET: "github-client-secret",
				GITHUB_REDIRECT_URI: "http://localhost:4000/auth/github/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "15000",
			};

			const config = loadOAuthConfig(mockEnv);

			expect(config).toEqual({
				google: {
					enabled: true,
					clientId: "google-client-id",
					clientSecret: "google-client-secret",
					redirectUri: "http://localhost:4000/auth/google/callback",
					requestTimeoutMs: 15000,
				},
				github: {
					enabled: true,
					clientId: "github-client-id",
					clientSecret: "github-client-secret",
					redirectUri: "http://localhost:4000/auth/github/callback",
					requestTimeoutMs: 15000,
				},
			});
		});

		it("should disable providers when required environment variables are missing", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				// Missing GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI
				GITHUB_CLIENT_ID: "github-client-id",
				GITHUB_CLIENT_SECRET: "github-client-secret",
				// Missing GITHUB_REDIRECT_URI
			};

			const config = loadOAuthConfig(mockEnv);

			expect(config.google.enabled).toBe(false);
			expect(config.github.enabled).toBe(false);
		});

		it("should use default timeout when API_OAUTH_REQUEST_TIMEOUT_MS is not provided", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
			};

			const config = loadOAuthConfig(mockEnv);

			expect(config.google.requestTimeoutMs).toBe(10000);
			expect(config.github.requestTimeoutMs).toBe(10000);
		});

		it("should use default timeout when API_OAUTH_REQUEST_TIMEOUT_MS is invalid", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "invalid-number",
			};

			const config = loadOAuthConfig(mockEnv);

			expect(config.google.requestTimeoutMs).toBe(10000);
			expect(config.github.requestTimeoutMs).toBe(10000);
		});

		it("should enable only Google when GitHub credentials are missing", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				GITHUB_CLIENT_ID: "github-client-id",
				// Missing GITHUB_CLIENT_SECRET and GITHUB_REDIRECT_URI
			};

			const config = loadOAuthConfig(mockEnv);

			expect(config.google.enabled).toBe(true);
			expect(config.github.enabled).toBe(false);
		});

		it("should enable only GitHub when Google credentials are missing", () => {
			const mockEnv = {
				// Missing all Google credentials
				GITHUB_CLIENT_ID: "github-client-id",
				GITHUB_CLIENT_SECRET: "github-client-secret",
				GITHUB_REDIRECT_URI: "http://localhost:4000/auth/github/callback",
			};

			const config = loadOAuthConfig(mockEnv);

			expect(config.google.enabled).toBe(false);
			expect(config.github.enabled).toBe(true);
		});
		it("should work with process.env when no env parameter is provided", () => {
			process.env.GOOGLE_CLIENT_ID = "google-client-id";
			process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
			process.env.GOOGLE_REDIRECT_URI =
				"http://localhost:4000/auth/google/callback";

			const config = loadOAuthConfig();

			expect(config.google.enabled).toBe(true);
			expect(config.google.clientId).toBe("google-client-id");
		});

		it("should populate fields even when provider is disabled", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				// Missing other required fields
			};

			const config = loadOAuthConfig(mockEnv);

			expect(config.google.enabled).toBe(false);
			expect(config.google.clientId).toBe("google-client-id");
			expect(config.google.clientSecret).toBe("");
		});
	});

	describe("getProviderConfig", () => {
		it("should return valid configuration for enabled Google provider", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "12000",
			};

			const config = getProviderConfig("google", mockEnv);

			expect(config).toEqual({
				enabled: true,
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
				redirectUri: "http://localhost:4000/auth/google/callback",
				requestTimeoutMs: 12000,
			});
		});

		it("should return valid configuration for enabled GitHub provider", () => {
			const mockEnv = {
				GITHUB_CLIENT_ID: "github-client-id",
				GITHUB_CLIENT_SECRET: "github-client-secret",
				GITHUB_REDIRECT_URI: "http://localhost:4000/auth/github/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "8000",
			};

			const config = getProviderConfig("github", mockEnv);

			expect(config).toEqual({
				enabled: true,
				clientId: "github-client-id",
				clientSecret: "github-client-secret",
				redirectUri: "http://localhost:4000/auth/github/callback",
				requestTimeoutMs: 8000,
			});
		});

		it("should throw error when provider is disabled due to missing credentials", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				// Missing GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI
			};

			expect(() => getProviderConfig("google", mockEnv)).toThrow(
				'OAuth provider "google" is not properly configured',
			);
		});

		it("should throw error when clientId is missing", () => {
			const mockEnv = {
				// Missing GOOGLE_CLIENT_ID
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
			};

			expect(() => getProviderConfig("google", mockEnv)).toThrow(
				'OAuth provider "google" is not properly configured',
			);
		});

		it("should throw error when clientSecret is missing", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				// Missing GOOGLE_CLIENT_SECRET
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
			};

			expect(() => getProviderConfig("google", mockEnv)).toThrow(
				'OAuth provider "google" is not properly configured',
			);
		});

		it("should throw error when redirectUri is missing", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				// Missing GOOGLE_REDIRECT_URI
			};

			expect(() => getProviderConfig("google", mockEnv)).toThrow(
				'OAuth provider "google" is not properly configured',
			);
		});

		it("should use default timeout when provider config has no timeout", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				// No API_OAUTH_REQUEST_TIMEOUT_MS
			};

			const config = getProviderConfig("google", mockEnv);

			expect(config.requestTimeoutMs).toBe(10000);
		});

		it("should fallback to minimum requestTimeoutMs if it is 0", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "0",
			};

			const config = getProviderConfig("google", mockEnv);

			// Expecting it to fall back to minimum 1000ms
			expect(config.requestTimeoutMs).toBe(1000);
		});

		it("should handle empty string environment variables as missing", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
			};

			expect(() => getProviderConfig("google", mockEnv)).toThrow(
				'OAuth provider "google" is not properly configured',
			);
		});

		it("should work with process.env when no env parameter is provided", () => {
			// Set up process.env
			process.env.GOOGLE_CLIENT_ID = "google-client-id";
			process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
			process.env.GOOGLE_REDIRECT_URI =
				"http://localhost:4000/auth/google/callback";
			process.env.API_OAUTH_REQUEST_TIMEOUT_MS = "5000";

			const config = getProviderConfig("google");

			expect(config).toEqual({
				enabled: true,
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
				redirectUri: "http://localhost:4000/auth/google/callback",
				requestTimeoutMs: 5000,
			});
		});
	});

	describe("Edge cases", () => {
		it("should apply the same timeout configuration to all providers", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				GITHUB_CLIENT_ID: "github-client-id",
				GITHUB_CLIENT_SECRET: "github-client-secret",
				GITHUB_REDIRECT_URI: "http://localhost:4000/auth/github/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "7500",
			};

			const googleConfig = getProviderConfig("google", mockEnv);
			const githubConfig = getProviderConfig("github", mockEnv);

			expect(googleConfig.requestTimeoutMs).toBe(7500);
			expect(githubConfig.requestTimeoutMs).toBe(7500);
		});

		it("should handle zero timeout value in loadOAuthConfig", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "0",
			};

			const config = loadOAuthConfig(mockEnv);
			// Expecting it to fall back to minimum 1000ms
			expect(config.google.requestTimeoutMs).toBe(1000);
		});

		it("should handle negative timeout value", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "-1000",
			};

			const config = loadOAuthConfig(mockEnv);
			// Expecting it to fall back to minimum 1000ms
			expect(config.google.requestTimeoutMs).toBe(1000);
		});

		it("should handle timeout value exceeding maximum limit", () => {
			const mockEnv = {
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
				API_OAUTH_REQUEST_TIMEOUT_MS: "120000",
			};

			const config = loadOAuthConfig(mockEnv);
			// Expecting it to be clamped to maximum 60000ms
			expect(config.google.requestTimeoutMs).toBe(60000);
			expect(config.github.requestTimeoutMs).toBe(60000);
		});
	});
});
