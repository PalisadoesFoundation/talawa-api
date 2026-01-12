import axios, { AxiosError, type AxiosResponse } from "axios";
import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	OAuthError,
	ProfileFetchError,
	TokenExchangeError,
} from "~/src/utilities/auth/oauth/errors";
import { BaseOAuthProvider } from "~/src/utilities/auth/oauth/providers/BaseOAuthProvider";
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

// Override axios.isAxiosError with our mock
Object.defineProperty(axios, "isAxiosError", {
	value: mockedIsAxiosError,
	configurable: true,
});

class ConcreteOAuthProvider extends BaseOAuthProvider {
	// Expose protected method for testing
	public testValidateConfig(): void {
		this.validateConfig();
	}

	// Expose protected config for testing
	public getConfig(): OAuthConfig {
		return this.config;
	}

	// Expose protected post method for testing
	public testPost<T>(
		url: string,
		data: Record<string, string> | URLSearchParams,
		headers?: Record<string, string>,
	): Promise<T> {
		return this.post<T>(url, data, headers);
	}

	// Expose protected get method for testing
	public testGet<T>(url: string, headers?: Record<string, string>): Promise<T> {
		return this.get<T>(url, headers);
	}

	async exchangeCodeForTokens(
		code: string,
		redirectUri: string,
	): Promise<OAuthProviderTokenResponse> {
		const response = await this.post<OAuthProviderTokenResponse>(
			"https://api.test.com/token",
			{
				grant_type: "authorization_code",
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
				code,
				redirect_uri: redirectUri,
			},
		);
		return response;
	}

	async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
		interface ApiUserResponse {
			id: string;
			email: string;
			name: string;
			email_verified: boolean;
		}

		const response = await this.get<ApiUserResponse>(
			"https://api.test.com/user",
			{
				Authorization: `Bearer ${accessToken}`,
			},
		);

		return {
			providerId: response.id,
			email: response.email,
			name: response.name,
			emailVerified: response.email_verified,
		};
	}
}

