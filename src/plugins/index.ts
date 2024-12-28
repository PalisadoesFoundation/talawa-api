import fastifyPlugin from "fastify-plugin";
import drizzleClient from "./drizzleClient";
import minioClient from "./minioClient";
import seedDatabase from "./seedPostgres";

export const plugins = fastifyPlugin(async (fastify) => {
	fastify.register(drizzleClient);
	fastify.register(seedDatabase);
	fastify.register(minioClient);
});

export default plugins;
