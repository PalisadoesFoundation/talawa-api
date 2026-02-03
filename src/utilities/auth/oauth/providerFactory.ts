import { getProviderConfig, loadOAuthConfig } from "../../../config/oauth";
import { OAuthProviderRegistry } from "./OAuthProviderRegistry";
import { GitHubOAuthProvider } from "./providers/GitHubOAuthProvider";
import { GoogleOAuthProvider } from "./providers/GoogleOAuthProvider";

/**
 * Builds and initializes the OAuth provider registry from configuration.
 * Clears any existing providers (idempotent) and registers enabled providers.
 * @returns The populated OAuthProviderRegistry singleton instance
 */
export function buildOAuthProviderRegistry(): OAuthProviderRegistry {
	const reg = OAuthProviderRegistry.getInstance();
	reg.clear(); // idempotent

	const cfg = loadOAuthConfig();

	if (cfg.google.enabled) {
		const google = new GoogleOAuthProvider(getProviderConfig("google"));
		reg.register(google);
	}

	if (cfg.github.enabled) {
		const github = new GitHubOAuthProvider(getProviderConfig("github"));
		reg.register(github);
	}

	return reg;
}
