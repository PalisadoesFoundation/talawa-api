import type {
	FastifyError,
	FastifyInstance,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

/**
 * Fastify error handler plugin for centralized error handling.
 *
 * This plugin sets up a global error handler that:
 * - Captures all errors thrown during request processing
 * - Logs errors with correlation ID for request tracing
 * - Returns appropriate HTTP status codes (500 for server errors, original status for client errors)
 * - Masks sensitive error details for 5xx errors
 * - Includes correlation ID in error responses for client reference
 *
 * @param app - The Fastify application instance
 * @returns Resolves when the error handler is registered
 *
 * @example
 * ```ts
 * await app.register(errorHandlerPlugin);
 * ```
 *
 * @remarks
 * - The correlation ID is extracted from the request object (Fastify assigns a unique ID to each request)
 * - Server errors (5xx) return a generic message to prevent information leakage
 * - Client errors (4xx) return the original error message
 * - All errors are logged with full error details for debugging purposes
 */
export default fp(async function errorHandlerPlugin(app: FastifyInstance) {
	app.setErrorHandler(
		(error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
			const cid = request.id as string;
			const statusCode = error.statusCode || 500;

			request.log.error({ error, correlationId: cid });

			const responseError: Record<string, unknown> = {
				message: statusCode >= 500 ? "Internal Server Error" : error.message,
				correlationId: cid,
			};

			// Handle custom error properties (code, details) if present
			if (statusCode < 500) {
				if ("code" in error) {
					responseError.code = (error as { code: unknown }).code;
				}
				if ("details" in error) {
					responseError.details = (error as { details: unknown }).details;
				}
			}

			reply.status(statusCode).send({
				error: responseError,
			});
		},
	);
});
