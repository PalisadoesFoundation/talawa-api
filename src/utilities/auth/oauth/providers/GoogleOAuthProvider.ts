import type { OAuthProviderTokenResponse, OAuthUserProfile } from "../types";
import { BaseOAuthProvider } from "./BaseOAuthProvider";

/**
 * Google OAuth 2.0 provider implementation
 * Handles code exchange and user profile retrieval from Google's OAuth endpoints
 *
 * @example
 * ```typescript
 * const provider = new GoogleOAuthProvider({
 *   clientId: "your-client-id.apps.googleusercontent.com",
 *   clientSecret: "your-client-secret",
 *   redirectUri: "http://localhost:3000/auth/google/callback"
 * });
 *
 * // Exchange authorization code for tokens
 * const tokens = await provider.exchangeCodeForTokens(
 *   "authorization-code-from-callback",
 *   "http://localhost:3000/auth/google/callback"
 * );
 *
 * // Fetch user profile
 * const profile = await provider.getUserProfile(tokens.access_token);
 * console.log(profile); // { providerId: "...", email: "...", name: "..." }
 * ```
 *
 * @see https://developers.google.com/identity/protocols/oauth2/web-server
 */
export class GoogleOAuthProvider extends BaseOAuthProvider {
	/**
	 * Google OAuth token endpoint
	 */
	private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";

	/**
	 * Google OAuth userinfo endpoint
	 */
	private static readonly USERINFO_URL =
		"https://www.googleapis.com/oauth2/v3/userinfo";

	constructor(config: import("../types").OAuthConfig) {
		super("google", config);
	}

	/**
	 * Exchange authorization code for access tokens
	 * @param code - Authorization code from Google OAuth callback
	 * @param redirectUri - Redirect URI that was used in the authorization request
	 * @returns Token response with access token and optional refresh token
	 * @throws {TokenExchangeError} If token exchange fails (e.g., invalid_grant, invalid_client)
	 */
	async exchangeCodeForTokens(
		code: string,
		redirectUri: string,
	): Promise<OAuthProviderTokenResponse> {
		this.validateConfig();

		const data = new URLSearchParams({
			code,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
			redirect_uri: redirectUri || this.config.redirectUri || "",
			grant_type: "authorization_code",
		});

		const response = await this.post<OAuthProviderTokenResponse>(
			GoogleOAuthProvider.TOKEN_URL,
			data,
		);

		return response;
	}

	/**
	 * Fetch user profile from Google userinfo endpoint
	 * @param accessToken - Access token obtained from token exchange
	 * @returns Normalized user profile
	 * @throws {ProfileFetchError} If profile fetch fails
	 */
	async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
		interface GoogleUserInfo {
			sub: string;
			email?: string;
			name?: string;
			picture?: string;
			email_verified?: boolean;
		}

		const profile = await this.get<GoogleUserInfo>(
			GoogleOAuthProvider.USERINFO_URL,
			{
				Authorization: `Bearer ${accessToken}`,
			},
		);

		return {
			providerId: profile.sub,
			email: profile.email,
			name: profile.name,
			picture: profile.picture,
			emailVerified: profile.email_verified,
		};
	}
}
