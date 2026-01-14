/**
 * Base error class for OAuth-related errors
 */
export class OAuthError extends Error {
	constructor(
		message: string,
		public code: string,
		public statusCode?: number,
	) {
		super(message);
		this.name = "OAuthError";
		Object.setPrototypeOf(this, OAuthError.prototype);
	}
}

/**
 * Error thrown when authorization code is invalid
 */
export class InvalidAuthorizationCodeError extends OAuthError {
	constructor(message = "Invalid authorization code") {
		super(message, "INVALID_AUTHORIZATION_CODE", 400);
		this.name = "InvalidAuthorizationCodeError";
		Object.setPrototypeOf(this, InvalidAuthorizationCodeError.prototype);
	}
}

/**
 * Error thrown when token exchange fails
 */
export class TokenExchangeError extends OAuthError {
	constructor(message = "Token exchange failed", details?: string) {
		super(
			details ? `${message}: ${details}` : message,
			"TOKEN_EXCHANGE_FAILED",
			502,
		);
		this.name = "TokenExchangeError";
		Object.setPrototypeOf(this, TokenExchangeError.prototype);
	}
}

/**
 * Error thrown when profile fetch fails
 */
export class ProfileFetchError extends OAuthError {
	constructor(message = "Failed to fetch user profile") {
		super(message, "PROFILE_FETCH_FAILED", 502);
		this.name = "ProfileFetchError";
		Object.setPrototypeOf(this, ProfileFetchError.prototype);
	}
}
