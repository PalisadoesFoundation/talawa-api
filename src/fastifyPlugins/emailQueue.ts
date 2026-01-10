import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import {
	initializeEmailQueue,
	stopEmailQueue,
} from "~/src/services/ses/emailServiceInstance";
import type { AppLogger } from "../utilities/logging/logger";

const emailQueuePlugin = async (fastify: FastifyInstance) => {
	// Check if email queue is enabled
	const envConfig = fastify.envConfig as { API_ENABLE_EMAIL_QUEUE: boolean };
	if (!envConfig.API_ENABLE_EMAIL_QUEUE) {
		fastify.log.info("Email queue disabled by API_ENABLE_EMAIL_QUEUE env var");
		return;
	}

	// Initialize after drizzle client is available
	initializeEmailQueue({
		drizzleClient: fastify.drizzleClient,
		log: fastify.log as AppLogger,
		envConfig: envConfig,
	});

	fastify.addHook("onClose", async (instance) => {
		stopEmailQueue(instance.log);
	});
};

export default fastifyPlugin(emailQueuePlugin, {
	name: "emailQueue",
	dependencies: ["drizzleClient"],
});
