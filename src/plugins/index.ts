import fastifyPlugin from "fastify-plugin";
import drizzleClient from "./drizzleClient";
import seedDatabase from "./seedPostgres";

export const plugins = fastifyPlugin(async (fastify) => {
	fastify.register(drizzleClient);
	fastify.register(seedDatabase);
});

export default plugins;
