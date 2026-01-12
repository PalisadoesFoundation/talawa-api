import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { OAuthError, ProfileFetchError, TokenExchangeError } from "../errors";
import type { IOAuthProvider } from "../interfaces/IOAuthProvider";
import type {
	OAuthConfig,
	OAuthProviderTokenResponse,
	OAuthUserProfile,
} from "../types";

/**
 * Abstract base class for OAuth providers
 * Implements common HTTP logic and error handling
 */
export abstract class BaseOAuthProvider implements IOAuthProvider {
	protected config: OAuthConfig;

	constructor(config: OAuthConfig) {
		this.config = config;
	}

	abstract getProviderName(): string;
	abstract exchangeCodeForTokens(
		code: string,
		redirectUri: string,
	): Promise<OAuthProviderTokenResponse>;
	abstract getUserProfile(accessToken: string): Promise<OAuthUserProfile>;

	/**
	 * Make HTTP POST request with error handling
	 * @param url - Target URL
	 * @param data - Request body data
	 * @param headers - Optional headers
	 * @returns Response data
	 * @throws {TokenExchangeError} If request fails
	 */
	protected async post<T>(
		url: string,
		data: Record<string, unknown> | URLSearchParams,
		headers?: Record<string, string>,
	): Promise<T> {
		try {
			const config: AxiosRequestConfig = {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					...headers,
				},
				timeout: 10000, // 10 second timeout
			};

			const response = await axios.post<T>(url, data, config);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				const errorData = axiosError.response?.data as
					| { error_description?: string; error?: string }
					| undefined;
				const errorMessage =
					errorData?.error_description ||
					errorData?.error ||
					axiosError.message;

				throw new TokenExchangeError("Token exchange failed", errorMessage);
			}
			throw error;
		}
	}

	/**
	 * Make HTTP GET request with error handling
	 * @param url - Target URL
	 * @param headers - Optional headers
	 * @returns Response data
	 * @throws {ProfileFetchError} If request fails
	 */
	protected async get<T>(
		url: string,
		headers?: Record<string, string>,
	): Promise<T> {
		try {
			const config: AxiosRequestConfig = {
				headers,
				timeout: 10000,
			};

			const response = await axios.get<T>(url, config);
			return response.data;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new ProfileFetchError(
					`Failed to fetch user profile: ${axiosError.message}`,
				);
			}
			throw error;
		}
	}

	/**
	 * Validate that required configuration is present
	 * @throws {OAuthError} If configuration is invalid
	 */
	protected validateConfig(): void {
		if (!this.config.clientId || !this.config.clientSecret) {
			throw new OAuthError(
				`Invalid OAuth configuration for ${this.getProviderName()}`,
				"INVALID_CONFIG",
				500,
			);
		}
	}
}