describe("BaseOAuthProvider", () => {
	let provider: ConcreteOAuthProvider;
	let config: OAuthConfig;

	beforeEach(() => {
		vi.clearAllMocks();

		config = {
			clientId: "test_client_id",
			clientSecret: "test_client_secret",
			redirectUri: "http://localhost:3000/callback",
		};

		provider = new ConcreteOAuthProvider("test-provider", config);
	});

	describe("constructor", () => {
		it("should initialize with provided config", () => {
			expect(provider).toBeDefined();
			expect(provider.getProviderName()).toBe("test-provider");
		});

		it("should store config properly", () => {
			expect(provider.getConfig()).toEqual(config);
		});
	});

	describe("validateConfig()", () => {
		it("should not throw error for valid config", () => {
			expect(() => provider.testValidateConfig()).not.toThrow();
		});

		it("should not throw error when redirectUri is missing (now optional)", () => {
			expect(() => {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "test_id",
					clientSecret: "test_secret",
				});
			}).not.toThrow();
		});

		it("should throw error when clientId is missing", () => {
			try {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "",
					clientSecret: "test_secret",
					redirectUri: "http://localhost:3000/callback",
				});
				throw new Error("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(OAuthError);
				expect(error).toMatchObject({
					code: "INVALID_CONFIG",
					statusCode: 500,
				});
			}
		});

		it("should throw error when clientSecret is missing", () => {
			expect(() => {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "test_id",
					clientSecret: "",
					redirectUri: "http://localhost:3000/callback",
				});
			}).toThrow(OAuthError);
			expect(() => {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "test_id",
					clientSecret: "",
					redirectUri: "http://localhost:3000/callback",
				});
			}).toThrow(
				expect.objectContaining({ code: "INVALID_CONFIG", statusCode: 500 }),
			);
		});

		it("should throw error with provider name in message", () => {
			expect(() => {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "",
					clientSecret: "",
					redirectUri: "",
				});
			}).toThrow(OAuthError);
			expect(() => {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "",
					clientSecret: "",
					redirectUri: "",
				});
			}).toThrow(/test-provider/);
		});

		it("should throw OAuthError with correct code and status", () => {
			expect(() => {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "",
					clientSecret: "",
					redirectUri: "",
				});
			}).toThrow(OAuthError);
			expect(() => {
				new ConcreteOAuthProvider("test-provider", {
					clientId: "",
					clientSecret: "",
					redirectUri: "",
				});
			}).toThrow(
				expect.objectContaining({ code: "INVALID_CONFIG", statusCode: 500 }),
			);
		});
	});

	describe("post()", () => {
		it("should handle axios error without response", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Network error",
				response: undefined,
				code: "ECONNABORTED",
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValueOnce(axiosError);

			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				TokenExchangeError,
			);
		});

		it("should handle axios timeout", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "timeout of 10000ms exceeded",
				code: "ECONNABORTED",
				response: undefined,
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValueOnce(axiosError);

			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				TokenExchangeError,
			);
		});
		it("should make successful POST request", async () => {
			const mockResponse: OAuthProviderTokenResponse = {
				access_token: "test_access_token",
				token_type: "Bearer",
				expires_in: 3600,
			};

			mockedPost.mockResolvedValueOnce({
				data: mockResponse,
			} as AxiosResponse);

			const result = await provider.testPost<OAuthProviderTokenResponse>(
				"https://test.com",
				{ test: "data", number: "123" },
			);

			expect(result).toEqual(mockResponse);
			expect(mockedPost).toHaveBeenCalledWith(
				"https://test.com",
				expect.any(URLSearchParams),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					timeout: 10000,
				},
			);

			// Verify the URLSearchParams content
			const call = mockedPost.mock.calls[0];
			const urlParams = call?.[1] as URLSearchParams;
			expect(urlParams.get("test")).toBe("data");
			expect(urlParams.get("number")).toBe("123");
		});

		it("should handle URLSearchParams data directly without conversion", async () => {
			const mockResponse = { success: true };
			mockedPost.mockResolvedValueOnce({ data: mockResponse } as AxiosResponse);

			const urlSearchParams = new URLSearchParams();
			urlSearchParams.append("client_id", "test123");
			urlSearchParams.append("grant_type", "authorization_code");

			const result = await provider.testPost<{ success: boolean }>(
				"https://test.com",
				urlSearchParams,
			);

			expect(result).toEqual(mockResponse);
			expect(mockedPost).toHaveBeenCalledWith(
				"https://test.com",
				urlSearchParams, // Should be the exact same instance
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					timeout: 10000,
				},
			);
		});

		it("should include custom headers in POST request", async () => {
			const mockResponse = { success: true };
			mockedPost.mockResolvedValueOnce({ data: mockResponse } as AxiosResponse);

			await provider.testPost(
				"https://test.com",
				{},
				{ "Custom-Header": "value" },
			);

			expect(mockedPost).toHaveBeenCalledWith(
				"https://test.com",
				expect.any(URLSearchParams),
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"Custom-Header": "value",
					},
					timeout: 10000,
				},
			);
		});

		it("should handle axios error with error_description", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Network error",
				response: {
					data: {
						error_description: "Invalid client credentials",
					},
				},
				config: {
					headers: {},
				},
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValue(axiosError);

			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				TokenExchangeError,
			);
			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				/Invalid client credentials/,
			);
		});

		it("should handle axios error with error field", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Network error",
				response: {
					data: {
						error: "invalid_client",
					},
				},
				config: {
					headers: {},
				},
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValue(axiosError);

			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				TokenExchangeError,
			);
			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				/invalid_client/,
			);
		});

		it("should handle axios error with just message", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Network error",
				response: {
					data: {},
				},
				config: {
					headers: {},
				},
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValue(axiosError);

			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				TokenExchangeError,
			);
			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				/Network error/,
			);
		});
	});

	describe("get()", () => {
		it("should handle axios error without response in GET request", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Network error",
				response: undefined,
				code: "ECONNABORTED",
				config: { headers: {} },
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedGet.mockRejectedValueOnce(axiosError);

			await expect(provider.testGet("https://test.com")).rejects.toThrow(
				ProfileFetchError,
			);
		});
		it("should make successful GET request", async () => {
			const mockResponse = {
				id: "123456",
				email: "test@example.com",
				name: "Test User",
			};

			mockedGet.mockResolvedValueOnce({
				data: mockResponse,
			} as AxiosResponse);

			const result = await provider.testGet("https://test.com");

			expect(result).toEqual(mockResponse);
			expect(mockedGet).toHaveBeenCalledWith("https://test.com", {
				headers: undefined,
				timeout: 10000,
			});
		});

		it("should include custom headers in GET request", async () => {
			const mockResponse = { data: "test" };
			mockedGet.mockResolvedValueOnce({ data: mockResponse } as AxiosResponse);

			await provider.testGet("https://test.com", {
				Authorization: "Bearer token",
			});

			expect(mockedGet).toHaveBeenCalledWith("https://test.com", {
				headers: {
					Authorization: "Bearer token",
				},
				timeout: 10000,
			});
		});

		it("should handle axios error in GET request", async () => {
			const axiosError = {
				isAxiosError: true,
				message: "Network error",
				response: {
					data: {},
				},
				config: {
					headers: {},
				},
			} as AxiosError;

			mockedIsAxiosError.mockReturnValue(true);
			mockedGet.mockRejectedValueOnce(axiosError);

			await expect(provider.testGet("https://test.com")).rejects.toThrow(
				ProfileFetchError,
			);
		});

		it("should wrap non-axios errors in ProfileFetchError", async () => {
			const customError = new Error("Custom error");
			mockedIsAxiosError.mockReturnValue(false);
			mockedGet.mockRejectedValueOnce(customError);

			await expect(provider.testGet("https://test.com")).rejects.toThrow(
				ProfileFetchError,
			);
		});

		it("should wrap non-Error objects in ProfileFetchError", async () => {
			// Test case where something other than Error is thrown
			mockedIsAxiosError.mockReturnValue(false);
			mockedGet.mockRejectedValueOnce(null);

			try {
				await provider.testGet("https://test.com");
				throw new Error("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(ProfileFetchError);
				expect((error as ProfileFetchError).message).toContain("Unknown error");
			}
		});
	});

	describe("abstract methods implementation", () => {
		it("should properly implement exchangeCodeForTokens", async () => {
			const mockResponse: OAuthProviderTokenResponse = {
				access_token: "test_access_token",
				token_type: "Bearer",
				expires_in: 3600,
			};

			mockedPost.mockResolvedValueOnce({ data: mockResponse } as AxiosResponse);

			const result = await provider.exchangeCodeForTokens(
				"test_code",
				"http://localhost:3000/callback",
			);

			expect(result).toEqual(mockResponse);
		});

		it("should properly implement getUserProfile", async () => {
			const mockUserData = {
				id: "123456",
				email: "test@example.com",
				name: "Test User",
				email_verified: true,
			};

			mockedGet.mockResolvedValueOnce({ data: mockUserData } as AxiosResponse);

			const result = await provider.getUserProfile("test_access_token");

			expect(result).toEqual({
				providerId: "123456",
				email: "test@example.com",
				name: "Test User",
				emailVerified: true,
			});
		});

		it("should return correct provider name", () => {
			expect(provider.getProviderName()).toBe("test-provider");
		});
	});

	describe("error handling", () => {
		it("should properly handle different error types", async () => {
			const axiosError = new AxiosError("Test error");
			mockedIsAxiosError.mockReturnValue(true);
			mockedPost.mockRejectedValueOnce(axiosError);

			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				TokenExchangeError,
			);
		});

		it("should wrap non-axios errors in TokenExchangeError", async () => {
			const error = new Error("Non-axios error");
			mockedIsAxiosError.mockReturnValue(false);
			mockedPost.mockRejectedValueOnce(error);

			await expect(provider.testPost("https://test.com", {})).rejects.toThrow(
				TokenExchangeError,
			);
		});

		it("should wrap non-Error objects in TokenExchangeError", async () => {
			// Test case where something other than Error is thrown
			mockedIsAxiosError.mockReturnValue(false);
			mockedPost.mockRejectedValueOnce("string error");

			try {
				await provider.testPost("https://test.com", {});
				throw new Error("Expected error to be thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TokenExchangeError);
				expect((error as TokenExchangeError).message).toContain(
					"Unknown error",
				);
			}
		});
	});

	describe("timeout configuration", () => {
		it("should set timeout for POST requests", async () => {
			mockedPost.mockResolvedValueOnce({ data: {} } as AxiosResponse);

			await provider.testPost("https://test.com", {});

			expect(mockedPost).toHaveBeenCalledWith(
				"https://test.com",
				expect.any(URLSearchParams),
				expect.objectContaining({
					timeout: 10000,
				}),
			);
		});
		it("should use custom timeout from config when provided", async () => {
			const customConfig: OAuthConfig = {
				clientId: "test_client_id",
				clientSecret: "test_client_secret",
				requestTimeoutMs: 5000,
			};
			const customProvider = new ConcreteOAuthProvider(
				"custom-timeout",
				customConfig,
			);

			mockedPost.mockResolvedValueOnce({ data: {} } as AxiosResponse);
			await customProvider.testPost("https://test.com", {});

			expect(mockedPost).toHaveBeenCalledWith(
				"https://test.com",
				expect.any(URLSearchParams),
				expect.objectContaining({
					timeout: 5000,
				}),
			);
		});

		it("should set timeout for GET requests", async () => {
			mockedGet.mockResolvedValueOnce({ data: {} } as AxiosResponse);

			await provider.testGet("https://test.com");

			expect(mockedGet).toHaveBeenCalledWith(
				"https://test.com",
				expect.objectContaining({
					timeout: 10000,
				}),
			);
		});
	});

	describe("content-type headers", () => {
		it("should set correct content-type for POST requests", async () => {
			mockedPost.mockResolvedValueOnce({ data: {} } as AxiosResponse);

			await provider.testPost("https://test.com", {});

			expect(mockedPost).toHaveBeenCalledWith(
				"https://test.com",
				expect.any(URLSearchParams),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/x-www-form-urlencoded",
					}),
				}),
			);
		});

		it("should merge content-type with custom headers", async () => {
			mockedPost.mockResolvedValueOnce({ data: {} } as AxiosResponse);

			await provider.testPost(
				"https://test.com",
				{},
				{ "Custom-Header": "value" },
			);

			expect(mockedPost).toHaveBeenCalledWith(
				"https://test.com",
				expect.any(URLSearchParams),
				expect.objectContaining({
					headers: expect.objectContaining({
						"Content-Type": "application/x-www-form-urlencoded",
						"Custom-Header": "value",
					}),
				}),
			);
		});
	});
});
