import fastifyPlugin from "fastify-plugin";
import auth from "./auth";
import backgroundWorkers from "./backgroundWorkers";
import cacheService from "./cacheService";
import drizzleClient from "./drizzleClient";
import emailQueue from "./emailQueue";
import errorHandlerPlugin from "./errorHandler";
import minioClient from "./minioClient";
import oauthProviderRegistry from "./oauthProviderRegistry";
import performance from "./performance";
import pluginSystem from "./pluginSystem";
import rateLimit from "./rateLimit";
import seedInitialData from "./seedInitialData";

export const plugins = fastifyPlugin(async (fastify) => {
	await fastify.register(errorHandlerPlugin);
	await fastify.register(drizzleClient);
	await fastify.register(cacheService); // Register cache service (uses Redis from createServer)
	await fastify.register(rateLimit); // Register rate limit plugin
	await fastify.register(auth); // Sets request.currentUser from JWT; provides requireAuth()
	await fastify.register(minioClient);
	await fastify.register(oauthProviderRegistry); // Register OAuth provider registry
	await fastify.register(pluginSystem); // Initialize plugin system after database
	await fastify.register(performance); // Register performance tracking
	await fastify.register(seedInitialData);
	// Conditionally register the email queue plugin to avoid starting background
	// processors in environments (tests/CI) where it's not needed.
	// Prefer fastify.envConfig (added by env plugin) but fall back to process.env
	const rawEnableEmailQueue =
		(fastify as unknown as { envConfig?: { API_ENABLE_EMAIL_QUEUE?: boolean } })
			.envConfig?.API_ENABLE_EMAIL_QUEUE ??
		process.env.API_ENABLE_EMAIL_QUEUE ??
		"false";
	const enableEmailQueue =
		rawEnableEmailQueue.toString().toLowerCase() === "true";
	if (enableEmailQueue) {
		await fastify.register(emailQueue);
	} else {
		fastify.log.info("emailQueue disabled (API_ENABLE_EMAIL_QUEUE!=true)");
	}
	// Register background workers after drizzle client is available
	await fastify.register(backgroundWorkers);
});

export default plugins;
