import type {
	FastifyError,
	FastifyInstance,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fastifyPlugin from "fastify-plugin";
import { normalizeError } from "~/src/utilities/errors/errorTransformer";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

/**
 * Global Fastify error handler plugin that provides unified error responses.
 *
 * This plugin registers a global error handler that:
 * - Transforms all errors into standardized response format
 * - Adds correlation IDs for request tracing
 * - Maps error codes to appropriate HTTP status codes
 * - Provides structured logging with error context
 * - Handles various error types (TalawaRestError, validation errors, generic errors)
 *
 * The error handler ensures consistent error responses across all REST endpoints
 * and integrates with the error transformation system.
 *
 * @example
 * ```ts
 * // Register the plugin
 * await fastify.register(errorHandlerPlugin);
 *
 * // Now all routes can throw structured errors
 * fastify.get('/users/:id', async (request) => {
 *   const user = await findUser(request.params.id);
 *   if (!user) {
 *     throw new TalawaRestError({
 *       code: ErrorCode.NOT_FOUND,
 *       message: 'User not found',
 *       details: { userId: request.params.id }
 *     });
 *   }
 *   return user;
 * });
 * ```
 *
 * @param fastify - The Fastify instance to register the error handler on
 */
export const errorHandlerPlugin = fastifyPlugin(
	async (fastify: FastifyInstance) => {
		fastify.setErrorHandler(
			(error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
				// Extract correlation ID from request for tracing
				const correlationId = request.id as string;

				// Transform error to standardized format
				const normalized = normalizeError(error);

				// Log error with structured context for monitoring
				request.log.error({
					msg: "Request error",
					correlationId,
					error: {
						message: normalized.message,
						code: normalized.code,
						details: normalized.details,
					},
				});

				// Prefer original TalawaRestError JSON format for consistency
				if (error instanceof TalawaRestError) {
					return reply
						.status(normalized.statusCode)
						.send(error.toJSON(correlationId));
				}

				// Send standardized error response for all other error types
				return reply.status(normalized.statusCode).send({
					error: {
						code: normalized.code,
						message: normalized.message,
						details: normalized.details,
						correlationId,
					},
				});
			},
		);
	},
);

export default errorHandlerPlugin;
