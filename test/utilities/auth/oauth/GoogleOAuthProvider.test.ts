import axios, { type AxiosError, type AxiosResponse } from "axios";
import type { MockedFunction } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	OAuthError,
	ProfileFetchError,
	TokenExchangeError,
} from "~/src/utilities/auth/oauth/errors";
import { GoogleOAuthProvider } from "~/src/utilities/auth/oauth/providers/GoogleOAuthProvider";
import type {
	OAuthConfig,
	OAuthProviderTokenResponse,
	OAuthUserProfile,
} from "~/src/utilities/auth/oauth/types";

/**
 * TESTING APPROACH JUSTIFICATION:
 *
 * This test suite uses axios mocks (unit test approach) rather than mercuriusClient
 * integration tests for the following reasons:
 *
 * 1. GoogleOAuthProvider is a low-level utility class that makes direct HTTP calls
 *    to external Google OAuth APIs. It is not a GraphQL resolver.
 *
 * 2. The OAuth GraphQL mutations (signInWithOAuth, linkOAuthAccount, unlinkOAuthAccount)
 *    that would consume this provider are not yet implemented (they throw "not yet
 *    implemented" errors as of this writing).
 *
 * 3. Unit tests are appropriate here because we need to:
 *    - Test the provider's HTTP client logic in isolation
 *    - Verify token exchange and profile normalization without external dependencies
 *    - Test error handling for various HTTP failure scenarios
 *    - Validate configuration requirements at construction time
 *
 * 4. Integration tests via mercuriusClient should be added for the OAuth GraphQL
 *    resolvers once they are implemented. Those tests would verify the end-to-end
 *    OAuth flow through the GraphQL API, while these unit tests ensure the provider
 *    utility works correctly in isolation.
 *
 * 5. This approach matches the testing pattern used in BaseOAuthProvider.test.ts,
 *    which also uses axios mocks for testing the abstract base class.
 *
 * FUTURE WORK:
 * When signInWithOAuth and related mutations are implemented, create integration
 * tests in test/graphql/types/Mutation/ that use mercuriusClient with mocked
 * external HTTP calls to Google's OAuth endpoints (e.g., via nock or msw).
 */

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

Object.defineProperty(axios, "isAxiosError", {
	value: mockedIsAxiosError,
	configurable: true,
});

