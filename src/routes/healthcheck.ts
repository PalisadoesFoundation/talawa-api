import type { FastifyPluginAsync } from "fastify";

/**
 * This fastify route plugin is used to initialize a healthcheck endpoint on the fastify server for external services to check health of talawa api.
 */
export const healthcheck: FastifyPluginAsync = async (fastify) => {
	fastify.get("/healthcheck", async (_request, reply) =>
		reply.status(200).send({
			health: "ok",
		}),
	);
};

export default healthcheck;
