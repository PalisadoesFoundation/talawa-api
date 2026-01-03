import fastifyPlugin from "fastify-plugin";
import { createPluginContext, initializePluginSystem } from "~/src/plugin";
import type PluginManager from "~/src/plugin/manager";
import type { IPluginContext } from "~/src/plugin/types";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

declare module "fastify" {
	interface FastifyInstance {
		pluginManager: PluginManager;
		pluginContext: IPluginContext;
	}
}

/**
 * Integrates the plugin system into the Fastify application.
 * This plugin initializes the plugin manager and makes it available
 * throughout the application lifecycle.
 */
export const pluginSystem = fastifyPlugin(async (fastify) => {
	fastify.log.info("Initializing plugin system...");

	try {
		// Create plugin context with required dependencies
		const pluginContext = createPluginContext({
			db: fastify.drizzleClient,
			graphql: null, // Will be set later when GraphQL is available
			pubsub: null, // Add when PubSub is implemented
			logger: fastify.log,
		});

		// Add plugin manager reference to context to avoid circular dependency
		pluginContext.pluginManager = null;

		// Initialize plugin system
		const pluginManager = await initializePluginSystem(pluginContext);

		// Update the plugin manager reference in context
		pluginContext.pluginManager = pluginManager;

		// Make plugin manager and context available to the fastify instance
		fastify.decorate("pluginManager", pluginManager);
		fastify.decorate("pluginContext", pluginContext);

		fastify.log.info("Plugin system initialized successfully");

		// Log loaded plugins
		const loadedPlugins = pluginManager.getLoadedPlugins();
		if (loadedPlugins.length > 0) {
			fastify.log.info(
				`Loaded ${loadedPlugins.length} plugins: ${loadedPlugins
					.map((p: { id: string }) => p.id)
					.join(", ")}`,
			);
		} else {
			fastify.log.info("No plugins loaded");
		}

		// Gracefully shutdown plugin system when server closes
		fastify.addHook("onClose", async () => {
			try {
				fastify.log.info("Shutting down plugin system...");

				// Use graceful shutdown to avoid unnecessary deactivation and schema updates
				await pluginManager.gracefulShutdown();

				fastify.log.info("Plugin system shut down successfully");
			} catch (error) {
				fastify.log.error(
					{ error },
					"Error occurred while shutting down plugin system",
				);
			}
		});
	} catch (error) {
		fastify.log.error({ error }, "Failed to initialize plugin system");
		throw new TalawaRestError({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Plugin system initialization failed",
			details: { cause: error },
		});
	}
});

export default pluginSystem;
