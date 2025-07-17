import fastifyPlugin from "fastify-plugin";
import drizzleClient from "../fastifyPlugins/drizzleClient";
import minioClient from "../fastifyPlugins/minioClient";
import seedInitialData from "../fastifyPlugins/seedInitialData";
import backgroundWorkers from "./backgroundWorkers";

export const plugins = fastifyPlugin(async (fastify) => {
	await fastify.register(drizzleClient);
	await fastify.register(minioClient);
	await fastify.register(seedInitialData);
	// Register background workers after drizzle client is available
	await fastify.register(backgroundWorkers);
});

export default plugins;
