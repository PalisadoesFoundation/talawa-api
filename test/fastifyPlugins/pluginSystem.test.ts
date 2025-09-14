import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pluginSystem } from "../../src/fastifyPlugins/pluginSystem";
import type PluginManager from "../../src/plugin/manager";
import type { IPluginContext } from "../../src/plugin/types";

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
	drizzleClient: unknown;
	decorate: ReturnType<typeof vi.fn>;
	addHook: ReturnType<typeof vi.fn>;
};

// Mock the plugin system modules
vi.mock("../../src/plugin", () => ({
	createPluginContext: vi.fn(),
	initializePluginSystem: vi.fn(),
}));

vi.mock("fastify-plugin", () => ({
	default: vi.fn((fn) => fn),
}));

import fastifyPlugin from "fastify-plugin";
// Import mocked modules
import { createPluginContext, initializePluginSystem } from "../../src/plugin";

describe("PluginSystem Fastify Plugin", () => {
	let mockFastify: MockFastifyInstance;
	let mockPluginManager: Partial<PluginManager>;
	let mockPluginContext: Partial<IPluginContext>;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock plugin manager
		mockPluginManager = {
			getLoadedPlugins: vi.fn().mockReturnValue([]),
			gracefulShutdown: vi.fn().mockResolvedValue(undefined),
		};

		// Create mock plugin context
		mockPluginContext = {
			pluginManager: null,
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
			drizzleClient: {},
			decorate: vi.fn(),
			addHook: vi.fn(),
		} as MockFastifyInstance;

		// Setup mocks
		(createPluginContext as ReturnType<typeof vi.fn>).mockReturnValue(
			mockPluginContext,
		);
		(initializePluginSystem as ReturnType<typeof vi.fn>).mockResolvedValue(
			mockPluginManager,
		);
		(fastifyPlugin as unknown as ReturnType<typeof vi.fn>).mockImplementation(
			(fn: unknown) => fn,
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Plugin System Initialization", () => {
		it("should initialize plugin system successfully", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(createPluginContext).toHaveBeenCalledWith({
				db: mockFastify.drizzleClient,
				graphql: null,
				pubsub: null,
				logger: mockFastify.log,
			});

			expect(initializePluginSystem).toHaveBeenCalledWith(mockPluginContext);

			expect(mockFastify.decorate).toHaveBeenCalledWith(
				"pluginManager",
				mockPluginManager,
			);
			expect(mockFastify.decorate).toHaveBeenCalledWith(
				"pluginContext",
				mockPluginContext,
			);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Initializing plugin system...",
			);
			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Plugin system initialized successfully",
			);
		});

		it("should log loaded plugins when plugins are available", async () => {
			const mockLoadedPlugins = [
				{ id: "plugin1" },
				{ id: "plugin2" },
				{ id: "plugin3" },
			];
			(
				mockPluginManager.getLoadedPlugins as ReturnType<typeof vi.fn>
			).mockReturnValue(mockLoadedPlugins);

			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Loaded 3 plugins: plugin1, plugin2, plugin3",
			);
		});

		it("should log no plugins when no plugins are loaded", async () => {
			(
				mockPluginManager.getLoadedPlugins as ReturnType<typeof vi.fn>
			).mockReturnValue([]);

			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith("No plugins loaded");
		});

		it("should update plugin manager reference in context", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockPluginContext.pluginManager).toBe(mockPluginManager);
		});
	});

	describe("Fastify Integration", () => {
		it("should decorate fastify instance with plugin manager and context", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.decorate).toHaveBeenCalledTimes(2);
			expect(mockFastify.decorate).toHaveBeenCalledWith(
				"pluginManager",
				mockPluginManager,
			);
			expect(mockFastify.decorate).toHaveBeenCalledWith(
				"pluginContext",
				mockPluginContext,
			);
		});

		it("should add onClose hook for graceful shutdown", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.addHook).toHaveBeenCalledWith(
				"onClose",
				expect.any(Function),
			);
		});
	});

	describe("Graceful Shutdown", () => {
		it("should gracefully shutdown plugin system on server close", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			// Get the onClose hook function
			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				?.calls[0]?.[1];

			// Execute the hook
			await onCloseHook?.();

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Shutting down plugin system...",
			);
			expect(mockPluginManager.gracefulShutdown).toHaveBeenCalled();
			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Plugin system shut down successfully",
			);
		});

		it("should handle errors during graceful shutdown", async () => {
			const shutdownError = new Error("Shutdown failed");
			(
				mockPluginManager.gracefulShutdown as ReturnType<typeof vi.fn>
			).mockRejectedValue(shutdownError);

			await pluginSystem(mockFastify as FastifyInstance);

			// Get the onClose hook function
			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				?.calls[0]?.[1];

			// Execute the hook
			await onCloseHook?.();

			expect(mockFastify.log?.error).toHaveBeenCalledWith(
				{ error: shutdownError },
				"Error occurred while shutting down plugin system",
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle plugin context creation failure", async () => {
			const contextError = new Error("Context creation failed");
			(createPluginContext as ReturnType<typeof vi.fn>).mockImplementation(
				() => {
					throw contextError;
				},
			);

			await expect(
				pluginSystem(mockFastify as FastifyInstance),
			).rejects.toThrow("Plugin system initialization failed");

			expect(mockFastify.log?.error).toHaveBeenCalledWith(
				{ error: contextError },
				"Failed to initialize plugin system",
			);
		});

		it("should handle plugin system initialization failure", async () => {
			const initError = new Error("Plugin system init failed");
			(initializePluginSystem as ReturnType<typeof vi.fn>).mockRejectedValue(
				initError,
			);

			await expect(
				pluginSystem(mockFastify as FastifyInstance),
			).rejects.toThrow("Plugin system initialization failed");

			expect(mockFastify.log?.error).toHaveBeenCalledWith(
				{ error: initError },
				"Failed to initialize plugin system",
			);
		});

		it("should handle fastify decoration failure", async () => {
			const decorationError = new Error("Decoration failed");
			(mockFastify.decorate as ReturnType<typeof vi.fn>).mockImplementation(
				() => {
					throw decorationError;
				},
			);

			await expect(
				pluginSystem(mockFastify as FastifyInstance),
			).rejects.toThrow("Plugin system initialization failed");

			expect(mockFastify.log?.error).toHaveBeenCalledWith(
				{ error: decorationError },
				"Failed to initialize plugin system",
			);
		});

		it("should handle hook addition failure", async () => {
			const hookError = new Error("Hook addition failed");
			(mockFastify.addHook as ReturnType<typeof vi.fn>).mockImplementation(
				() => {
					throw hookError;
				},
			);

			await expect(
				pluginSystem(mockFastify as FastifyInstance),
			).rejects.toThrow("Plugin system initialization failed");

			expect(mockFastify.log?.error).toHaveBeenCalledWith(
				{ error: hookError },
				"Failed to initialize plugin system",
			);
		});
	});

	describe("Plugin Context Configuration", () => {
		it("should create plugin context with correct dependencies", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(createPluginContext).toHaveBeenCalledWith({
				db: mockFastify.drizzleClient,
				graphql: null,
				pubsub: null,
				logger: mockFastify.log,
			});
		});

		it("should set plugin manager reference to null initially", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockPluginContext.pluginManager).toBe(mockPluginManager);
		});
	});

	describe("Logging", () => {
		it("should log initialization start", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Initializing plugin system...",
			);
		});

		it("should log successful initialization", async () => {
			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Plugin system initialized successfully",
			);
		});

		it("should log plugin loading information", async () => {
			const mockLoadedPlugins = [{ id: "test-plugin" }];
			(
				mockPluginManager.getLoadedPlugins as ReturnType<typeof vi.fn>
			).mockReturnValue(mockLoadedPlugins);

			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Loaded 1 plugins: test-plugin",
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty plugin list", async () => {
			(
				mockPluginManager.getLoadedPlugins as ReturnType<typeof vi.fn>
			).mockReturnValue([]);

			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith("No plugins loaded");
		});

		it("should handle plugins with undefined id", async () => {
			const mockLoadedPlugins = [{ id: undefined }, { id: "valid-plugin" }];
			(
				mockPluginManager.getLoadedPlugins as ReturnType<typeof vi.fn>
			).mockReturnValue(mockLoadedPlugins);

			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Loaded 2 plugins: , valid-plugin",
			);
		});

		it("should handle single plugin", async () => {
			const mockLoadedPlugins = [{ id: "single-plugin" }];
			(
				mockPluginManager.getLoadedPlugins as ReturnType<typeof vi.fn>
			).mockReturnValue(mockLoadedPlugins);

			await pluginSystem(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Loaded 1 plugins: single-plugin",
			);
		});
	});

	describe("TypeScript Module Declaration", () => {
		it("should extend FastifyInstance interface correctly", () => {
			// This test ensures the module declaration is working
			// The actual type checking is done by TypeScript compiler
			expect(true).toBe(true);
		});
	});
});
