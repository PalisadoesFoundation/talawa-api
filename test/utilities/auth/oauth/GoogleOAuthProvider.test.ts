import axios, { type AxiosError, type AxiosResponse } from "axios";
import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ProfileFetchError,
	TokenExchangeError,
} from "~/src/utilities/auth/oauth/errors";
import { GoogleOAuthProvider } from "~/src/utilities/auth/oauth/providers/GoogleOAuthProvider";
import type {
	OAuthConfig,
	OAuthProviderTokenResponse,
	OAuthUserProfile,
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

Object.defineProperty(axios, "isAxiosError", {
	value: mockedIsAxiosError,
	configurable: true,
});

describe("GoogleOAuthProvider", () => {
	let provider: GoogleOAuthProvider;
	let config: OAuthConfig;

	beforeEach(() => {
		vi.clearAllMocks();
		config = {
			clientId: "test_google_client_id.apps.googleusercontent.com",
			clientSecret: "test_google_client_secret",
			redirectUri: "http://localhost:3000/auth/google/callback",
		};
		provider = new GoogleOAuthProvider(config);
	});

	describe("constructor and getProviderName", () => {
		it("should initialize with google provider name", () => {
			expect(provider.getProviderName()).toBe("google");
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
		});

		it("should use config redirectUri when parameter is empty", async () => {
			mockedPost.mockResolvedValueOnce({
				data: { access_token: "token", token_type: "Bearer" },
			} as AxiosResponse);

			await provider.exchangeCodeForTokens("test_code", "");

			const urlParams = mockedPost.mock.calls[0]?.[1] as URLSearchParams;
			expect(urlParams.get("redirect_uri")).toBe(
				"http://localhost:3000/auth/google/callback",
			);
		});

		it("should use empty string when no redirectUri available", async () => {
			const providerNoRedirect = new GoogleOAuthProvider({
				clientId: "test_id",
				clientSecret: "test_secret",
			});

			mockedPost.mockResolvedValueOnce({
				data: { access_token: "token", token_type: "Bearer" },
			} as AxiosResponse);

			await providerNoRedirect.exchangeCodeForTokens("test_code", "");

			const urlParams = mockedPost.mock.calls[0]?.[1] as URLSearchParams;
			expect(urlParams.get("redirect_uri")).toBe("");
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
	});
});
