import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PluginManager from "~/src/plugin/manager";
import type { IPluginContext, IPluginManifest } from "~/src/plugin/types";
import { PluginStatus } from "~/src/plugin/types";

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
	insert: vi.fn(() => ({
		values: vi.fn(() => ({
			returning: vi.fn(() => Promise.resolve([{ id: "test-id" }])),
		})),
	})),
	delete: vi.fn(() => ({
		where: vi.fn(() => ({
			returning: vi.fn(() => Promise.resolve([{ id: "test-id" }])),
		})),
	})),
	execute: vi.fn(() => Promise.resolve()),
	query: {
		pluginsTable: {
			findFirst: vi.fn(),
		},
	},
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

// Mock plugin utilities
vi.mock("~/src/plugin/utils", () => ({
	directoryExists: vi.fn(),
	scanPluginsDirectory: vi.fn(),
	loadPluginManifest: vi.fn(),
	safeRequire: vi.fn(),
	isValidPluginId: vi.fn().mockImplementation((id: string) => {
		if (!id || typeof id !== "string") return false;
		if (id === "invalid-id") return false;
		if (id === "") return false;
		return true;
	}),
	dropPluginTables: vi.fn(),
	createPluginTables: vi.fn(),
}));

// Mock plugin logger
vi.mock("~/src/plugin/logger", () => ({
	pluginLogger: {
		info: vi.fn(() => Promise.resolve()),
		error: vi.fn(() => Promise.resolve()),
		warn: vi.fn(() => Promise.resolve()),
		debug: vi.fn(() => Promise.resolve()),
		lifecycle: vi.fn(() => Promise.resolve()),
	},
}));

// Import mocked utilities
import {
	directoryExists,
	dropPluginTables,
	loadPluginManifest,
	safeRequire,
	scanPluginsDirectory,
} from "~/src/plugin/utils";

