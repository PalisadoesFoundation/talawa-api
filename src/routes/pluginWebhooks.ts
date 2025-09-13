import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

/**
 * Dynamic plugin webhook routes
 * This handles webhooks from any plugin dynamically
 */
export const pluginWebhooks = fastifyPlugin(
	async (fastify: FastifyInstance) => {
		// Dynamic webhook endpoint that handles any plugin webhook
		fastify.all(
			"/api/plugins/:pluginId/webhook/*",
			async (request: FastifyRequest, reply: FastifyReply) => {
				try {
					const { pluginId } = request.params as { pluginId: string };
					const url = request.url;

					// Extract the webhook path after /api/plugins/:pluginId/webhook/
					const webhookPath =
						url.replace(`/api/plugins/${pluginId}/webhook`, "") || "/";
					// Normalize path - ensure it starts with / for root path, otherwise remove leading slash
					const normalizedPath =
						webhookPath === "/"
							? "/"
							: webhookPath.startsWith("/")
								? webhookPath.slice(1)
								: webhookPath;

					// Get plugin manager
					const pluginManager = fastify.pluginManager;
					if (!pluginManager) {
						reply.status(500).send({ error: "Plugin manager not available" });
						return;
					}

					// Get extension registry
					const extensionRegistry = pluginManager.getExtensionRegistry();
					const webhookKey = `${pluginId}:${normalizedPath}`;

					// Find webhook handler
					const webhookHandler =
						extensionRegistry.webhooks?.handlers?.[webhookKey];

					if (!webhookHandler) {
						// Log debug information
						fastify.log.info(`Webhook lookup failed for ${webhookKey}`);
						fastify.log.info(
							`Available webhook handlers: ${JSON.stringify(Object.keys(extensionRegistry.webhooks?.handlers || {}))}`,
						);

						reply.status(404).send({
							error: "Webhook not found",
							message: `No webhook handler found for plugin '${pluginId}' at path '${normalizedPath}'`,
							debug: {
								webhookKey,
								availableHandlers: Object.keys(
									extensionRegistry.webhooks?.handlers || {},
								),
								extensionRegistry: {
									hasWebhooks: !!extensionRegistry.webhooks,
									handlersCount: Object.keys(
										extensionRegistry.webhooks?.handlers || {},
									).length,
								},
							},
						});
						return;
					}

					// Execute webhook handler
					await webhookHandler(request, reply);
				} catch (error) {
					fastify.log.error("Plugin webhook processing error:", error);
					reply.status(500).send({
						error: "Internal server error",
						message: error instanceof Error ? error.message : "Unknown error",
					});
				}
			},
		);

		// Health check endpoint for plugin webhooks
		fastify.get(
			"/api/plugins/:pluginId/webhook/health",
			async (request: FastifyRequest, reply: FastifyReply) => {
				const { pluginId } = request.params as { pluginId: string };

				reply.status(200).send({
					status: "healthy",
					timestamp: new Date().toISOString(),
					plugin: pluginId,
					endpoint: "webhook",
				});
			},
		);
	},
);

export default pluginWebhooks;
