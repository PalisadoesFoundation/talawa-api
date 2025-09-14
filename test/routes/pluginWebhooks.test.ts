import type { FastifyInstance } from "fastify";
import fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IExtensionRegistry } from "../../src/plugin/types";
import { pluginWebhooks } from "../../src/routes/pluginWebhooks";

// Mock plugin manager with partial implementation
const mockPluginManager = {
	getExtensionRegistry: vi.fn(),
	loadedPlugins: new Map(),
	extensionRegistry: {},
	pluginContext: {},
	pluginsDirectory: "/test/plugins",
	isSystemInitialized: vi.fn(() => true),
	getLoadedPlugins: vi.fn(() => []),
	on: vi.fn(),
	emit: vi.fn(),
} satisfies Partial<{
	getExtensionRegistry: ReturnType<typeof vi.fn>;
	loadedPlugins: Map<string, unknown>;
	extensionRegistry: Record<string, unknown>;
	pluginContext: Record<string, unknown>;
	pluginsDirectory: string;
	isSystemInitialized: ReturnType<typeof vi.fn>;
	getLoadedPlugins: ReturnType<typeof vi.fn>;
	on: ReturnType<typeof vi.fn>;
	emit: ReturnType<typeof vi.fn>;
}>;

describe("pluginWebhooks", () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		vi.clearAllMocks();
		app = fastify({ logger: false });

		// Add plugin manager to fastify instance
		app.decorate("pluginManager", mockPluginManager as never);

		await app.register(pluginWebhooks);
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Dynamic webhook endpoint", () => {
		it("should handle webhook requests successfully", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:webhook-path": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/webhook-path",
				payload: { test: "data" },
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object), // request
				expect.any(Object), // reply
			);
			expect(mockPluginManager.getExtensionRegistry).toHaveBeenCalled();
		});

		it("should handle GET webhook requests", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:get-endpoint": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "GET",
				url: "/api/plugins/test-plugin/webhook/get-endpoint",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should handle PUT webhook requests", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:put-endpoint": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "PUT",
				url: "/api/plugins/test-plugin/webhook/put-endpoint",
				payload: { update: "data" },
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should handle DELETE webhook requests", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:delete-endpoint": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "DELETE",
				url: "/api/plugins/test-plugin/webhook/delete-endpoint",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should normalize root path correctly", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:/": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should normalize path by removing leading slash", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:nested/path": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/nested/path",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should handle path without leading slash", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:no-slash": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			// This tests the case where webhookPath doesn't start with '/'
			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/no-slash",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should return 500 when plugin manager is not available", async () => {
			// Create a new app without plugin manager
			const appWithoutManager = fastify({ logger: false });
			await appWithoutManager.register(pluginWebhooks);

			const response = await appWithoutManager.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/test-path",
			});

			expect(response.statusCode).toBe(500);
			expect(JSON.parse(response.body)).toEqual({
				error: "Plugin manager not available",
			});

			await appWithoutManager.close();
		});

		it("should return 404 when webhook handler is not found", async () => {
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {}, // No handlers
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/non-existent",
			});

			expect(response.statusCode).toBe(404);
			const responseBody = JSON.parse(response.body);
			expect(responseBody.error).toBe("Webhook not found");
			expect(responseBody.message).toBe(
				"No webhook handler found for plugin 'test-plugin' at path 'non-existent'",
			);
			expect(responseBody.debug).toBeDefined();
			expect(responseBody.debug.webhookKey).toBe("test-plugin:non-existent");
			expect(responseBody.debug.availableHandlers).toEqual([]);
			expect(responseBody.debug.extensionRegistry.hasWebhooks).toBe(true);
			expect(responseBody.debug.extensionRegistry.handlersCount).toBe(0);
		});

		it("should return 404 when webhooks extension registry is undefined", async () => {
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {} as Record<
						string,
						(request: unknown, reply: unknown) => Promise<unknown>
					>,
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/test-path",
			});

			expect(response.statusCode).toBe(404);
			const responseBody = JSON.parse(response.body);
			expect(responseBody.debug.extensionRegistry.hasWebhooks).toBe(true);
			expect(responseBody.debug.extensionRegistry.handlersCount).toBe(0);
		});

		it("should return 404 when webhooks is undefined", async () => {
			const mockExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: undefined,
			} as unknown as IExtensionRegistry;

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/test-path",
			});

			expect(response.statusCode).toBe(404);
			const responseBody = JSON.parse(response.body);
			expect(responseBody.debug.extensionRegistry.hasWebhooks).toBe(false);
			expect(responseBody.debug.extensionRegistry.handlersCount).toBe(0);
		});

		it("should handle webhook handler execution errors", async () => {
			const mockWebhookHandler = vi
				.fn()
				.mockRejectedValue(new Error("Webhook execution failed"));
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:error-handler": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/error-handler",
			});

			expect(response.statusCode).toBe(500);
			const responseBody = JSON.parse(response.body);
			expect(responseBody.error).toBe("Internal server error");
			expect(responseBody.message).toBe("Webhook execution failed");
		});

		it("should handle unknown error types", async () => {
			const mockWebhookHandler = vi.fn().mockRejectedValue("String error");
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:unknown-error": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/unknown-error",
			});

			expect(response.statusCode).toBe(500);
			const responseBody = JSON.parse(response.body);
			expect(responseBody.error).toBe("Internal server error");
			expect(responseBody.message).toBe("Unknown error");
		});

		it("should handle complex nested paths", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:api/v1/users/123/action": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/api/v1/users/123/action",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});
	});

	describe("Health check endpoint", () => {
		it("should return health check response", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/plugins/test-plugin/webhook/health",
			});

			expect(response.statusCode).toBe(200);
			const responseBody = JSON.parse(response.body);
			expect(responseBody.status).toBe("healthy");
			expect(responseBody.plugin).toBe("test-plugin");
			expect(responseBody.endpoint).toBe("webhook");
			expect(responseBody.timestamp).toBeDefined();
			expect(new Date(responseBody.timestamp)).toBeInstanceOf(Date);
		});

		it("should handle health check for different plugin IDs", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/api/plugins/another-plugin/webhook/health",
			});

			expect(response.statusCode).toBe(200);
			const responseBody = JSON.parse(response.body);
			expect(responseBody.plugin).toBe("another-plugin");
		});
	});

	describe("Plugin registration", () => {
		it("should register plugin successfully", async () => {
			// Test that the plugin is registered without errors
			const newApp = fastify({ logger: false });
			newApp.decorate("pluginManager", mockPluginManager as never);

			await expect(newApp.register(pluginWebhooks)).resolves.not.toThrow();
			await newApp.close();
		});

		it("should handle plugin registration with existing routes", async () => {
			const newApp = fastify({ logger: false });
			newApp.decorate("pluginManager", mockPluginManager as never);

			// Register some other routes first
			newApp.get("/test", async () => ({ test: true }));

			await expect(newApp.register(pluginWebhooks)).resolves.not.toThrow();

			// Verify original route still works
			const response = await newApp.inject({
				method: "GET",
				url: "/test",
			});
			expect(response.statusCode).toBe(200);

			await newApp.close();
		});
	});

	describe("Edge cases", () => {
		it("should handle empty plugin ID", async () => {
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			const response = await app.inject({
				method: "POST",
				url: "/api/plugins//webhook/test-path",
			});

			expect(response.statusCode).toBe(404);
		});

		it("should handle webhook path with query parameters", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:endpoint": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/endpoint?param=value",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});

		it("should handle webhook with special characters in path", async () => {
			const mockWebhookHandler = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: {
					handlers: {
						"test-plugin:special-chars_123": mockWebhookHandler,
					},
				},
			};

			mockPluginManager.getExtensionRegistry.mockReturnValue(
				mockExtensionRegistry,
			);

			await app.inject({
				method: "POST",
				url: "/api/plugins/test-plugin/webhook/special-chars_123",
			});

			expect(mockWebhookHandler).toHaveBeenCalledWith(
				expect.any(Object),
				expect.any(Object),
			);
		});
	});
});
