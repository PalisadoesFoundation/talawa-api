import axios, { type AxiosError, type AxiosResponse } from "axios";
import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	OAuthError,
	ProfileFetchError,
	TokenExchangeError,
} from "~/src/utilities/auth/oauth/errors";
import { GitHubOAuthProvider } from "~/src/utilities/auth/oauth/providers/GitHubOAuthProvider";
import type {
	OAuthConfig,
	OAuthProviderTokenResponse,
} from "~/src/utilities/auth/oauth/types";

// Mock axios
vi.mock("axios", () => ({
	default: {
		post: vi.fn(),
		get: vi.fn(),
		isAxiosError: vi.fn(),
	},
	isAxiosError: vi.fn(),
	AxiosError: class MockAxiosError extends Error {
		constructor(message: string) {
			super(message);
			this.name = "AxiosError";
		}
		isAxiosError = true;
	},
}));

const mockedAxios = vi.mocked(axios);
const mockedPost = mockedAxios.post as MockedFunction<typeof axios.post>;
const mockedGet = mockedAxios.get as MockedFunction<typeof axios.get>;
const mockedIsAxiosError = vi.fn();

// Override axios.isAxiosError with our mock
Object.defineProperty(axios, "isAxiosError", {
	value: mockedIsAxiosError,
	configurable: true,
});

