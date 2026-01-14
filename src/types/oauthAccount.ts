// Temporarily added to the knip ignore list.
// This will be removed in a later phase of OAuth implementation.

import type { oauthAccountsTable } from "../drizzle/schema";

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
	provider: "google" | "github";
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

/**
 * OAuth account record from the database
 */
export type OAuthAccount = typeof oauthAccountsTable.$inferSelect;

/**
 * OAuth account insert input for database operations
 */
export type NewOAuthAccount = typeof oauthAccountsTable.$inferInsert;
