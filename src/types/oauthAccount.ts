// Temporarily added to the knip ignore list.
// This will be removed in a later phase of OAuth implementation.

/**
 * OAuth provider enum matching database values
 */
export enum OAuthProvider {
	GOOGLE = "google",
	GITHUB = "github",
}

/**
 * OAuth account profile data structure
 */
export interface OAuthAccountProfile {
	name?: string;
	picture?: string;
	emailVerified?: boolean;
	// Provider-specific additional fields
	[key: string]: unknown;
}

/**
 * OAuth account creation input
 */
export interface CreateOAuthAccountInput {
	userId: string;
	provider: OAuthProvider;
	providerId: string;
	email: string;
	profile?: OAuthAccountProfile;
}

/**
 * OAuth account update input
 */
export interface UpdateOAuthAccountInput {
	email?: string;
	profile?: OAuthAccountProfile;
	lastUsedAt?: Date;
}
