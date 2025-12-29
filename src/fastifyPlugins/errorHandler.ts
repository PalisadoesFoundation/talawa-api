import type {
	FastifyError,
	FastifyInstance,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

export default fp(async function errorHandlerPlugin(app: FastifyInstance) {
	app.setErrorHandler(
		(error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
			const cid = request.id as string;

			request.log.error({ error, correlationId: cid });

			reply.status(500).send({
				error: {
					message: error.message,
					correlationId: cid,
				},
			});
		},
	);
});
