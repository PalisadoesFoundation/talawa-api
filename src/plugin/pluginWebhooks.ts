import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

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
						return reply.status(500).send({ error: "Plugin manager not available" });
					}

					const extensionRegistry = pluginManager.getExtensionRegistry();
					const webhookKey = `${pluginId}:/`;

					const webhookHandler = extensionRegistry.webhooks?.handlers?.[webhookKey];
					if (!webhookHandler) {
						return reply.status(404).send({
							error: "Webhook not found",
							message: `No webhook handler found for plugin '${pluginId}'`
						});
					}

					// Inject plugin context
					(request as any).pluginContext = fastify.pluginContext;
					await webhookHandler(request, reply);
				} catch (error) {
					fastify.log.error("Plugin webhook error:", error);
					reply.status(500).send({
						error: "Internal server error",
						message: error instanceof Error ? error.message : "Unknown error"
					});
				}
			}
		);

		// Also handle webhook with trailing path for backward compatibility
		fastify.all(
			"/api/plugins/:pluginId/webhook/*",
			async (request: FastifyRequest, reply: FastifyReply) => {
				try {
					const { pluginId, "*": wildcardPath } = request.params as { 
						pluginId: string; 
						"*": string 
					};
					
					// Use wildcard path directly, default to "/" if empty
					const normalizedPath = wildcardPath || "/";

					// Get webhook handler from extension registry
					const pluginManager = fastify.pluginManager;
					if (!pluginManager) {
						return reply.status(500).send({ error: "Plugin manager not available" });
					}

					const extensionRegistry = pluginManager.getExtensionRegistry();
					const webhookKey = `${pluginId}:${normalizedPath}`;
					const webhookHandler = extensionRegistry.webhooks?.handlers?.[webhookKey];

					if (!webhookHandler) {
						return reply.status(404).send({
							error: "Webhook not found",
							message: `No webhook handler found for plugin '${pluginId}' at path '${normalizedPath}'`
						});
					}

					// Inject plugin context into request for webhook handler
					(request as any).pluginContext = fastify.pluginContext;

					// Execute webhook handler
					await webhookHandler(request, reply);
				} catch (error) {
					fastify.log.error("Plugin webhook error:", error);
					reply.status(500).send({
						error: "Internal server error",
						message: error instanceof Error ? error.message : "Unknown error"
					});
				}
			},
		);
	},
);

export default pluginWebhooks;
