import type { CookieSerializeOptions } from "@fastify/cookie";

/**
 * Cookie names used for authentication tokens.
 * These are centralized here to ensure consistency across the codebase.
 */
export const COOKIE_NAMES = {
	/**
	 * HTTP-Only cookie containing the short-lived JWT access token.
	 */
	ACCESS_TOKEN: "talawa_access_token",

	/**
	 * HTTP-Only cookie containing the refresh token for obtaining new access tokens.
	 */
	REFRESH_TOKEN: "talawa_refresh_token",
} as const;

/**
 * Default cookie options with security best practices.
 * These options ensure cookies are protected from XSS attacks.
 */
export interface CookieConfigOptions {
	/**
	 * Whether the application is running in a secure (HTTPS) environment.
	 */
	isSecure: boolean;

	/**
	 * Optional domain for the cookie (for cross-subdomain authentication).
	 */
	domain?: string;

	/**
	 * Cookie path.
	 */
	path?: string;
}

/**
 * Generates cookie options for access tokens.
 * Access tokens are short-lived and used for API authentication.
 *
 * @param options - Configuration options for the cookie
 * @param maxAgeMs - Maximum age of the cookie in milliseconds (should match JWT expiry)
 * @returns - Cookie serialization options
 */
export function getAccessTokenCookieOptions(
	options: CookieConfigOptions,
	maxAgeMs: number,
): CookieSerializeOptions {
	return {
		httpOnly: true, // Prevents JavaScript access - XSS protection
		secure: options.isSecure, // HTTPS only in production
		sameSite: "lax", // CSRF protection while allowing normal navigation
		path: options.path ?? "/",
		domain: options.domain,
		maxAge: Math.floor(maxAgeMs / 1000), // Convert ms to seconds
	};
}

/**
 * Generates cookie options for refresh tokens.
 * Refresh tokens are long-lived and used to obtain new access tokens.
 *
 * @param options - Configuration options for the cookie
 * @param maxAgeMs - Maximum age of the cookie in milliseconds (should match refresh token expiry)
 * @returns - Cookie serialization options
 */
export function getRefreshTokenCookieOptions(
	options: CookieConfigOptions,
	maxAgeMs: number,
): CookieSerializeOptions {
	return {
		httpOnly: true, // Prevents JavaScript access - XSS protection
		secure: options.isSecure, // HTTPS only in production
		sameSite: "lax", // Lax allows refresh on navigation (e.g. from email links)
		path: options.path ?? "/",
		domain: options.domain,
		maxAge: Math.floor(maxAgeMs / 1000), // Convert ms to seconds
	};
}

/**
 * Generates cookie options for clearing/removing access token cookies.
 * Used during logout to invalidate the access token cookie.
 * Uses sameSite: "lax" to match getAccessTokenCookieOptions().
 *
 * @param options - Configuration options for the cookie
 * @returns - Cookie serialization options that will clear the cookie
 */
export function getClearAccessTokenCookieOptions(
	options: CookieConfigOptions,
): CookieSerializeOptions {
	return {
		httpOnly: true,
		secure: options.isSecure,
		sameSite: "lax", // Must match getAccessTokenCookieOptions()
		path: options.path ?? "/",
		domain: options.domain,
		maxAge: 0, // Immediately expires the cookie
	};
}

/**
 * Generates cookie options for clearing/removing refresh token cookies.
 * Used during logout to invalidate the refresh token cookie.
 * Uses sameSite: "lax" to match getRefreshTokenCookieOptions().
 *
 * @param options - Configuration options for the cookie
 * @returns - Cookie serialization options that will clear the cookie
 */
export function getClearRefreshTokenCookieOptions(
	options: CookieConfigOptions,
): CookieSerializeOptions {
	return {
		httpOnly: true,
		secure: options.isSecure,
		sameSite: "lax", // Must match getRefreshTokenCookieOptions()
		path: options.path ?? "/",
		domain: options.domain,
		maxAge: 0, // Immediately expires the cookie
	};
}
