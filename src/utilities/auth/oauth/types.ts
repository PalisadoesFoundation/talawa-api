/**
 * OAuth token response from provider token endpoint
 */
export interface OAuthProviderTokenResponse {
	access_token: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
	id_token?: string;
}

/**
 * Normalized user profile from OAuth provider
 */
export interface OAuthUserProfile {
	providerId: string;
	email: string;
	name?: string;
	picture?: string;
	emailVerified?: boolean;
}

/**
 * Configuration for OAuth provider
 */
export interface OAuthConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	OAUTH_REQUEST_TIMEOUT_MS?: number;
}
