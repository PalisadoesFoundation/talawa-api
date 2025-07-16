import fastifyPlugin from "fastify-plugin";
import backgroundWorkers from "./backgroundWorkers";
import drizzleClient from "./drizzleClient";
import minioClient from "./minioClient";
import seedInitialData from "./seedInitialData";

export const plugins = fastifyPlugin(async (fastify) => {
	await fastify.register(drizzleClient);
	await fastify.register(minioClient);
	await fastify.register(seedInitialData);
	// Register background workers after drizzle client is available
	await fastify.register(backgroundWorkers);
});

export default plugins;
