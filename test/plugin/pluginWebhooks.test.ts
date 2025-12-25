import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type PluginManager from "../../src/plugin/manager";
import { pluginWebhooks } from "../../src/plugin/pluginWebhooks";
import type {
	IExtensionRegistry,
	IPluginContext,
} from "../../src/plugin/types";

// Type for mock Fastify instance to avoid 'any' usage
type MockFastifyInstance = Partial<FastifyInstance> & {
	log: {
		info: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
		child: ReturnType<typeof vi.fn>;
		level: string;
		fatal: ReturnType<typeof vi.fn>;
		warn: ReturnType<typeof vi.fn>;
		debug: ReturnType<typeof vi.fn>;
		trace: ReturnType<typeof vi.fn>;
		silent: ReturnType<typeof vi.fn>;
	};
	pluginManager?: Partial<PluginManager>;
	pluginContext?: Partial<IPluginContext>;
	all: ReturnType<typeof vi.fn>;
};

// Type for mock FastifyRequest with plugin context
interface MockFastifyRequest extends Partial<FastifyRequest> {
	params?: Record<string, unknown>;
	pluginContext?: unknown;
}

// Type for mock FastifyReply
type MockFastifyReply = Partial<FastifyReply> & {
	status: ReturnType<typeof vi.fn>;
	send: ReturnType<typeof vi.fn>;
};

// Mock fastify-plugin
vi.mock("fastify-plugin", () => ({
	default: vi.fn((fn) => fn),
}));

import fastifyPlugin from "fastify-plugin";

