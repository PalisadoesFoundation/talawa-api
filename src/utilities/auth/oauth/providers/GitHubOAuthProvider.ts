import { TokenExchangeError } from "../errors";
import type {
	GitHubEmail,
	GitHubUser,
	OAuthConfig,
	OAuthProviderTokenResponse,
	OAuthUserProfile,
} from "../types";
import { BaseOAuthProvider } from "./BaseOAuthProvider";

/**
 * GitHub OAuth provider implementation.
 * Handles authentication flow with GitHub OAuth service.
 *
 * Features:
 * - Exchange authorization codes for access tokens
 * - Fetch user profile information from GitHub API
 * - Handle private email addresses by fetching from emails endpoint
 */
export class GitHubOAuthProvider extends BaseOAuthProvider {
	/**
	 * Creates a new GitHub OAuth provider instance.
	 *
	 * @param config - OAuth configuration containing client credentials and settings
	 */
	constructor(config: OAuthConfig) {
		super("github", config);
	}

	/**
	 * Exchanges an authorization code for access tokens using GitHub's OAuth service.
	 *
	 * @param code - Authorization code received from GitHub OAuth callback
	 * @param redirectUri - Redirect URI used in the initial authorization request
	 * @returns Promise resolving to OAuth tokens (access_token, refresh_token, etc.)
	 * @throws {TokenExchangeError} If token exchange fails
	 */
	async exchangeCodeForTokens(
		code: string,
		redirectUri: string,
	): Promise<OAuthProviderTokenResponse> {
		const resolvedRedirectUri = redirectUri || this.config.redirectUri;
		if (!resolvedRedirectUri) {
			throw new TokenExchangeError(
				"Token exchange failed",
				"redirect_uri is required but was not provided",
			);
		}

		const data = new URLSearchParams({
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
			code,
			redirect_uri: resolvedRedirectUri,
		});
		const resp = await this.post<OAuthProviderTokenResponse>(
			"https://github.com/login/oauth/access_token",
			data,
			{
				Accept: "application/json",
			},
		);

		// GitHub returns HTTP 200 even for errors, check for error field in response
		const errorResponse = resp as unknown as {
			error?: string;
			error_description?: string;
		};
		if (errorResponse.error) {
			throw new TokenExchangeError(
				"Token exchange failed",
				errorResponse.error_description || errorResponse.error,
			);
		}

		return {
			access_token: resp.access_token,
			token_type: resp.token_type,
			expires_in: resp.expires_in,
			refresh_token: resp.refresh_token,
		};
	}

	/**
	 * Fetches user profile information from GitHub API.
	 *
	 * If the user's primary email is not public, attempts to fetch it from
	 * the user's private email addresses (requires 'user:email' scope).
	 *
	 * @param accessToken - GitHub access token with appropriate scopes
	 * @returns Promise resolving to standardized user profile data
	 * @throws {ProfileFetchError} If profile fetch fails
	 */
	async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
		const user = await this.get<GitHubUser>("https://api.github.com/user", {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github+json",
		});

		let email = user.email;
		let emailVerified = false;

		if (!email) {
			const emails = await this.get<GitHubEmail[]>(
				"https://api.github.com/user/emails",
				{
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/vnd.github+json",
				},
			);

			const primaryVerified = emails?.find((e) => e.primary && e.verified);
			const primary =
				primaryVerified || emails?.find((e) => e.primary) || emails?.[0];

			email = primary?.email;
			emailVerified = primary?.verified ?? false;
		} else {
			// If email came from /user endpoint → not guaranteed verified
			emailVerified = false;
		}

		return {
			providerId: String(user.id),
			email,
			name: user.name || user.login,
			picture: user.avatar_url,
			emailVerified,
		};
	}
}
