import type { OAuthConfig } from "../utilities/auth/oauth/types";
export type ProviderKey = "google" | "github";

type OAuthProviderConfig = OAuthConfig & {
	enabled: boolean;
};

export interface OAuthProvidersConfig {
	google: OAuthProviderConfig;
	github: OAuthProviderConfig;
}

/**
 * Load and validate OAuth configuration from environment.
 * Providers are disabled if required values are missing.
 */
export function loadOAuthConfig(env = process.env): OAuthProvidersConfig {
	const requestTimeoutMs = env.API_OAUTH_REQUEST_TIMEOUT_MS
		? parseInt(env.API_OAUTH_REQUEST_TIMEOUT_MS, 10)
		: 10000;

	// Use default timeout if parsed value is NaN
	let validTimeout = Number.isNaN(requestTimeoutMs) ? 10000 : requestTimeoutMs;
	if (validTimeout < 1000) {
		validTimeout = 1000; // minimum 1 second
	}
	const cfg: OAuthProvidersConfig = {
		google: {
			enabled: !!(
				env.GOOGLE_CLIENT_ID &&
				env.GOOGLE_CLIENT_SECRET &&
				env.GOOGLE_REDIRECT_URI
			),
			clientId: env.GOOGLE_CLIENT_ID as string,
			clientSecret: env.GOOGLE_CLIENT_SECRET as string,
			redirectUri: env.GOOGLE_REDIRECT_URI,
			requestTimeoutMs: validTimeout,
		},
		github: {
			enabled: !!(
				env.GITHUB_CLIENT_ID &&
				env.GITHUB_CLIENT_SECRET &&
				env.GITHUB_REDIRECT_URI
			),
			clientId: env.GITHUB_CLIENT_ID as string,
			clientSecret: env.GITHUB_CLIENT_SECRET as string,
			redirectUri: env.GITHUB_REDIRECT_URI,
			requestTimeoutMs: validTimeout,
		},
	};
	return cfg;
}

/**
 * Get provider config, throwing if provider is not enabled or invalid.
 */
export function getProviderConfig(
	provider: ProviderKey,
	env = process.env,
): Required<OAuthProviderConfig> {
	const cfg = loadOAuthConfig(env)[provider];
	if (!cfg.enabled || !cfg.clientId || !cfg.clientSecret || !cfg.redirectUri) {
		throw new Error(`OAuth provider "${provider}" is not properly configured`);
	}
	return {
		enabled: true,
		clientId: cfg.clientId,
		clientSecret: cfg.clientSecret,
		redirectUri: cfg.redirectUri,
		requestTimeoutMs: cfg.requestTimeoutMs as number,
	};
}
