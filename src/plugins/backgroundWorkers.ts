import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { startBackgroundWorkers, stopBackgroundWorkers } from "~/src/workers";

/**
 * Background worker plugin for event materialization.
 *
 * This plugin:
 * - Initializes the background worker service
 * - Starts the materialization and cleanup workers
 * - Handles graceful shutdown of workers
 * - Provides worker status endpoints
 */
const backgroundWorkersPlugin = async (fastify: FastifyInstance) => {
	fastify.log.info("Initializing background workers...");

	// Start the background workers (with optional cache warming)
	await startBackgroundWorkers(
		fastify.drizzleClient,
		fastify.log,
		fastify.cache,
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
	dependencies: ["drizzleClient"], // Depends on drizzle client being available
});