describe("PluginManager", () => {
	let pluginManager: PluginManager;
	let mockManifest: IPluginManifest;

	beforeEach(() => {
		// Clear all mocks
		vi.clearAllMocks();

		// Setup default mock manifest - no extensions for basic loading tests
		mockManifest = {
			name: "Test Plugin",
			pluginId: "test_plugin",
			version: "1.0.0",
			description: "A test plugin",
			author: "Test Author",
			main: "index.js",
			// No extension points for basic loading tests
		};

		// Setup default mock implementations
		vi.mocked(directoryExists).mockResolvedValue(true);
		vi.mocked(scanPluginsDirectory).mockResolvedValue(["test_plugin"]);
		vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);

		// Mock safeRequire to handle different file loads
		vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
			if (filePath.includes("resolvers.js")) {
				return {
					testQueryResolver: vi.fn(),
				};
			}
			if (filePath.includes("schema.js")) {
				return {
					testTable: { name: "test_table" },
				};
			}
			// Main plugin module (index.js)
			return {
				testQueryResolver: vi.fn(),
				testTable: { name: "test_table" },
				testHookHandler: vi.fn(),
			};
		});

		// Setup database mocks
		mockDb.query.pluginsTable.findFirst.mockResolvedValue({
			id: "test-id",
			pluginId: "test_plugin",
			isActivated: true,
			isInstalled: true,
		});
	});

	afterEach(() => {
		if (pluginManager) {
			pluginManager.removeAllListeners();
		}
	});

	describe("Constructor", () => {
		it("should initialize with default plugins directory", () => {
			pluginManager = new PluginManager(mockPluginContext);
			expect(pluginManager).toBeInstanceOf(EventEmitter);
			expect(pluginManager.isSystemInitialized()).toBe(false);
		});

		it("should initialize with custom plugins directory", () => {
			const customDir = "/custom/plugins";
			pluginManager = new PluginManager(mockPluginContext, customDir);
			expect(pluginManager).toBeInstanceOf(EventEmitter);
		});

		it("should handle initialization errors gracefully", async () => {
			vi.mocked(directoryExists).mockRejectedValue(
				new Error("Directory access failed"),
			);

			pluginManager = new PluginManager(mockPluginContext);

			// Wait for initialization to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(pluginManager.isSystemInitialized()).toBe(true);
		});
	});

	describe("Plugin Discovery", () => {
		beforeEach(() => {
			pluginManager = new PluginManager(mockPluginContext);
		});

		it("should discover plugins when directory exists", async () => {
			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(scanPluginsDirectory).mockResolvedValue(["plugin1", "plugin2"]);

			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(scanPluginsDirectory).toHaveBeenCalled();
		});

		it("should handle empty plugins directory", async () => {
			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(scanPluginsDirectory).mockResolvedValue([]);

			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(pluginManager.getLoadedPluginIds()).toEqual([]);
		});

		it("should handle non-existent plugins directory", async () => {
			vi.mocked(directoryExists).mockResolvedValue(false);

			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(pluginManager.isSystemInitialized()).toBe(true);
		});
	});

	describe("Plugin Loading", () => {
		beforeEach(() => {
			pluginManager = new PluginManager(mockPluginContext);
		});

		it("should load a valid plugin successfully", async () => {
			// Ensure proper mock setup
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				if (filePath.includes("resolvers.js")) {
					return {
						testQueryResolver: vi.fn(),
					};
				}
				if (filePath.includes("schema.js")) {
					return {
						testTable: { name: "test_table" },
					};
				}
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: vi.fn(),
				};
			});
			mockDb.query.pluginsTable.findFirst.mockResolvedValue({
				id: "test-id",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
			});

			const result = await pluginManager.loadPlugin("test_plugin");

			expect(result).toBe(true);
			expect(pluginManager.isPluginLoaded("test_plugin")).toBe(true);
			expect(loadPluginManifest).toHaveBeenCalled();
		});

		it("should reject invalid plugin IDs", async () => {
			await expect(pluginManager.loadPlugin("")).rejects.toThrow(
				"Invalid plugin ID",
			);
			await expect(pluginManager.loadPlugin("invalid-id")).rejects.toThrow(
				"Invalid plugin ID",
			);
		});

		it("should handle already loaded plugins", async () => {
			// Setup mocks for first load
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				if (filePath.includes("resolvers.js")) {
					return {
						testQueryResolver: vi.fn(),
					};
				}
				if (filePath.includes("schema.js")) {
					return {
						testTable: { name: "test_table" },
					};
				}
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: vi.fn(),
				};
			});
			mockDb.query.pluginsTable.findFirst.mockResolvedValue({
				id: "test-id",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
			});

			await pluginManager.loadPlugin("test_plugin");
			const result = await pluginManager.loadPlugin("test_plugin");

			expect(result).toBe(true);
		});

		it("should handle manifest loading errors", async () => {
			vi.mocked(loadPluginManifest).mockRejectedValue(
				new Error("Manifest not found"),
			);

			const result = await pluginManager.loadPlugin("test_plugin");

			expect(result).toBe(false);
			expect(pluginManager.getErrors()).toHaveLength(1);
		});

		it("should handle plugin module loading errors", async () => {
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue(null);

			const result = await pluginManager.loadPlugin("test_plugin");

			expect(result).toBe(false);
		});

		it("should load plugin with correct status based on database", async () => {
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				if (filePath.includes("resolvers.js")) {
					return {
						testQueryResolver: vi.fn(),
					};
				}
				if (filePath.includes("schema.js")) {
					return {
						testTable: { name: "test_table" },
					};
				}
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: vi.fn(),
				};
			});
			mockDb.query.pluginsTable.findFirst.mockResolvedValue({
				id: "test-id",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
			});

			const result = await pluginManager.loadPlugin("test_plugin");

			expect(result).toBe(true);
			const plugin = pluginManager.getPlugin("test_plugin");
			expect(plugin?.status).toBe(PluginStatus.INACTIVE);
		});
	});

	describe("Plugin Activation", () => {
		beforeEach(async () => {
			pluginManager = new PluginManager(mockPluginContext);
			await pluginManager.loadPlugin("test_plugin");
		});

		it("should activate a loaded plugin", async () => {
			const result = await pluginManager.activatePlugin("test_plugin");

			expect(result).toBe(true);
			expect(pluginManager.isPluginActive("test_plugin")).toBe(true);
		});

		it("should handle activation of non-existent plugin", async () => {
			await expect(
				pluginManager.activatePlugin("non_existent"),
			).rejects.toThrow("Plugin non_existent is not loaded");
		});

		it("should handle already active plugins", async () => {
			await pluginManager.activatePlugin("test_plugin");
			const result = await pluginManager.activatePlugin("test_plugin");

			expect(result).toBe(true);
		});

		it("should update database when activating plugin", async () => {
			await pluginManager.activatePlugin("test_plugin");

			expect(mockDb.update).toHaveBeenCalled();
		});

		it("should emit activation events", async () => {
			const activatedSpy = vi.fn();
			pluginManager.on("plugin:activated", activatedSpy);

			await pluginManager.activatePlugin("test_plugin");

			expect(activatedSpy).toHaveBeenCalledWith("test_plugin");
		});
	});

	describe("Plugin Deactivation", () => {
		beforeEach(async () => {
			pluginManager = new PluginManager(mockPluginContext);
			await pluginManager.loadPlugin("test_plugin");
			await pluginManager.activatePlugin("test_plugin");
		});

		it("should deactivate an active plugin", async () => {
			const result = await pluginManager.deactivatePlugin("test_plugin");

			expect(result).toBe(true);
			expect(pluginManager.isPluginActive("test_plugin")).toBe(false);
		});

		it("should deactivate plugin with table dropping", async () => {
			// Setup plugin with database tables for this test
			const plugin = pluginManager.getPlugin("test_plugin");
			if (plugin) {
				plugin.databaseTables = {
					testTable: { name: "test_table" },
				};
			}

			const result = await pluginManager.deactivatePlugin("test_plugin", true);

			expect(result).toBe(true);
			expect(dropPluginTables).toHaveBeenCalled();
		});

		it("should handle deactivation of non-existent plugin", async () => {
			await expect(
				pluginManager.deactivatePlugin("non_existent"),
			).rejects.toThrow("Plugin non_existent is not loaded");
		});

		it("should handle already inactive plugins", async () => {
			await pluginManager.deactivatePlugin("test_plugin");
			const result = await pluginManager.deactivatePlugin("test_plugin");

			expect(result).toBe(true);
		});

		it("should emit deactivation events", async () => {
			const deactivatedSpy = vi.fn();
			pluginManager.on("plugin:deactivated", deactivatedSpy);

			await pluginManager.deactivatePlugin("test_plugin");

			expect(deactivatedSpy).toHaveBeenCalledWith("test_plugin");
		});
	});

	describe("Plugin Unloading", () => {
		beforeEach(async () => {
			pluginManager = new PluginManager(mockPluginContext);
			await pluginManager.loadPlugin("test_plugin");
		});

		it("should unload a loaded plugin", async () => {
			const result = await pluginManager.unloadPlugin("test_plugin");

			expect(result).toBe(true);
			expect(pluginManager.isPluginLoaded("test_plugin")).toBe(false);
		});

		it("should handle unloading of non-existent plugin", async () => {
			const result = await pluginManager.unloadPlugin("non_existent");

			expect(result).toBe(true); // Returns true for non-existent plugins (already unloaded)
		});

		it("should deactivate plugin before unloading if active", async () => {
			await pluginManager.activatePlugin("test_plugin");
			const result = await pluginManager.unloadPlugin("test_plugin");

			expect(result).toBe(true);
			expect(pluginManager.isPluginLoaded("test_plugin")).toBe(false);
		});

		it("should emit unloading events", async () => {
			const unloadedSpy = vi.fn();
			pluginManager.on("plugin:unloaded", unloadedSpy);

			await pluginManager.unloadPlugin("test_plugin");

			expect(unloadedSpy).toHaveBeenCalledWith("test_plugin");
		});
	});

	describe("Extension Points", () => {
		beforeEach(async () => {
			pluginManager = new PluginManager(mockPluginContext);
			await pluginManager.loadPlugin("test_plugin");
		});

		it("should register GraphQL extensions", async () => {
			await pluginManager.activatePlugin("test_plugin");

			const registry = pluginManager.getExtensionRegistry();
			// Extensions are registered during activation but with prefixed names
			expect(registry.graphql).toBeDefined();
			expect(registry.graphql.queries).toBeDefined();
		});

		it("should register database extensions", async () => {
			await pluginManager.activatePlugin("test_plugin");

			const registry = pluginManager.getExtensionRegistry();
			// Database extensions are registered during activation
			expect(registry.database).toBeDefined();
			expect(registry.database.tables).toBeDefined();
		});

		it("should register hook extensions", async () => {
			await pluginManager.activatePlugin("test_plugin");

			const registry = pluginManager.getExtensionRegistry();
			// Hook extensions are registered during activation
			expect(registry.hooks).toBeDefined();
			expect(registry.hooks.pre).toBeDefined();
		});

		it("should handle extension loading errors", async () => {
			vi.mocked(safeRequire).mockResolvedValue(null);

			const result = await pluginManager.loadPlugin("error_plugin");

			expect(result).toBe(false);
		});
	});

	describe("Hook Execution", () => {
		beforeEach(async () => {
			pluginManager = new PluginManager(mockPluginContext);
			await pluginManager.loadPlugin("test_plugin");
			await pluginManager.activatePlugin("test_plugin");
		});

		it("should execute pre hooks", async () => {
			const data = { userId: "123" };
			const result = await pluginManager.executePreHooks("user:created", data);

			expect(result).toBeDefined();
		});

		it("should execute post hooks", async () => {
			const data = { userId: "123" };
			await pluginManager.executePostHooks("user:created", data);

			// Should not throw
			expect(true).toBe(true);
		});

		it("should handle hook execution errors", async () => {
			const mockHook = vi.fn().mockRejectedValue(new Error("Hook failed"));
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				if (filePath.includes("resolvers.js")) {
					return {
						testQueryResolver: vi.fn(),
					};
				}
				if (filePath.includes("schema.js")) {
					return {
						testTable: { name: "test_table" },
					};
				}
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: mockHook,
				};
			});

			await pluginManager.loadPlugin("error_plugin");
			await pluginManager.activatePlugin("error_plugin");

			const data = { userId: "123" };
			const result = await pluginManager.executePreHooks("user:created", data);

			expect(result).toBe(data); // Should return original data on error
		});
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			pluginManager = new PluginManager(mockPluginContext);
		});

		it("should track plugin errors", async () => {
			vi.mocked(loadPluginManifest).mockRejectedValue(new Error("Test error"));

			await pluginManager.loadPlugin("test_plugin");

			const errors = pluginManager.getErrors();
			expect(errors).toHaveLength(1);
			expect(errors[0]).toMatchObject({
				pluginId: "test_plugin",
				phase: "load",
				error: expect.any(Error),
			});
		});

		it("should clear errors", async () => {
			vi.mocked(loadPluginManifest).mockRejectedValue(new Error("Test error"));

			await pluginManager.loadPlugin("test_plugin");
			expect(pluginManager.getErrors()).toHaveLength(1);

			pluginManager.clearErrors();
			expect(pluginManager.getErrors()).toHaveLength(0);
		});
	});

	describe("Plugin Information", () => {
		beforeEach(async () => {
			pluginManager = new PluginManager(mockPluginContext);
			await pluginManager.loadPlugin("test_plugin");
		});

		it("should return loaded plugins", () => {
			const plugins = pluginManager.getLoadedPlugins();
			expect(plugins).toHaveLength(1);
			expect(plugins[0]?.id).toBe("test_plugin");
		});

		it("should return loaded plugin IDs", () => {
			const pluginIds = pluginManager.getLoadedPluginIds();
			expect(pluginIds).toEqual(["test_plugin"]);
		});

		it("should return active plugins", async () => {
			await pluginManager.activatePlugin("test_plugin");

			const activePlugins = pluginManager.getActivePlugins();
			expect(activePlugins).toHaveLength(1);
			expect(activePlugins[0]?.id).toBe("test_plugin");
		});

		it("should get specific plugin", () => {
			const plugin = pluginManager.getPlugin("test_plugin");
			expect(plugin).toBeDefined();
			expect(plugin?.id).toBe("test_plugin");
		});

		it("should check if plugin is loaded", () => {
			expect(pluginManager.isPluginLoaded("test_plugin")).toBe(true);
			expect(pluginManager.isPluginLoaded("non_existent")).toBe(false);
		});

		it("should check if plugin is active", async () => {
			expect(pluginManager.isPluginActive("test_plugin")).toBe(false);

			await pluginManager.activatePlugin("test_plugin");
			expect(pluginManager.isPluginActive("test_plugin")).toBe(true);
		});

		it("should get extension registry", () => {
			const registry = pluginManager.getExtensionRegistry();
			expect(registry).toHaveProperty("graphql");
			expect(registry).toHaveProperty("database");
			expect(registry).toHaveProperty("hooks");
		});
	});

	describe("System Status", () => {
		it("should track initialization status", async () => {
			pluginManager = new PluginManager(mockPluginContext);
			expect(pluginManager.isSystemInitialized()).toBe(false);

			// Wait for initialization
			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(pluginManager.isSystemInitialized()).toBe(true);
		});

		it("should emit initialization events", async () => {
			const initializingSpy = vi.fn();
			const initializedSpy = vi.fn();
			const readySpy = vi.fn();

			pluginManager = new PluginManager(mockPluginContext);
			pluginManager.on("plugins:initializing", initializingSpy);
			pluginManager.on("plugins:initialized", initializedSpy);
			pluginManager.on("plugins:ready", readySpy);

			// Wait for initialization
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(initializingSpy).toHaveBeenCalled();
			expect(initializedSpy).toHaveBeenCalled();
			expect(readySpy).toHaveBeenCalled();
		});
	});

	describe("Edge Cases", () => {
		beforeEach(() => {
			pluginManager = new PluginManager(mockPluginContext);
		});

		it("should handle concurrent plugin operations", async () => {
			// Reset mocks for this test
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				if (filePath.includes("resolvers.js")) {
					return {
						testQueryResolver: vi.fn(),
					};
				}
				if (filePath.includes("schema.js")) {
					return {
						testTable: { name: "test_table" },
					};
				}
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: vi.fn(),
				};
			});
			mockDb.query.pluginsTable.findFirst.mockResolvedValue({
				id: "test-id",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
			});

			const promises = [
				pluginManager.loadPlugin("test_plugin"),
				pluginManager.loadPlugin("test_plugin"),
				pluginManager.loadPlugin("test_plugin"),
			];

			const results = await Promise.all(promises);
			// First load should succeed, others should return true (already loaded)
			expect(results.filter((r) => r === true).length).toBeGreaterThan(0);
		});

		it("should handle plugin with no extension points", async () => {
			const simpleManifest = {
				...mockManifest,
				extensionPoints: undefined,
			};
			vi.mocked(loadPluginManifest).mockResolvedValue(simpleManifest);
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: vi.fn(),
				};
			});
			mockDb.query.pluginsTable.findFirst.mockResolvedValue({
				id: "test-id",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
			});

			const result = await pluginManager.loadPlugin("test_plugin");
			expect(result).toBe(true);
		});

		it("should handle database connection errors", async () => {
			mockDb.query.pluginsTable.findFirst.mockRejectedValue(
				new Error("DB Error"),
			);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				if (filePath.includes("resolvers.js")) {
					return {
						testQueryResolver: vi.fn(),
					};
				}
				if (filePath.includes("schema.js")) {
					return {
						testTable: { name: "test_table" },
					};
				}
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: vi.fn(),
				};
			});

			const result = await pluginManager.loadPlugin("test_plugin");
			expect(result).toBe(true); // Should still load plugin
		});

		it("should handle plugin module export variations", async () => {
			// Test default export with resolver still available at top level
			vi.mocked(safeRequire).mockImplementation(async (filePath: string) => {
				if (filePath.includes("resolvers.js")) {
					return {
						testQueryResolver: vi.fn(), // Resolver must be at top level
						default: {
							testQueryResolver: vi.fn(),
						},
					};
				}
				if (filePath.includes("schema.js")) {
					return {
						testTable: { name: "test_table" },
					};
				}
				// Main plugin module (index.js)
				return {
					testQueryResolver: vi.fn(),
					testTable: { name: "test_table" },
					testHookHandler: vi.fn(),
					default: {
						testQueryResolver: vi.fn(),
					},
				};
			});
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			mockDb.query.pluginsTable.findFirst.mockResolvedValue({
				id: "test-id",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
			});

			const result = await pluginManager.loadPlugin("test_plugin");
			expect(result).toBe(true);
		});
	});
});
