import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import {
	getBackgroundWorkerService,
	initializeBackgroundWorkerService,
} from "~/src/workers";

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

	// Initialize the background worker service
	initializeBackgroundWorkerService(fastify.drizzleClient, fastify.log);

	const workerService = getBackgroundWorkerService();

	// Start the background workers
	await workerService.start();

	fastify.log.info("Background workers started successfully");

	// Register shutdown hook to gracefully stop workers
	fastify.addHook("onClose", async () => {
		fastify.log.info("Shutting down background workers...");
		await workerService.stop();
		fastify.log.info("Background workers stopped successfully");
	});

	// Decorate fastify instance with worker service for access in routes
	fastify.decorate("backgroundWorkerService", workerService);
};

// Export as fastify plugin
export default fastifyPlugin(backgroundWorkersPlugin, {
	name: "backgroundWorkers",
	dependencies: ["drizzleClient"], // Depends on drizzle client being available
});

// Extend FastifyInstance type to include backgroundWorkerService
declare module "fastify" {
	interface FastifyInstance {
		backgroundWorkerService: ReturnType<typeof getBackgroundWorkerService>;
	}
}
