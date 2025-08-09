import fastifyPlugin from "fastify-plugin";
// import backgroundWorkers from "./backgroundWorkers";
import drizzleClient from "./drizzleClient";
import emailQueue from "./emailQueue";
import minioClient from "./minioClient";
import pluginSystem from "./pluginSystem";
import seedInitialData from "./seedInitialData";

export const plugins = fastifyPlugin(async (fastify) => {
	await fastify.register(drizzleClient);
	await fastify.register(minioClient);
	await fastify.register(pluginSystem); // Initialize plugin system after database
	await fastify.register(seedInitialData);
	await fastify.register(emailQueue);
	// Register background workers after drizzle client is available
	// await fastify.register(backgroundWorkers);
});

export default plugins;
