import fastifyPlugin from "fastify-plugin";
import drizzleClient from "../fastifyPlugins/drizzleClient";
import minioClient from "../fastifyPlugins/minioClient";
import performance from "../fastifyPlugins/performance";
import seedInitialData from "../fastifyPlugins/seedInitialData";
import backgroundWorkers from "./backgroundWorkers";

export const plugins = fastifyPlugin(async (fastify) => {
	await fastify.register(drizzleClient);
	await fastify.register(minioClient);
	await fastify.register(performance); // Register performance tracking before background workers
	await fastify.register(seedInitialData);
	// Register background workers after drizzle client and performance plugin are available
	await fastify.register(backgroundWorkers);
});

export default plugins;
