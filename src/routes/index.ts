import fastifyPlugin from "fastify-plugin";
import graphql from "./graphql";
import healthcheck from "./healthcheck";
import objects from "./objects";

/**
 * This fastify plugin function contains all talawa api routes within it.
 *
 * @example
 * import routes from "./routes/index";
 * fastify.register(routes, {});
 */
export const routes = fastifyPlugin(async (fastify) => {
	fastify.register(graphql);
	fastify.register(healthcheck);
	fastify.register(objects);
});

export default routes;
