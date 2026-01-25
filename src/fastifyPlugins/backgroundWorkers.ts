import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { startBackgroundWorkers, stopBackgroundWorkers } from "~/src/workers";

/**
 * Background worker plugin for event materialization.
 *
 * This plugin:
 * - Initializes the background worker service
 * - Starts the materialization and cleanup workers
 * - Starts metrics aggregation worker if enabled (requires performance plugin)
 * - Handles graceful shutdown of workers
 * - Provides worker status endpoints
 *
 * **Dependencies:** The performance plugin must be registered before this plugin.
 * This is enforced via the `dependencies` array in the plugin configuration.
 */
const backgroundWorkersPlugin = async (fastify: FastifyInstance) => {
	fastify.log.info("Initializing background workers...");

	// Get snapshot getter from the required performance plugin
	// Runtime guard: verify the dependency is properly registered
	const getMetricsSnapshots = fastify.getMetricsSnapshots;

	if (!getMetricsSnapshots) {
		fastify.log.error(
			"Performance plugin dependency not properly registered: getMetricsSnapshots is undefined. " +
			"Ensure the performance plugin is registered before backgroundWorkers.",
		);
		throw new Error(
			"Required dependency 'getMetricsSnapshots' from performance plugin is not available",
		);
	}

	// Start the background workers (with optional cache warming and metrics)
	await startBackgroundWorkers(
		fastify.drizzleClient,
		fastify.log,
		fastify.cache,
		getMetricsSnapshots,
	);

	fastify.log.info("Background workers started successfully");

	// Register shutdown hook to gracefully stop workers
	fastify.addHook("onClose", async () => {
		fastify.log.info("Shutting down background workers...");
		await stopBackgroundWorkers(fastify.log);
		fastify.log.info("Background workers stopped successfully");
	});
};

// Export as fastify plugin
export default fastifyPlugin(backgroundWorkersPlugin, {
	name: "backgroundWorkers",
	dependencies: ["drizzleClient", "performance"], // Depends on drizzle client and performance plugin
});