describe("Plugin Webhooks", () => {
	let mockFastify: MockFastifyInstance;
	let mockRequest: MockFastifyRequest;
	let mockReply: MockFastifyReply;
	let mockPluginManager: Partial<PluginManager>;
	let mockExtensionRegistry: IExtensionRegistry;
	let mockWebhookHandler: ReturnType<typeof vi.fn> &
		((request: unknown, reply: unknown) => Promise<unknown>);

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock webhook handler
		mockWebhookHandler = vi
			.fn()
			.mockResolvedValue(undefined) as typeof mockWebhookHandler;

		// Create mock extension registry
		mockExtensionRegistry = {
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
					"test-plugin:/custom/path": mockWebhookHandler,
				},
			},
		};

		// Create mock plugin manager
		mockPluginManager = {
			getExtensionRegistry: vi.fn().mockReturnValue(mockExtensionRegistry),
		};

		// Create mock fastify instance
		mockFastify = {
			log: {
				info: vi.fn(),
				error: vi.fn(),
				child: vi.fn(),
				level: "info",
				fatal: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn(),
				trace: vi.fn(),
				silent: vi.fn(),
			},
			pluginManager: mockPluginManager,
			pluginContext: { test: "context" },
			all: vi.fn(),
		} as unknown as MockFastifyInstance;

		// Create mock request
		mockRequest = {
			params: {},
		};

		// Create mock reply with chainable methods
		mockReply = {
			status: vi.fn().mockReturnThis(),
			send: vi.fn().mockReturnThis(),
		} as MockFastifyReply;

		// Setup fastify-plugin mock
		(fastifyPlugin as unknown as ReturnType<typeof vi.fn>).mockImplementation(
			(fn: unknown) => fn,
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Plugin Registration", () => {
		it("should register webhook routes on fastify instance", async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);

			expect(mockFastify.all).toHaveBeenCalledTimes(2);
			expect(mockFastify.all).toHaveBeenCalledWith(
				"/api/plugins/:pluginId/webhook",
				expect.any(Function),
			);
			expect(mockFastify.all).toHaveBeenCalledWith(
				"/api/plugins/:pluginId/webhook/*",
				expect.any(Function),
			);
		});
	});

	describe("Dynamic Webhook Endpoint (/api/plugins/:pluginId/webhook)", () => {
		let webhookHandler: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;

		beforeEach(async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);
			// Get the first registered route handler
			const mockCalls = (mockFastify.all as ReturnType<typeof vi.fn>).mock
				?.calls;
			webhookHandler = mockCalls?.[0]?.[1] as (
				request: FastifyRequest,
				reply: FastifyReply,
			) => Promise<void>;
		});

		it("should successfully handle webhook request with valid plugin", async () => {
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockPluginManager.getExtensionRegistry).toHaveBeenCalled();
			expect(mockWebhookHandler).toHaveBeenCalledWith(mockRequest, mockReply);
			expect(mockRequest.pluginContext).toBe(mockFastify.pluginContext);
		});

		it("should return 500 when plugin manager is not available", async () => {
			mockFastify.pluginManager = undefined;
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(500);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Plugin manager not available",
			});
		});

		it("should return 404 when webhook handler is not found", async () => {
			mockRequest.params = { pluginId: "non-existent-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Webhook not found",
				message: "No webhook handler found for plugin 'non-existent-plugin'",
			});
		});

		it("should inject plugin context into request", async () => {
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockRequest.pluginContext).toBe(mockFastify.pluginContext);
		});

		it("should handle webhook handler execution errors", async () => {
			const webhookError = new Error("Webhook execution failed");
			mockWebhookHandler.mockRejectedValue(webhookError);
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockFastify.log.error).toHaveBeenCalledWith(
				webhookError,
				"Plugin webhook error",
			);
			expect(mockReply.status).toHaveBeenCalledWith(500);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Internal server error",
				message: "Webhook execution failed",
			});
		});

		it("should handle non-Error exceptions", async () => {
			const nonErrorException = "String error";
			mockWebhookHandler.mockRejectedValue(nonErrorException);
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockFastify.log.error).toHaveBeenCalledWith(
				nonErrorException,
				"Plugin webhook error",
			);
			expect(mockReply.status).toHaveBeenCalledWith(500);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Internal server error",
				message: "Unknown error",
			});
		});

		it("should use correct webhook key format", async () => {
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			// Verify the webhook key is constructed as "pluginId:/"
			expect(mockWebhookHandler).toHaveBeenCalled();
		});
	});

	describe("Wildcard Webhook Endpoint (/api/plugins/:pluginId/webhook/*)", () => {
		let wildcardWebhookHandler: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;

		beforeEach(async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);
			// Get the second registered route handler
			const mockCalls = (mockFastify.all as ReturnType<typeof vi.fn>).mock
				?.calls;
			wildcardWebhookHandler = mockCalls?.[1]?.[1] as (
				request: FastifyRequest,
				reply: FastifyReply,
			) => Promise<void>;
		});

		it("should successfully handle webhook request with custom path", async () => {
			// Create a separate webhook handler for the custom path
			const customWebhookHandler = vi.fn().mockResolvedValue(undefined) as (
				request: unknown,
				reply: unknown,
			) => Promise<unknown>;
			const registryWithCustomHandler = {
				...mockExtensionRegistry,
				webhooks: {
					handlers: {
						"test-plugin:/": mockWebhookHandler,
						"test-plugin:custom/path": customWebhookHandler,
					},
				},
			};
			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithCustomHandler);

			mockRequest.params = {
				pluginId: "test-plugin",
				"*": "custom/path",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockPluginManager.getExtensionRegistry).toHaveBeenCalled();
			expect(customWebhookHandler).toHaveBeenCalledWith(mockRequest, mockReply);
			expect(mockRequest.pluginContext).toBe(mockFastify.pluginContext);
		});

		it("should handle empty wildcard path by defaulting to '/'", async () => {
			mockRequest.params = {
				pluginId: "test-plugin",
				"*": "",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			// Should use the default "/" path handler
			expect(mockWebhookHandler).toHaveBeenCalled();
		});

		it("should handle undefined wildcard path by defaulting to '/'", async () => {
			mockRequest.params = {
				pluginId: "test-plugin",
				"*": undefined,
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			// Should use the default "/" path handler
			expect(mockWebhookHandler).toHaveBeenCalled();
		});

		it("should return 500 when plugin manager is not available", async () => {
			mockFastify.pluginManager = undefined;
			mockRequest.params = {
				pluginId: "test-plugin",
				"*": "custom/path",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(500);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Plugin manager not available",
			});
		});

		it("should return 404 when webhook handler is not found for custom path", async () => {
			mockRequest.params = {
				pluginId: "test-plugin",
				"*": "non/existent/path",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Webhook not found",
				message:
					"No webhook handler found for plugin 'test-plugin' at path 'non/existent/path'",
			});
		});

		it("should return 404 when plugin does not exist", async () => {
			mockRequest.params = {
				pluginId: "non-existent-plugin",
				"*": "some/path",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Webhook not found",
				message:
					"No webhook handler found for plugin 'non-existent-plugin' at path 'some/path'",
			});
		});

		it("should inject plugin context into request", async () => {
			// Create a separate webhook handler for the custom path
			const customWebhookHandler = vi.fn().mockResolvedValue(undefined) as (
				request: unknown,
				reply: unknown,
			) => Promise<unknown>;
			const registryWithCustomHandler = {
				...mockExtensionRegistry,
				webhooks: {
					handlers: {
						"test-plugin:/": mockWebhookHandler,
						"test-plugin:custom/path": customWebhookHandler,
					},
				},
			};
			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithCustomHandler);

			mockRequest.params = {
				pluginId: "test-plugin",
				"*": "custom/path",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockRequest.pluginContext).toBe(mockFastify.pluginContext);
		});

		it("should handle webhook handler execution errors", async () => {
			const webhookError = new Error("Webhook execution failed");
			const customWebhookHandler = vi.fn().mockRejectedValue(webhookError) as (
				request: unknown,
				reply: unknown,
			) => Promise<unknown>;
			const registryWithCustomHandler = {
				...mockExtensionRegistry,
				webhooks: {
					handlers: {
						"test-plugin:/": mockWebhookHandler,
						"test-plugin:custom/path": customWebhookHandler,
					},
				},
			};
			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithCustomHandler);

			mockRequest.params = {
				pluginId: "test-plugin",
				"*": "custom/path",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockFastify.log.error).toHaveBeenCalledWith(
				webhookError,
				"Plugin webhook error",
			);
			expect(mockReply.status).toHaveBeenCalledWith(500);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Internal server error",
				message: "Webhook execution failed",
			});
		});

		it("should use correct webhook key format with custom path", async () => {
			// Create a separate webhook handler for the custom path
			const customWebhookHandler = vi.fn().mockResolvedValue(undefined) as (
				request: unknown,
				reply: unknown,
			) => Promise<unknown>;
			const registryWithCustomHandler = {
				...mockExtensionRegistry,
				webhooks: {
					handlers: {
						"test-plugin:/": mockWebhookHandler,
						"test-plugin:custom/path": customWebhookHandler,
					},
				},
			};
			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithCustomHandler);

			mockRequest.params = {
				pluginId: "test-plugin",
				"*": "custom/path",
			};

			await wildcardWebhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			// Verify the webhook key is constructed as "pluginId:customPath"
			expect(customWebhookHandler).toHaveBeenCalled();
		});
	});

	describe("Plugin Context Injection", () => {
		let webhookHandler: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;

		beforeEach(async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);
			const mockCalls = (mockFastify.all as ReturnType<typeof vi.fn>).mock
				?.calls;
			webhookHandler = mockCalls?.[0]?.[1] as (
				request: FastifyRequest,
				reply: FastifyReply,
			) => Promise<void>;
		});

		it("should inject plugin context from fastify instance", async () => {
			const customContext = {
				custom: "data",
				userId: 123,
			} as unknown as IPluginContext;
			mockFastify.pluginContext = customContext;
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockRequest.pluginContext).toBe(customContext);
			expect(mockWebhookHandler).toHaveBeenCalledWith(mockRequest, mockReply);
		});

		it("should handle undefined plugin context", async () => {
			mockFastify.pluginContext = undefined;
			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockRequest.pluginContext).toBeUndefined();
			expect(mockWebhookHandler).toHaveBeenCalledWith(mockRequest, mockReply);
		});
	});

	describe("Extension Registry Integration", () => {
		let webhookHandler: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;

		beforeEach(async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);
			const mockCalls = (mockFastify.all as ReturnType<typeof vi.fn>).mock
				?.calls;
			webhookHandler = mockCalls?.[0]?.[1] as (
				request: FastifyRequest,
				reply: FastifyReply,
			) => Promise<void>;
		});

		it("should handle missing webhooks section in extension registry", async () => {
			const registryWithoutWebhooks = {
				...mockExtensionRegistry,
				webhooks: undefined,
			} as unknown as IExtensionRegistry;

			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithoutWebhooks);

			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Webhook not found",
				message: "No webhook handler found for plugin 'test-plugin'",
			});
		});

		it("should handle missing handlers in webhooks section", async () => {
			const registryWithoutHandlers = {
				...mockExtensionRegistry,
				webhooks: {
					handlers: undefined,
				},
			} as unknown as IExtensionRegistry;

			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithoutHandlers);

			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Webhook not found",
				message: "No webhook handler found for plugin 'test-plugin'",
			});
		});

		it("should handle empty handlers object", async () => {
			const registryWithEmptyHandlers = {
				...mockExtensionRegistry,
				webhooks: {
					handlers: {},
				},
			};

			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithEmptyHandlers);

			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Webhook not found",
				message: "No webhook handler found for plugin 'test-plugin'",
			});
		});
	});

	describe("Error Handling Edge Cases", () => {
		let webhookHandler: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;

		beforeEach(async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);
			const mockCalls = (mockFastify.all as ReturnType<typeof vi.fn>).mock
				?.calls;
			webhookHandler = mockCalls?.[0]?.[1] as (
				request: FastifyRequest,
				reply: FastifyReply,
			) => Promise<void>;
		});

		it("should handle getExtensionRegistry throwing an error", async () => {
			const registryError = new Error("Registry access failed");
			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockImplementation(() => {
				throw registryError;
			});

			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockFastify.log.error).toHaveBeenCalledWith(
				registryError,
				"Plugin webhook error",
			);
			expect(mockReply.status).toHaveBeenCalledWith(500);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Internal server error",
				message: "Registry access failed",
			});
		});

		it("should handle null webhook handler", async () => {
			const registryWithNullHandler = {
				...mockExtensionRegistry,
				webhooks: {
					handlers: {
						"test-plugin:/": null,
					},
				},
			} as unknown as IExtensionRegistry;

			(
				mockPluginManager.getExtensionRegistry as ReturnType<typeof vi.fn>
			).mockReturnValue(registryWithNullHandler);

			mockRequest.params = { pluginId: "test-plugin" };

			await webhookHandler(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply,
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Webhook not found",
				message: "No webhook handler found for plugin 'test-plugin'",
			});
		});

		it("should handle missing params object", async () => {
			mockRequest.params = undefined;

			await expect(
				webhookHandler(
					mockRequest as FastifyRequest,
					mockReply as FastifyReply,
				),
			).resolves.not.toThrow();

			// Should handle gracefully and likely result in an error
			expect(mockFastify.log.error).toHaveBeenCalled();
		});
	});

	describe("HTTP Method Support", () => {
		it("should register routes with 'all' method to support all HTTP verbs", async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);

			expect(mockFastify.all).toHaveBeenCalledTimes(2);
			expect(mockFastify.all).toHaveBeenCalledWith(
				"/api/plugins/:pluginId/webhook",
				expect.any(Function),
			);
			expect(mockFastify.all).toHaveBeenCalledWith(
				"/api/plugins/:pluginId/webhook/*",
				expect.any(Function),
			);
		});
	});

	describe("Backward Compatibility", () => {
		it("should support both webhook endpoints for backward compatibility", async () => {
			await pluginWebhooks(mockFastify as FastifyInstance);

			// Both endpoints should be registered
			expect(mockFastify.all).toHaveBeenCalledWith(
				"/api/plugins/:pluginId/webhook",
				expect.any(Function),
			);
			expect(mockFastify.all).toHaveBeenCalledWith(
				"/api/plugins/:pluginId/webhook/*",
				expect.any(Function),
			);
		});
	});
});