describe("GoogleOAuthProvider", () => {
	let provider: GoogleOAuthProvider;
	let config: OAuthConfig;

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the mock function's behavior to prevent state leakage
		mockedIsAxiosError.mockReset();
		config = {
			clientId: "test_google_client_id.apps.googleusercontent.com",
			clientSecret: "test_google_client_secret",
		};
		provider = new GoogleOAuthProvider(config);
	});

	afterEach(() => {
		// Restore all mocks to original implementations to prevent leakage across shards
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		vi.clearAllTimers();
	});

	describe("constructor and getProviderName", () => {
		it("should initialize with google provider name", () => {
			expect(provider.getProviderName()).toBe("google");
		});

		it("should throw OAuthError when clientId is missing", () => {
			expect(() => {
				new GoogleOAuthProvider({
					clientId: "",
					clientSecret: "test_secret",
				});
			}).toThrow(OAuthError);

			expect(() => {
				new GoogleOAuthProvider({
					clientId: "",
					clientSecret: "test_secret",
				});
			}).toThrow("Invalid OAuth configuration for google");
		});

		it("should throw OAuthError when clientSecret is missing", () => {
			expect(() => {
				new GoogleOAuthProvider({
					clientId: "test_id",
					clientSecret: "",
				});
			}).toThrow(OAuthError);

			expect(() => {
				new GoogleOAuthProvider({
					clientId: "test_id",
					clientSecret: "",
				});
			}).toThrow("Invalid OAuth configuration for google");
		});

		it("should throw OAuthError when both clientId and clientSecret are missing", () => {
			expect(() => {
				new GoogleOAuthProvider({
					clientId: "",
					clientSecret: "",
				});
			}).toThrow(OAuthError);

			expect(() => {
				new GoogleOAuthProvider({
					clientId: "",
					clientSecret: "",
				});
			}).toThrow("Invalid OAuth configuration for google");
		});
	});

	describe("exchangeCodeForTokens", () => {
		it("should exchange authorization code for tokens", async () => {
			const mockTokenResponse: OAuthProviderTokenResponse = {
				access_token: "ya29.test_token",
				token_type: "Bearer",
				expires_in: 3599,
			};

			mockedPost.mockResolvedValueOnce({
				data: mockTokenResponse,
			} as AxiosResponse);

			const result = await provider.exchangeCodeForTokens(
				"test_code",
				"http://localhost:3000/auth/google/callback",
			);

			expect(result).toEqual(mockTokenResponse);
			expect(mockedPost).toHaveBeenCalledWith(
				"https://oauth2.googleapis.com/token",
				expect.any(URLSearchParams),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/x-www-form-urlencoded",
					}),
				}),
			);

			const urlParams = mockedPost.mock.calls[0]?.[1] as URLSearchParams;
			expect(urlParams.get("grant_type")).toBe("authorization_code");
			expect(urlParams.get("code")).toBe("test_code");
			expect(urlParams.get("client_id")).toBe(
				"test_google_client_id.apps.googleusercontent.com",
			);
			expect(urlParams.get("client_secret")).toBe("test_google_client_secret");
			expect(urlParams.get("redirect_uri")).toBe(
				"http://localhost:3000/auth/google/callback",
			);
		});
		it("should use explicit redirectUri parameter over configured value", async () => {
			const overrideUri = "http://example.com/oauth/callback";
			const mockTokenResponse: OAuthProviderTokenResponse = {
				access_token: "ya29.test_token",
				token_type: "Bearer",
				expires_in: 3599,
			};

			mockedPost.mockResolvedValueOnce({
				data: mockTokenResponse,
			} as AxiosResponse);

			const result = await provider.exchangeCodeForTokens(
				"test_code",
				overrideUri,
			);

			expect(result).toEqual(mockTokenResponse);
			expect(mockedPost).toHaveBeenCalledWith(
				"https://oauth2.googleapis.com/token",
				expect.any(URLSearchParams),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/x-www-form-urlencoded",
					}),
				}),
			);

			const urlParams = mockedPost.mock.calls[0]?.[1] as URLSearchParams;
			expect(urlParams.get("redirect_uri")).toBe(overrideUri);
		});
		it("should throw TokenExchangeError when redirectUri is empty", async () => {
			const providerNoRedirect = new GoogleOAuthProvider({
				clientId: "test_id",
				clientSecret: "test_secret",
			});

			await expect(
				providerNoRedirect.exchangeCodeForTokens("test_code", " "),
			).rejects.toThrow(TokenExchangeError);

			await expect(
				providerNoRedirect.exchangeCodeForTokens("test_code", " "),
			).rejects.toThrow(
				"redirect_uri is required but was not provided in the method parameter",
			);
		});

		it("should throw TokenExchangeError on failure", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Bad Request",
				response: { data: { error_description: "invalid_grant" } },
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValue(axiosError);

			await expect(
				provider.exchangeCodeForTokens("bad_code", "http://localhost/callback"),
			).rejects.toThrow(TokenExchangeError);
		});

		it("should handle timeout in token exchange", async () => {
			const timeoutError = {
				isAxiosError: true,
				code: "ECONNABORTED",
				message: "timeout of 10000ms exceeded",
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValueOnce(timeoutError);

			await expect(
				provider.exchangeCodeForTokens(
					"test_code",
					"http://localhost/callback",
				),
			).rejects.toThrow(TokenExchangeError);
		});
	});

	describe("getUserProfile", () => {
		it("should fetch and normalize user profile", async () => {
			const mockGoogleProfile = {
				sub: "123456789",
				email: "test@gmail.com",
				name: "Test User",
				picture: "https://example.com/photo.jpg",
				email_verified: true,
			};

			mockedGet.mockResolvedValueOnce({
				data: mockGoogleProfile,
			} as AxiosResponse);

			const result = await provider.getUserProfile("test_access_token");

			expect(result).toEqual({
				providerId: "123456789",
				email: "test@gmail.com",
				name: "Test User",
				picture: "https://example.com/photo.jpg",
				emailVerified: true,
			} satisfies OAuthUserProfile);

			expect(mockedGet).toHaveBeenCalledWith(
				"https://www.googleapis.com/oauth2/v3/userinfo",
				expect.objectContaining({
					headers: { Authorization: "Bearer test_access_token" },
				}),
			);
		});

		it("should handle minimal profile (only sub)", async () => {
			mockedGet.mockResolvedValueOnce({
				data: { sub: "123" },
			} as AxiosResponse);

			const result = await provider.getUserProfile("token");

			expect(result.providerId).toBe("123");
			expect(result.email).toBeUndefined();
		});

		it("should throw ProfileFetchError on failure", async () => {
			mockedIsAxiosError.mockReturnValue(true);
			mockedGet.mockRejectedValueOnce({
				isAxiosError: true,
				message: "Unauthorized",
				config: { headers: {} },
			} as AxiosError);

			await expect(provider.getUserProfile("bad_token")).rejects.toThrow(
				ProfileFetchError,
			);
		});

		it("should handle timeout in profile fetch", async () => {
			const timeoutError = {
				isAxiosError: true,
				code: "ECONNABORTED",
				message: "timeout of 10000ms exceeded",
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedGet.mockRejectedValueOnce(timeoutError);

			await expect(provider.getUserProfile("test_token")).rejects.toThrow(
				ProfileFetchError,
			);
		});
	});
});
