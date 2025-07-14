import fastifyPlugin from "fastify-plugin";
import drizzleClient from "./drizzleClient";
import minioClient from "./minioClient";
import pluginSystem from "./pluginSystem";
import seedInitialData from "./seedInitialData";

export const plugins = fastifyPlugin(async (fastify) => {
	fastify.register(drizzleClient);
	fastify.register(minioClient);
	fastify.register(pluginSystem); // Initialize plugin system after database
	fastify.register(seedInitialData);
});

export default plugins;
