import type { OAuthProviderTokenResponse, OAuthUserProfile } from "../types";

/**
 * Interface for OAuth2 provider implementations
 * All providers must implement this interface to ensure consistent behavior
 */
export interface IOAuthProvider {
	/**
	 * Get the unique name identifier for this provider
	 * @returns Provider name (e.g., "google", "github")
	 */
	getProviderName(): string;

	/**
	 * Exchange authorization code for access tokens
	 * @param code - Authorization code from OAuth callback
	 * @param redirectUri - redirect URI used in authorization request.
	 * @returns Token response with access token and optional refresh token
	 * @throws {TokenExchangeError} If token exchange fails or if no redirect URI is available
	 * @throws {InvalidAuthorizationCodeError} If authorization code is invalid
	 */
	exchangeCodeForTokens(
		code: string,
		redirectUri: string,
	): Promise<OAuthProviderTokenResponse>;

	/**
	 * Fetch user profile information using access token
	 * @param accessToken - OAuth access token
	 * @returns User profile with provider ID, email, and optional metadata
	 * @throws {OAuthError} If profile fetch fails
	 */
	getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
}
