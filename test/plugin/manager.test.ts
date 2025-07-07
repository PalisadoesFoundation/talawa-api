import { EventEmitter } from "node:events";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PluginManager from "~/src/plugin/manager";
import type { IPluginContext } from "~/src/plugin/types";

// Mock dependencies
const mockDb = {
	select: vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn(() => Promise.resolve([])),
		})),
	})),
	update: vi.fn(() => ({
		set: vi.fn(() => ({
			where: vi.fn(() => Promise.resolve()),
		})),
	})),
	execute: vi.fn(() => Promise.resolve()),
};

const mockGraphQL = {
	schema: {},
	resolvers: {},
};

const mockPubSub = {
	publish: vi.fn(),
	subscribe: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
	lifecycle: vi.fn(() => Promise.resolve()),
};

const mockPluginContext: IPluginContext = {
	db: mockDb,
	graphql: mockGraphQL,
	pubsub: mockPubSub,
	logger: mockLogger,
};

describe("PluginManager", () => {
	let pluginManager: PluginManager;
	let testPluginsDirectory: string;

	beforeEach(() => {
		// Create a temporary test plugins directory
		testPluginsDirectory = path.join(process.cwd(), "test", "temp", "plugins");

		// Reset all mocks
		vi.clearAllMocks();

		// Create plugin manager instance
		pluginManager = new PluginManager(mockPluginContext, testPluginsDirectory);
	});

	afterEach(() => {
		// Clean up
		if (pluginManager) {
			pluginManager.removeAllListeners();
		}
	});

	describe("Initialization", () => {
		it("should initialize with correct properties", () => {
			expect(pluginManager).toBeInstanceOf(EventEmitter);
			expect(pluginManager).toBeInstanceOf(PluginManager);
			expect(typeof pluginManager.loadPlugin).toBe("function");
			expect(typeof pluginManager.activatePlugin).toBe("function");
			expect(typeof pluginManager.deactivatePlugin).toBe("function");
			expect(typeof pluginManager.unloadPlugin).toBe("function");
		});

		it("should handle missing plugins directory gracefully", async () => {
			const manager = new PluginManager(
				mockPluginContext,
				"/non/existent/directory",
			);

			await new Promise<void>((resolve) => {
				manager.on("plugins:ready", () => {
					expect(manager.isSystemInitialized()).toBe(true);
					expect(manager.getLoadedPlugins()).toEqual([]);
					resolve();
				});
			});
		});
	});

	describe("Plugin Loading", () => {
		it("should handle plugin loading errors gracefully", async () => {
			const result = await pluginManager.loadPlugin("error_plugin");
			expect(result).toBe(false);
		});

		it("should throw error for invalid plugin IDs", async () => {
			await expect(
				pluginManager.loadPlugin("invalid-plugin-id"),
			).rejects.toThrow("Invalid plugin ID");
		});

		it("should return false for non-existent plugin", async () => {
			const result = await pluginManager.loadPlugin("non_existent_plugin");
			expect(result).toBe(false);
		});
	});

	describe("Plugin Activation", () => {
		it("should throw error for non-existent plugin", async () => {
			await expect(
				pluginManager.activatePlugin("non_existent_plugin"),
			).rejects.toThrow("Plugin non_existent_plugin is not loaded");
		});
	});

	describe("Plugin Deactivation", () => {
		it("should throw error for non-existent plugin", async () => {
			await expect(
				pluginManager.deactivatePlugin("non_existent_plugin"),
			).rejects.toThrow("Plugin non_existent_plugin is not loaded");
		});
	});

	describe("Plugin Unloading", () => {
		it("should return true for non-existent plugin (already unloaded)", async () => {
			const result = await pluginManager.unloadPlugin("non_existent_plugin");
			expect(result).toBe(true);
		});
	});

	describe("Plugin Information", () => {
		it("should return loaded plugins", () => {
			const plugins = pluginManager.getLoadedPlugins();
			expect(Array.isArray(plugins)).toBe(true);
		});

		it("should return loaded plugin IDs", () => {
			const pluginIds = pluginManager.getLoadedPluginIds();
			expect(Array.isArray(pluginIds)).toBe(true);
		});

		it("should return active plugins", () => {
			const activePlugins = pluginManager.getActivePlugins();
			expect(Array.isArray(activePlugins)).toBe(true);
		});

		it("should get specific plugin", () => {
			const plugin = pluginManager.getPlugin("non_existent");
			expect(plugin).toBeUndefined();
		});

		it("should check plugin loaded status", () => {
			const isLoaded = pluginManager.isPluginLoaded("non_existent");
			expect(isLoaded).toBe(false);
		});

		it("should check plugin active status", () => {
			const isActive = pluginManager.isPluginActive("non_existent");
			expect(isActive).toBe(false);
		});
	});

	describe("Extension Registry", () => {
		it("should return extension registry", () => {
			const registry = pluginManager.getExtensionRegistry();
			expect(registry).toHaveProperty("graphql");
			expect(registry).toHaveProperty("database");
			expect(registry).toHaveProperty("hooks");
			expect(registry.graphql).toHaveProperty("queries");
			expect(registry.graphql).toHaveProperty("mutations");
			expect(registry.graphql).toHaveProperty("subscriptions");
			expect(registry.graphql).toHaveProperty("types");
		});
	});

	describe("Hook Execution", () => {
		it("should execute pre hooks", async () => {
			const result = await pluginManager.executePreHooks("test_event", {
				data: "test",
			});
			expect(result).toBeDefined();
		});

		it("should execute post hooks", async () => {
			await expect(
				pluginManager.executePostHooks("test_event", { data: "test" }),
			).resolves.not.toThrow();
		});
	});

	describe("Error Handling", () => {
		it("should track errors", () => {
			const errors = pluginManager.getErrors();
			expect(Array.isArray(errors)).toBe(true);
		});

		it("should clear errors", () => {
			pluginManager.clearErrors();
			const errors = pluginManager.getErrors();
			expect(errors).toHaveLength(0);
		});
	});

	describe("System Status", () => {
		it("should check if system is initialized", () => {
			const isInitialized = pluginManager.isSystemInitialized();
			expect(typeof isInitialized).toBe("boolean");
		});
	});
});
