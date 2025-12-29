import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

/**
 * Extended FastifyRequest with plugin context
 */
interface FastifyRequestWithPluginContext extends FastifyRequest {
	pluginContext?: unknown;
}

/**
 * Dynamic plugin webhook routes
 * Handles webhooks from any plugin dynamically
 */
export const pluginWebhooks = fastifyPlugin(
	async (fastify: FastifyInstance) => {
		// Dynamic webhook endpoint that handles any plugin webhook
		fastify.all(
			"/api/plugins/:pluginId/webhook",
			async (request: FastifyRequest, reply: FastifyReply) => {
				try {
					const { pluginId } = request.params as { pluginId: string };

					// Get webhook handler from extension registry
					const pluginManager = fastify.pluginManager;
					if (!pluginManager) {
						throw new TalawaRestError({
							code: ErrorCode.INTERNAL_SERVER_ERROR,
							message: "Plugin manager not available",
						});
					}

					const extensionRegistry = pluginManager.getExtensionRegistry();
					const webhookKey = `${pluginId}:/`;

					const webhookHandler =
						extensionRegistry.webhooks?.handlers?.[webhookKey];
					if (!webhookHandler) {
						throw new TalawaRestError({
							code: ErrorCode.NOT_FOUND,
							message: `No webhook handler found for plugin '${pluginId}'`,
							details: { pluginId },
						});
					}

					// Inject plugin context
					const requestWithContext = request as FastifyRequestWithPluginContext;
					requestWithContext.pluginContext = fastify.pluginContext;
					await webhookHandler(request, reply);
				} catch (error) {
					// Re-throw TalawaRestError to be handled by global error handler
					if (error instanceof TalawaRestError) {
						throw error;
					}

					fastify.log.error(error, "Plugin webhook error");
					throw new TalawaRestError({
						code: ErrorCode.INTERNAL_SERVER_ERROR,
						message: "Plugin webhook execution failed",
						details:
							error instanceof Error ? { message: error.message } : { error },
					});
				}
			},
		);

		// Also handle webhook with trailing path for backward compatibility
		fastify.all(
			"/api/plugins/:pluginId/webhook/*",
			async (request: FastifyRequest, reply: FastifyReply) => {
				try {
					const { pluginId, "*": wildcardPath } = request.params as {
						pluginId: string;
						"*": string;
					};

					// Use wildcard path directly, default to "/" if empty
					const normalizedPath = wildcardPath || "/";

					// Get webhook handler from extension registry
					const pluginManager = fastify.pluginManager;
					if (!pluginManager) {
						throw new TalawaRestError({
							code: ErrorCode.INTERNAL_SERVER_ERROR,
							message: "Plugin manager not available",
						});
					}

					const extensionRegistry = pluginManager.getExtensionRegistry();
					const webhookKey = `${pluginId}:${normalizedPath}`;
					const webhookHandler =
						extensionRegistry.webhooks?.handlers?.[webhookKey];

					if (!webhookHandler) {
						throw new TalawaRestError({
							code: ErrorCode.NOT_FOUND,
							message: `No webhook handler found for plugin '${pluginId}' at path '${normalizedPath}'`,
							details: { pluginId, path: normalizedPath },
						});
					}

					// Inject plugin context into request for webhook handler
					const requestWithContext = request as FastifyRequestWithPluginContext;
					requestWithContext.pluginContext = fastify.pluginContext;

					// Execute webhook handler
					await webhookHandler(request, reply);
				} catch (error) {
					// Re-throw TalawaRestError to be handled by global error handler
					if (error instanceof TalawaRestError) {
						throw error;
					}

					fastify.log.error(error, "Plugin webhook error");
					throw new TalawaRestError({
						code: ErrorCode.INTERNAL_SERVER_ERROR,
						message: "Plugin webhook execution failed",
						details:
							error instanceof Error ? { message: error.message } : { error },
					});
				}
			},
		);
	},
);

export default pluginWebhooks;