describe("GitHubOAuthProvider", () => {
	let provider: GitHubOAuthProvider;
	let config: OAuthConfig;

	beforeEach(() => {
		vi.clearAllMocks();

		config = {
			clientId: "github_client_id",
			clientSecret: "github_client_secret",
			redirectUri: "http://localhost:3000/auth/callback/github",
		};

		provider = new GitHubOAuthProvider(config);
	});

	describe("constructor", () => {
		it("should initialize with github provider name", () => {
			expect(provider).toBeDefined();
			expect(provider.getProviderName()).toBe("github");
		});

		it("should store config properly", () => {
			const providerWithConfig = new GitHubOAuthProvider(config);
			expect(providerWithConfig).toBeDefined();
		});
	});

	describe("exchangeCodeForTokens", () => {
		const validCode = "github_auth_code_123";
		const redirectUri = "http://localhost:3000/auth/callback/github";

		it("should successfully exchange code for tokens", async () => {
			const mockTokenResponse: OAuthProviderTokenResponse = {
				access_token: "gho_1234567890abcdef",
				token_type: "bearer",
				expires_in: 28800,
				refresh_token: "ghr_1234567890abcdef",
			};

			mockedPost.mockResolvedValueOnce({
				data: mockTokenResponse,
			} as AxiosResponse);

			const result = await provider.exchangeCodeForTokens(
				validCode,
				redirectUri,
			);

			expect(result).toEqual({
				access_token: "gho_1234567890abcdef",
				token_type: "bearer",
				expires_in: 28800,
				refresh_token: "ghr_1234567890abcdef",
			});

			expect(mockedPost).toHaveBeenCalledWith(
				"https://github.com/login/oauth/access_token",
				expect.any(URLSearchParams),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Accept: "application/json",
					},
					timeout: 10000,
				},
			);

			// Verify URLSearchParams content
			const call = mockedPost.mock.calls[0];
			const urlParams = call?.[1] as URLSearchParams;
			expect(urlParams.get("client_id")).toBe("github_client_id");
			expect(urlParams.get("client_secret")).toBe("github_client_secret");
			expect(urlParams.get("code")).toBe(validCode);
			expect(urlParams.get("redirect_uri")).toBe(redirectUri);
		});

		it("should use config redirectUri when redirectUri parameter is not provided", async () => {
			const mockTokenResponse: OAuthProviderTokenResponse = {
				access_token: "gho_1234567890abcdef",
				token_type: "bearer",
			};

			mockedPost.mockResolvedValueOnce({
				data: mockTokenResponse,
			} as AxiosResponse);

			await provider.exchangeCodeForTokens(validCode, "");

			const call = mockedPost.mock.calls[0];
			const urlParams = call?.[1] as URLSearchParams;
			expect(urlParams.get("redirect_uri")).toBe(config.redirectUri);
		});

		it("should handle token exchange without optional fields", async () => {
			const mockTokenResponse = {
				access_token: "gho_1234567890abcdef",
				token_type: "bearer",
			};

			mockedPost.mockResolvedValueOnce({
				data: mockTokenResponse,
			} as AxiosResponse);

			const result = await provider.exchangeCodeForTokens(
				validCode,
				redirectUri,
			);

			expect(result).toEqual({
				access_token: "gho_1234567890abcdef",
				token_type: "bearer",
				expires_in: undefined,
				refresh_token: undefined,
			});
		});

		it("should validate config before making request", async () => {
			expect(() => {
				new GitHubOAuthProvider({
					clientId: "",
					redirectUri: "http://localhost:3000/auth/callback/github",
					clientSecret: "secret",
				});
			}).toThrow(OAuthError);
		});

		it("should handle GitHub API errors", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Bad credentials",
				response: {
					data: {
						error: "invalid_client",
						error_description: "Client authentication failed",
					},
				},
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValueOnce(axiosError);

			await expect(
				provider.exchangeCodeForTokens(validCode, redirectUri),
			).rejects.toThrow(TokenExchangeError);
		});

		it("should handle network errors", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Network Error",
				code: "ECONNABORTED",
				response: undefined,
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValueOnce(axiosError);

			await expect(
				provider.exchangeCodeForTokens(validCode, redirectUri),
			).rejects.toThrow(TokenExchangeError);
		});

		it("should throw error when redirect_uri parameter is empty and config is missing", async () => {
			// Test that exchangeCodeForTokens throws when both redirectUri parameter and config.redirectUri are missing
			const configWithoutRedirect: OAuthConfig = {
				clientId: "github_client_id",
				clientSecret: "github_client_secret",
				// redirectUri is undefined/missing
			};

			// Constructor should succeed since redirectUri is optional in OAuthConfig
			const providerWithoutRedirect = new GitHubOAuthProvider(
				configWithoutRedirect,
			);

			// But exchangeCodeForTokens should throw when both parameter and config redirectUri are missing
			await expect(
				providerWithoutRedirect.exchangeCodeForTokens(validCode, ""),
			).rejects.toThrow(TokenExchangeError);

			await expect(
				providerWithoutRedirect.exchangeCodeForTokens(validCode, ""),
			).rejects.toThrow("redirect_uri is required but was not provided");
		});

		it("should handle GitHub OAuth errors in HTTP 200 response", async () => {
			const errorResponse = {
				error: "bad_verification_code",
				error_description: "The code passed is incorrect or expired.",
			};

			mockedPost.mockResolvedValue({
				data: errorResponse,
			} as AxiosResponse);

			await expect(
				provider.exchangeCodeForTokens(validCode, redirectUri),
			).rejects.toThrow(TokenExchangeError);

			try {
				await provider.exchangeCodeForTokens(validCode, redirectUri);
			} catch (error) {
				if (error instanceof TokenExchangeError) {
					// Should include error_description in the message
					expect(error.message).toBe(
						"Token exchange failed: The code passed is incorrect or expired.",
					);
				}
			}
		});

		it("should handle GitHub OAuth errors without description", async () => {
			const errorResponse = {
				error: "invalid_grant",
			};

			mockedPost.mockResolvedValue({
				data: errorResponse,
			} as AxiosResponse);

			try {
				await provider.exchangeCodeForTokens(validCode, redirectUri);
			} catch (error) {
				if (error instanceof TokenExchangeError) {
					// Should fallback to error field when error_description is missing
					expect(error.message).toBe("Token exchange failed: invalid_grant");
				}
			}
		});

		it("should throw TokenExchangeError when redirect_uri cannot be resolved", async () => {
			// Create a provider instance bypassing constructor validation to test
			// the specific redirect_uri validation in exchangeCodeForTokens.
			// This simulates an edge case where config.redirectUri is undefined.
			const tempProvider = Object.create(GitHubOAuthProvider.prototype);
			tempProvider.config = {
				clientId: "github_client_id",
				clientSecret: "github_client_secret",
				redirectUri: undefined, // This simulates the case where redirectUri is missing
			};
			tempProvider.post = vi.fn();

			// Test the specific validation logic in exchangeCodeForTokens
			await expect(
				tempProvider.exchangeCodeForTokens("valid_code", ""),
			).rejects.toThrow(TokenExchangeError);

			await expect(
				tempProvider.exchangeCodeForTokens("valid_code", ""),
			).rejects.toThrow("redirect_uri is required but was not provided");
		});
	});

	describe("getUserProfile", () => {
		const accessToken = "gho_1234567890abcdef";

		it("should successfully get user profile with email from user endpoint", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: "octocat@github.com",
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			mockedGet.mockResolvedValueOnce({
				data: mockUserResponse,
			} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result).toEqual({
				providerId: "12345",
				email: "octocat@github.com",
				name: "GitHub User",
				picture: "https://avatars.githubusercontent.com/u/12345?v=4",
				emailVerified: false,
			});

			expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/vnd.github+json",
				},
				timeout: 10000,
			});
		});

		it("should fetch email from emails endpoint when not in user response", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			const mockEmailsResponse = [
				{
					email: "secondary@example.com",
					verified: true,
					primary: false,
				},
				{
					email: "primary@example.com",
					verified: true,
					primary: true,
				},
			];

			mockedGet
				.mockResolvedValueOnce({
					data: mockUserResponse,
				} as AxiosResponse)
				.mockResolvedValueOnce({
					data: mockEmailsResponse,
				} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result).toEqual({
				providerId: "12345",
				email: "primary@example.com",
				name: "GitHub User",
				picture: "https://avatars.githubusercontent.com/u/12345?v=4",
				emailVerified: true,
			});

			expect(mockedGet).toHaveBeenCalledTimes(2);
			expect(mockedGet).toHaveBeenNthCalledWith(
				2,
				"https://api.github.com/user/emails",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
						Accept: "application/vnd.github+json",
					},
					timeout: 10000,
				},
			);
		});

		it("should use first available email when no primary email found", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			const mockEmailsResponse = [
				{
					email: "first@example.com",
					verified: true,
					primary: false,
				},
				{
					email: "second@example.com",
					verified: false,
					primary: false,
				},
			];

			mockedGet
				.mockResolvedValueOnce({
					data: mockUserResponse,
				} as AxiosResponse)
				.mockResolvedValueOnce({
					data: mockEmailsResponse,
				} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.email).toBe("first@example.com");
			expect(result.emailVerified).toBe(true);
		});

		it("should use login as name when name is not available", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: null,
				email: "octocat@github.com",
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			mockedGet.mockResolvedValueOnce({
				data: mockUserResponse,
			} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.name).toBe("octocat");
		});

		it("should handle empty emails array", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			mockedGet
				.mockResolvedValueOnce({
					data: mockUserResponse,
				} as AxiosResponse)
				.mockResolvedValueOnce({
					data: [],
				} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.email).toBeUndefined();
		});

		it("should handle null emails response", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			mockedGet
				.mockResolvedValueOnce({
					data: mockUserResponse,
				} as AxiosResponse)
				.mockResolvedValueOnce({
					data: null,
				} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.email).toBeUndefined();
		});

		it("should handle API errors when fetching user profile", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Unauthorized",
				response: {
					status: 401,
					data: {
						message: "Bad credentials",
					},
				},
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedGet.mockRejectedValueOnce(axiosError);

			await expect(provider.getUserProfile(accessToken)).rejects.toThrow(
				ProfileFetchError,
			);
		});

		it("should handle API errors when fetching emails", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			const axiosError = {
				isAxiosError: true,
				message: "Forbidden",
				response: {
					status: 403,
					data: {
						message: "Insufficient permissions",
					},
				},
				config: { headers: {} },
			} as AxiosError;

			mockedGet
				.mockResolvedValueOnce({
					data: mockUserResponse,
				} as AxiosResponse)
				.mockRejectedValueOnce(axiosError);

			mockedIsAxiosError.mockReturnValue(true);

			await expect(provider.getUserProfile(accessToken)).rejects.toThrow(
				ProfileFetchError,
			);
		});

		it("should set emailVerified to false for email from user endpoint", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: "octocat@github.com",
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			mockedGet.mockResolvedValueOnce({
				data: mockUserResponse,
			} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.emailVerified).toBe(false);
		});

		it("should convert user id to string", async () => {
			const mockUserResponse = {
				id: 67890,
				login: "octocat",
				name: "GitHub User",
				email: "octocat@github.com",
				avatar_url: "https://avatars.githubusercontent.com/u/67890?v=4",
			};

			mockedGet.mockResolvedValueOnce({
				data: mockUserResponse,
			} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.providerId).toBe("67890");
			expect(typeof result.providerId).toBe("string");
		});

		it("should handle unverified email from emails endpoint", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			const mockEmailsResponse = [
				{
					email: "unverified@example.com",
					verified: false,
					primary: true,
				},
			];

			mockedGet
				.mockResolvedValueOnce({
					data: mockUserResponse,
				} as AxiosResponse)
				.mockResolvedValueOnce({
					data: mockEmailsResponse,
				} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.email).toBe("unverified@example.com");
			expect(result.emailVerified).toBe(false);
		});

		it("should handle missing verified field in email data", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			const mockEmailsResponse = [
				{
					email: "noverified@example.com",
					primary: true,
					// verified field is missing
				},
			];

			mockedGet
				.mockResolvedValueOnce({
					data: mockUserResponse,
				} as AxiosResponse)
				.mockResolvedValueOnce({
					data: mockEmailsResponse,
				} as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			expect(result.email).toBe("noverified@example.com");
			expect(result.emailVerified).toBe(false);
		});

		it("should prefer unverified primary over verified non-primary email", async () => {
			const mockUserResponse = {
				id: 12345,
				login: "octocat",
				name: "GitHub User",
				email: null,
				avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
			};

			const mockEmailsResponse = [
				{
					email: "verified-nonprimary@example.com",
					verified: true,
					primary: false,
				},
				{
					email: "unverified-primary@example.com",
					verified: false,
					primary: true,
				},
			];

			mockedGet
				.mockResolvedValueOnce({ data: mockUserResponse } as AxiosResponse)
				.mockResolvedValueOnce({ data: mockEmailsResponse } as AxiosResponse);

			const result = await provider.getUserProfile(accessToken);

			// Implementation prioritizes primary over verified status when no primary+verified exists
			expect(result.email).toBe("unverified-primary@example.com");
			expect(result.emailVerified).toBe(false);
		});
	});

	describe("error handling", () => {
		it("should handle non-axios errors", async () => {
			const customError = new Error("Custom error");
			mockedIsAxiosError.mockReturnValue(false);
			mockedPost.mockRejectedValueOnce(customError);

			await expect(
				provider.exchangeCodeForTokens("code", "redirect"),
			).rejects.toThrow(TokenExchangeError);
		});

		it("should handle non-Error objects", async () => {
			mockedIsAxiosError.mockReturnValue(false);
			mockedPost.mockRejectedValueOnce("string error");

			await expect(
				provider.exchangeCodeForTokens("code", "redirect"),
			).rejects.toThrow(TokenExchangeError);
		});
	});

	describe("timeout configuration", () => {
		it("should use custom timeout when provided", async () => {
			const customConfig: OAuthConfig = {
				clientId: "github_client_id",
				clientSecret: "github_client_secret",
				redirectUri: "http://localhost:3000/auth/callback/github",
				requestTimeoutMs: 5000,
			};
			const customProvider = new GitHubOAuthProvider(customConfig);

			const mockTokenResponse = {
				access_token: "token",
				token_type: "bearer",
			};

			mockedPost.mockResolvedValueOnce({
				data: mockTokenResponse,
			} as AxiosResponse);

			await customProvider.exchangeCodeForTokens("code", "redirect");

			expect(mockedPost).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(URLSearchParams),
				expect.objectContaining({
					timeout: 5000,
				}),
			);
		});

		it("should use default timeout when not specified", async () => {
			const mockTokenResponse = {
				access_token: "token",
				token_type: "bearer",
			};

			mockedPost.mockResolvedValueOnce({
				data: mockTokenResponse,
			} as AxiosResponse);

			await provider.exchangeCodeForTokens("code", "redirect");

			expect(mockedPost).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(URLSearchParams),
				expect.objectContaining({
					timeout: 10000,
				}),
			);
		});
	});
});
