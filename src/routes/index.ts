import fastifyPlugin from "fastify-plugin";
import pluginWebhooks from "../plugin/pluginWebhooks";
import graphql from "./graphql";
import healthcheck from "./healthcheck";
import objects from "./objects";

/**
 * This fastify plugin function contains all talawa api routes within it.
 *
 * @example
 * ```typescript
 * import routes from "./routes/index";
 * fastify.register(routes, {});
 * ```
 */
export const routes = fastifyPlugin(async (fastify) => {
	fastify.register(graphql);
	fastify.register(healthcheck);
	fastify.register(objects);
	fastify.register(pluginWebhooks);
});

export default routes;
