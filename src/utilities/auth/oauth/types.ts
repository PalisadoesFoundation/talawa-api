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
	email?: string;
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
	redirectUri?: string;
	requestTimeoutMs?: number;
}
/**
 * GitHub user response structure
 */
export interface GitHubUser {
	id: number;
	login: string;
	name: string | null;
	email?: string;
	avatar_url: string;
}

/**
 * GitHub email response structure
 */
export interface GitHubEmail {
	email: string;
	primary: boolean;
	verified: boolean;
}
