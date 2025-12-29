import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandlerPlugin } from "../../src/fastifyPlugins/errorHandler";
import type PluginManager from "../../src/plugin/manager";
import { pluginWebhooks } from "../../src/plugin/pluginWebhooks";
import type {
	IExtensionRegistry,
	IPluginContext,
} from "../../src/plugin/types";

describe("Plugin Webhooks", () => {
	let mockWebhookHandler: ReturnType<typeof vi.fn>;

	const createTestApp = async (
		customPluginManager?: Partial<PluginManager> | null,
		customContext?: IPluginContext | null,
	) => {
		const testApp = Fastify();

		// Register error handler first
		await testApp.register(errorHandlerPlugin);

		// Create mock extension registry
		const mockExtensionRegistry = {
			graphql: {
				builderExtensions: [],
			},
			database: {
				tables: {},
				enums: {},
				relations: {},
			},
			hooks: {
				pre: {},
				post: {},
			},
			webhooks: {
				handlers: {
					"test-plugin:/": mockWebhookHandler,
					"test-plugin:custom/path": mockWebhookHandler,
				},
			},
		};

		// Create mock plugin manager
		const pluginManager =
			customPluginManager === null
				? undefined
				: customPluginManager || {
						getExtensionRegistry: vi
							.fn()
							.mockReturnValue(mockExtensionRegistry),
					};

		// Add plugin manager and context to the app (only if pluginManager is not undefined)
		if (pluginManager !== undefined) {
			testApp.decorate(
				"pluginManager",
				pluginManager as unknown as PluginManager,
			);
		}

		const context =
			customContext === undefined
				? ({ test: "context" } as unknown as IPluginContext)
				: customContext;

		if (context !== null) {
			testApp.decorate("pluginContext", context);
		}

		// Register the plugin webhooks
		await testApp.register(pluginWebhooks);

		return testApp;
	};

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock webhook handler
		mockWebhookHandler = vi.fn().mockResolvedValue(undefined);
	});

	describe("Plugin Registration", () => {
		it("should register webhook routes on fastify instance", async () => {
			const app = await createTestApp();

			// Test that routes are registered by making requests to them
			const response1 = await app.inject({
				method: "GET",
				url: "/api/plugins/test-plugin/webhook",
			});

			const response2 = await app.inject({
				method: "GET",
				url: "/api/plugins/test-plugin/webhook/custom/path",
			});

			// Both should not return 404 (route not found)
			expect(response1.statusCode).not.toBe(404);
			expect(response2.statusCode).not.toBe(404);

			await app.close();
		});
	});

	describe("Dynamic Webhook Endpoint (/api/plugins/:pluginId/webhook)", () => {
		it("should successfully handle webhook request with valid plugin", async () => {
			const mockPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue({
					webhooks: {
						handlers: {
							"test-plugin:/": mockWebhookHandler,
						},
					},
				}),
			};
			const app = await createTestApp(mockPluginManager);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
				payload: { test: "data" },
			});

			expect(mockPluginManager.getExtensionRegistry).toHaveBeenCalled();
			expect(mockWebhookHandler).toHaveBeenCalled();

			// Check that plugin context was injected
			const calls = mockWebhookHandler.mock.calls;
			const [request] = calls[0] || [];
			expect(request.pluginContext).toEqual({ test: "context" });

			await app.close();
		});

		it("should return 500 when plugin manager is not available", async () => {
			const app = await createTestApp(null); // No plugin manager

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(500);
			const body = response.json();
			expect(body.error.message).toBe("Plugin manager not available");

			await app.close();
		});

		it("should return 404 when webhook handler is not found", async () => {
			const app = await createTestApp();

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/non-existent-plugin/webhook",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error.message).toBe(
				"No webhook handler found for plugin 'non-existent-plugin'",
			);

			await app.close();
		});

		it("should inject plugin context into request", async () => {
			const app = await createTestApp();

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(mockWebhookHandler).toHaveBeenCalled();
			const calls = mockWebhookHandler.mock.calls;
			const [request] = calls[0] || [];
			expect(request.pluginContext).toEqual({ test: "context" });

			await app.close();
		});

		it("should handle webhook handler execution errors", async () => {
			const webhookError = new Error("Webhook execution failed");
			mockWebhookHandler.mockRejectedValue(webhookError);

			const app = await createTestApp();

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(500);
			const body = response.json();
			expect(body.error.message).toBe("Plugin webhook execution failed");

			await app.close();
		});

		it("should handle non-Error exceptions", async () => {
			const nonErrorException = "String error";
			mockWebhookHandler.mockRejectedValue(nonErrorException);

			const app = await createTestApp();

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(500);
			const body = response.json();
			expect(body.error.message).toBe("Plugin webhook execution failed");

			await app.close();
		});

		it("should use correct webhook key format", async () => {
			const app = await createTestApp();

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			// Verify the webhook handler was called (which means the key "test-plugin:/" was found)
			expect(mockWebhookHandler).toHaveBeenCalled();

			await app.close();
		});
	});

	describe("Wildcard Webhook Endpoint (/api/plugins/:pluginId/webhook/*)", () => {
		it("should successfully handle webhook request with custom path", async () => {
			// Create a separate webhook handler for the custom path
			const customWebhookHandler = vi.fn().mockResolvedValue(undefined);
			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue({
					webhooks: {
						handlers: {
							"test-plugin:/": mockWebhookHandler,
							"test-plugin:custom/path": customWebhookHandler,
						},
					},
				}),
			};

			const app = await createTestApp(customPluginManager);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/custom/path",
				payload: { test: "data" },
			});

			expect(customPluginManager.getExtensionRegistry).toHaveBeenCalled();
			expect(customWebhookHandler).toHaveBeenCalled();

			// Check that plugin context was injected
			const calls = customWebhookHandler.mock.calls;
			const [request] = calls[0] || [];
			expect(request.pluginContext).toEqual({ test: "context" });

			await app.close();
		});

		it("should handle empty wildcard path by defaulting to '/'", async () => {
			const app = await createTestApp();

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/",
			});

			// Should use the default "/" path handler
			expect(mockWebhookHandler).toHaveBeenCalled();

			await app.close();
		});

		it("should return 500 when plugin manager is not available", async () => {
			const app = await createTestApp(null); // No plugin manager

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/custom/path",
			});

			expect(response.statusCode).toBe(500);
			const body = response.json();
			expect(body.error.message).toBe("Plugin manager not available");

			await app.close();
		});

		it("should return 404 when webhook handler is not found for custom path", async () => {
			const app = await createTestApp();

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/non/existent/path",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error.message).toBe(
				"No webhook handler found for plugin 'test-plugin' at path 'non/existent/path'",
			);

			await app.close();
		});

		it("should return 404 when plugin does not exist", async () => {
			const app = await createTestApp();

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/non-existent-plugin/webhook/some/path",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error.message).toBe(
				"No webhook handler found for plugin 'non-existent-plugin' at path 'some/path'",
			);

			await app.close();
		});

		it("should inject plugin context into request", async () => {
			// Create a separate webhook handler for the custom path
			const customWebhookHandler = vi.fn().mockResolvedValue(undefined);
			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue({
					webhooks: {
						handlers: {
							"test-plugin:/": mockWebhookHandler,
							"test-plugin:custom/path": customWebhookHandler,
						},
					},
				}),
			};

			const app = await createTestApp(customPluginManager);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/custom/path",
			});

			expect(customWebhookHandler).toHaveBeenCalled();
			const calls = customWebhookHandler.mock.calls;
			const [request] = calls[0] || [];
			expect(request.pluginContext).toEqual({ test: "context" });

			await app.close();
		});

		it("should handle webhook handler execution errors", async () => {
			const webhookError = new Error("Webhook execution failed");
			const customWebhookHandler = vi.fn().mockRejectedValue(webhookError);
			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue({
					webhooks: {
						handlers: {
							"test-plugin:/": mockWebhookHandler,
							"test-plugin:custom/path": customWebhookHandler,
						},
					},
				}),
			};

			const app = await createTestApp(customPluginManager);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/custom/path",
			});

			expect(response.statusCode).toBe(500);
			const body = response.json();
			expect(body.error.message).toBe("Plugin webhook execution failed");

			await app.close();
		});

		it("should use correct webhook key format with custom path", async () => {
			// Create a separate webhook handler for the custom path
			const customWebhookHandler = vi.fn().mockResolvedValue(undefined);
			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue({
					webhooks: {
						handlers: {
							"test-plugin:/": mockWebhookHandler,
							"test-plugin:custom/path": customWebhookHandler,
						},
					},
				}),
			};

			const app = await createTestApp(customPluginManager);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/custom/path",
			});

			// Verify the custom webhook handler was called (which means the key "test-plugin:custom/path" was found)
			expect(customWebhookHandler).toHaveBeenCalled();

			await app.close();
		});
	});

	describe("Plugin Context Injection", () => {
		it("should inject plugin context from fastify instance", async () => {
			const customContext = {
				custom: "data",
				userId: 123,
			} as unknown as IPluginContext;

			const app = await createTestApp(undefined, customContext);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(mockWebhookHandler).toHaveBeenCalled();
			const calls = mockWebhookHandler.mock.calls;
			const [request] = calls[0] || [];
			expect(request.pluginContext).toBe(customContext);

			await app.close();
		});

		it("should handle undefined plugin context", async () => {
			const app = await createTestApp(undefined, null);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(mockWebhookHandler).toHaveBeenCalled();
			const calls = mockWebhookHandler.mock.calls;
			expect(calls.length).toBeGreaterThan(0);
			const [request] = calls[0] || [];
			expect(request?.pluginContext).toBeUndefined();

			await app.close();
		});
	});

	describe("Extension Registry Integration", () => {
		it("should handle missing webhooks section in extension registry", async () => {
			const registryWithoutWebhooks = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: undefined,
			} as unknown as IExtensionRegistry;

			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue(registryWithoutWebhooks),
			};

			const app = await createTestApp(customPluginManager);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error.message).toBe(
				"No webhook handler found for plugin 'test-plugin'",
			);

			await app.close();
		});

		it("should handle missing handlers in webhooks section", async () => {
			const registryWithoutHandlers = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: undefined,
				},
			} as unknown as IExtensionRegistry;

			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue(registryWithoutHandlers),
			};

			const app = await createTestApp(customPluginManager);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error.message).toBe(
				"No webhook handler found for plugin 'test-plugin'",
			);

			await app.close();
		});

		it("should handle empty handlers object", async () => {
			const registryWithEmptyHandlers = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {},
				},
			};

			const customPluginManager = {
				getExtensionRegistry: vi
					.fn()
					.mockReturnValue(registryWithEmptyHandlers),
			};

			const app = await createTestApp(customPluginManager);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error.message).toBe(
				"No webhook handler found for plugin 'test-plugin'",
			);

			await app.close();
		});
	});

	describe("Error Handling Edge Cases", () => {
		it("should handle getExtensionRegistry throwing an error", async () => {
			const registryError = new Error("Registry access failed");
			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockImplementation(() => {
					throw registryError;
				}),
			};

			const app = await createTestApp(customPluginManager);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(500);
			const body = response.json();
			expect(body.error.message).toBe("Plugin webhook execution failed");

			await app.close();
		});

		it("should handle null webhook handler", async () => {
			const registryWithNullHandler = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:/": null,
					},
				},
			} as unknown as IExtensionRegistry;

			const customPluginManager = {
				getExtensionRegistry: vi.fn().mockReturnValue(registryWithNullHandler),
			};

			const app = await createTestApp(customPluginManager);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			expect(response.statusCode).toBe(404);
			const body = response.json();
			expect(body.error.message).toBe(
				"No webhook handler found for plugin 'test-plugin'",
			);

			await app.close();
		});

		it("should handle missing params object", async () => {
			const app = await createTestApp();

			// This test is less relevant now since we're using real Fastify routing
			// but we can test with an invalid URL structure
			const response = await app.inject({
				method: "POST",
				url: "/api/plugins//webhook", // Empty plugin ID
			});

			// Should handle gracefully - likely return 404 or 500
			expect([404, 500]).toContain(response.statusCode);

			await app.close();
		});
	});

	describe("HTTP Method Support", () => {
		it("should support all HTTP methods", async () => {
			const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

			for (const method of methods) {
				const app = await createTestApp();

				const response = await app.inject({
					method,
					url: "/api/plugins/test-plugin/webhook",
				});

				// Should not return 405 (Method Not Allowed)
				expect(response.statusCode).not.toBe(405);
				expect(mockWebhookHandler).toHaveBeenCalled();

				// Reset mock for next iteration
				mockWebhookHandler.mockClear();

				await app.close();
			}
		});
	});

	describe("Backward Compatibility", () => {
		it("should support both webhook endpoints for backward compatibility", async () => {
			const app = await createTestApp();

			// Test both endpoints work
			const response1 = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook",
			});

			const response2 = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/",
			});

			// Both should work (not return 404)
			expect(response1.statusCode).not.toBe(404);
			expect(response2.statusCode).not.toBe(404);

			await app.close();
		});
	});
});
