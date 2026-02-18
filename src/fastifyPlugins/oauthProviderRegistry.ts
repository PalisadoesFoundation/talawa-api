import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import type { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";
import { buildOAuthProviderRegistry } from "~/src/utilities/auth/oauth/providerFactory";

declare module "fastify" {
	interface FastifyInstance {
		/**
		 * OAuth provider registry containing all enabled OAuth providers
		 */
		oauthProviderRegistry: OAuthProviderRegistry;
	}
}

/**
 * Fastify plugin that initializes and registers the OAuth provider registry.
 * This plugin builds the registry from configuration and attaches it to the fastify instance.
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
	fastify.log.info("Initializing OAuth provider registry...");

	try {
		const registry = buildOAuthProviderRegistry();
		const providers = registry.listProviders();

		if (providers.length > 0) {
			fastify.log.info(
				{ providers },
				`OAuth provider registry initialized with ${providers.length} provider(s)`,
			);
		} else {
			fastify.log.info(
				"OAuth provider registry initialized with no providers (all disabled in config)",
			);
		}

		fastify.decorate("oauthProviderRegistry", registry);
	} catch (error) {
		fastify.log.error(
			{ error },
			"Failed to initialize OAuth provider registry",
		);
		throw error;
	}
});
