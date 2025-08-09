import type { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { initializeEmailQueue } from "~/src/services/ses/emailServiceInstance";

const emailQueuePlugin = async (fastify: FastifyInstance) => {
	// Initialize after drizzle client is available
	initializeEmailQueue({
		drizzleClient: fastify.drizzleClient,
		log: fastify.log,
	});

	// Optionally, add onClose to stop timers if needed in future
	fastify.addHook("onClose", async () => {
		fastify.log.info("Email queue processor stopping (onClose)");
	});
};

export default fastifyPlugin(emailQueuePlugin, {
	name: "emailQueue",
	dependencies: ["drizzleClient"],
});
