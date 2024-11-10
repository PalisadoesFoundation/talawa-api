import fastifyPlugin from "fastify-plugin";
import drizzleClient from "./drizzleClient";

export const plugins = fastifyPlugin(async (fastify) => {
	fastify.register(drizzleClient);
});

export default plugins;
