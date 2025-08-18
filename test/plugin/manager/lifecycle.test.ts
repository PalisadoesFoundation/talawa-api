import { beforeEach, describe, expect, it, vi } from "vitest";
import { PluginLifecycle } from "../../../src/plugin/manager/lifecycle";
import { PluginStatus } from "../../../src/plugin/types";

// Mock dependencies
vi.mock("../../../src/plugin/utils", () => ({
	dropPluginTables: vi.fn(),
	safeRequire: vi.fn(),
}));

vi.mock("../../../src/graphql/schemaManager", () => ({
	schemaManager: {
		rebuildSchema: vi.fn(),
	},
}));

// Type definitions for mocks
interface MockPluginContext {
	db: {
		update: ReturnType<typeof vi.fn>;
	};
	logger: {
		info: ReturnType<typeof vi.fn>;
	};
}

interface MockLoadedPlugin {
	id: string;
	status: PluginStatus;
	manifest: {
		main: string;
	};
	databaseTables: Record<string, unknown>;
}

interface MockExtensionRegistry {
	graphql: {
		types: Record<string, { pluginId: string }>;
		mutations: Record<string, { pluginId: string }>;
		queries: Record<string, { pluginId: string }>;
		builderExtensions: Array<{ pluginId: string; fieldName: string }>;
	};
	database: {
		tables: Record<string, { pluginId: string }>;
		enums: Record<string, { pluginId: string }>;
		relations: Record<string, { pluginId: string }>;
	};
	hooks: {
		pre: Record<
			string,
			Array<{ pluginId: string; handler: ReturnType<typeof vi.fn> }>
		>;
		post: Record<
			string,
			Array<{ pluginId: string; handler: ReturnType<typeof vi.fn> }>
		>;
	};
}

interface MockPluginManager {
	emit: ReturnType<typeof vi.fn>;
}

interface MockPluginModule {
	onActivate?: ReturnType<typeof vi.fn>;
	onDeactivate?: ReturnType<typeof vi.fn>;
	onUnload?: ReturnType<typeof vi.fn>;
}

describe("PluginLifecycle", () => {
	let lifecycle: PluginLifecycle;
	let mockPluginContext: MockPluginContext;
	let mockLoadedPlugins: Map<string, MockLoadedPlugin>;
	let mockExtensionRegistry: MockExtensionRegistry;
	let mockPluginManager: MockPluginManager;

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Setup mock plugin context
		mockPluginContext = {
			db: {
				update: vi.fn(() => ({
					set: vi.fn(() => ({
						where: vi.fn(() => Promise.resolve()),
					})),
				})),
			},
			logger: {
				info: vi.fn(),
			},
		};

		// Setup mock loaded plugins
		mockLoadedPlugins = new Map();
		mockLoadedPlugins.set("test-plugin", {
			id: "test-plugin",
			status: PluginStatus.INACTIVE,
			manifest: {
				main: "index.js",
			},
			databaseTables: {},
		});

		// Setup mock extension registry
		mockExtensionRegistry = {
			graphql: {
				types: {},
				mutations: {},
				queries: {},
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
		};

		// Setup mock plugin manager
		mockPluginManager = {
			emit: vi.fn(() => true),
		};

		lifecycle = new PluginLifecycle(
			mockPluginContext as unknown as ConstructorParameters<
				typeof PluginLifecycle
			>[0],
			mockLoadedPlugins as unknown as ConstructorParameters<
				typeof PluginLifecycle
			>[1],
			mockExtensionRegistry as unknown as ConstructorParameters<
				typeof PluginLifecycle
			>[2],
		);
	});

	describe("activatePlugin", () => {
		it("should successfully activate a plugin", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onActivate: vi.fn(() => Promise.resolve()),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			const result = await lifecycle.activatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.activatePlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:activating",
				"test-plugin",
			);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:activated",
				"test-plugin",
			);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.ACTIVE,
			);
			expect(mockPluginModule.onActivate).toHaveBeenCalledWith(
				mockPluginContext,
			);
		});

		it("should throw error if plugin is not loaded", async () => {
			await expect(
				lifecycle.activatePlugin(
					"non-existent-plugin",
					mockPluginManager as unknown as Parameters<
						typeof lifecycle.activatePlugin
					>[1],
				),
			).rejects.toThrow("Plugin non-existent-plugin is not loaded");
		});

		it("should handle activation errors and reset status", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onActivate: vi.fn(() => Promise.reject(new Error("Activation failed"))),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			const result = await lifecycle.activatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.activatePlugin
				>[1],
			);

			expect(result).toBe(false);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.INACTIVE,
			);
		});

		it("should handle plugin module without onActivate hook", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			const result = await lifecycle.activatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.activatePlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.ACTIVE,
			);
		});

		it("should handle schema rebuild errors during activation", async () => {
			const { schemaManager } = await import(
				"../../../src/graphql/schemaManager"
			);
			(
				schemaManager.rebuildSchema as ReturnType<typeof vi.fn>
			).mockRejectedValue(new Error("Schema rebuild failed"));

			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			const result = await lifecycle.activatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.activatePlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.ACTIVE,
			);
		});
	});

	describe("deactivatePlugin", () => {
		beforeEach(() => {
			// Set plugin as active
			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.status = PluginStatus.ACTIVE;
			}
		});

		it("should successfully deactivate a plugin", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onDeactivate: vi.fn(() => Promise.resolve()),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			const result = await lifecycle.deactivatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.deactivatePlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:deactivating",
				"test-plugin",
			);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:deactivated",
				"test-plugin",
			);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.INACTIVE,
			);
			expect(mockPluginModule.onDeactivate).toHaveBeenCalledWith(
				mockPluginContext,
			);
		});

		it("should return true if plugin is already inactive", async () => {
			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.status = PluginStatus.INACTIVE;
			}

			const result = await lifecycle.deactivatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.deactivatePlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).not.toHaveBeenCalledWith(
				"plugin:deactivating",
				"test-plugin",
			);
		});

		it("should throw error if plugin is not loaded", async () => {
			await expect(
				lifecycle.deactivatePlugin(
					"non-existent-plugin",
					mockPluginManager as unknown as Parameters<
						typeof lifecycle.deactivatePlugin
					>[1],
				),
			).rejects.toThrow("Plugin non-existent-plugin is not loaded");
		});

		it("should handle deactivation errors and reset status", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onDeactivate: vi.fn(() =>
					Promise.reject(new Error("Deactivation failed")),
				),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			const result = await lifecycle.deactivatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.deactivatePlugin
				>[1],
			);

			expect(result).toBe(false);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.ACTIVE,
			);
		});

		it("should drop tables when dropTables is true", async () => {
			const { dropPluginTables } = await import("../../../src/plugin/utils");
			const { safeRequire } = await import("../../../src/plugin/utils");

			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.databaseTables = { testTable: {} };
			}

			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});
			(dropPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(
				undefined,
			);

			const result = await lifecycle.deactivatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.deactivatePlugin
				>[1],
				true,
			);

			expect(result).toBe(true);
			expect(dropPluginTables).toHaveBeenCalledWith(
				mockPluginContext.db,
				"test-plugin",
				{ testTable: {} },
				mockPluginContext.logger,
			);
		});

		it("should not drop tables when dropTables is false", async () => {
			const { dropPluginTables } = await import("../../../src/plugin/utils");
			const { safeRequire } = await import("../../../src/plugin/utils");

			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.databaseTables = { testTable: {} };
			}

			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			const result = await lifecycle.deactivatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.deactivatePlugin
				>[1],
				false,
			);

			expect(result).toBe(true);
			expect(dropPluginTables).not.toHaveBeenCalled();
		});
	});

	describe("unloadPlugin", () => {
		it("should successfully unload a plugin", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onUnload: vi.fn(() => Promise.resolve()),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			const result = await lifecycle.unloadPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.unloadPlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:unloading",
				"test-plugin",
			);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:unloaded",
				"test-plugin",
			);
			expect(mockLoadedPlugins.has("test-plugin")).toBe(false);
			expect(mockPluginModule.onUnload).toHaveBeenCalledWith(mockPluginContext);
		});

		it("should return true if plugin is already unloaded", async () => {
			const result = await lifecycle.unloadPlugin(
				"non-existent-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.unloadPlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).not.toHaveBeenCalledWith(
				"plugin:unloading",
				"non-existent-plugin",
			);
		});

		it("should deactivate plugin first if it is active", async () => {
			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.status = PluginStatus.ACTIVE;
			}

			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			const result = await lifecycle.unloadPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.unloadPlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockLoadedPlugins.has("test-plugin")).toBe(false);
		});

		it("should handle unload errors", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onUnload: vi.fn(() => Promise.reject(new Error("Unload failed"))),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			const result = await lifecycle.unloadPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.unloadPlugin
				>[1],
			);

			expect(result).toBe(false);
			expect(mockLoadedPlugins.has("test-plugin")).toBe(true); // Should still be there on error
		});

		it("should remove plugin from extension registry", async () => {
			// Setup extension registry with plugin extensions
			mockExtensionRegistry.graphql.builderExtensions = [
				{ pluginId: "test-plugin", fieldName: "testField" },
				{ pluginId: "other-plugin", fieldName: "otherField" },
			];
			mockExtensionRegistry.database.tables = {
				TestTable: { pluginId: "test-plugin" },
				OtherTable: { pluginId: "other-plugin" },
			};
			mockExtensionRegistry.hooks.pre = {
				testEvent: [
					{ pluginId: "test-plugin", handler: vi.fn() },
					{ pluginId: "other-plugin", handler: vi.fn() },
				],
			};

			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			await lifecycle.unloadPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.unloadPlugin
				>[1],
			);

			// Check that test-plugin extensions were removed
			expect(mockExtensionRegistry.graphql.builderExtensions).toHaveLength(1);
			expect(mockExtensionRegistry.graphql.builderExtensions[0]?.pluginId).toBe(
				"other-plugin",
			);
			expect(mockExtensionRegistry.database.tables.TestTable).toBeUndefined();
			expect(mockExtensionRegistry.database.tables.OtherTable).toBeDefined();
			const testEventHandlers = mockExtensionRegistry.hooks.pre.testEvent;
			expect(testEventHandlers).toBeDefined();
			expect(testEventHandlers).toHaveLength(1);
			if (testEventHandlers && testEventHandlers.length > 0) {
				expect(testEventHandlers[0]?.pluginId).toBe("other-plugin");
			}
			const postTestEventHandlers = mockExtensionRegistry.hooks.post.testEvent;
			expect(postTestEventHandlers).toBeUndefined();
		});
	});

	describe("getPluginModule", () => {
		it("should return null if plugin is not loaded", async () => {
			const result = await (
				lifecycle as unknown as {
					getPluginModule: (
						pluginId: string,
					) => Promise<MockPluginModule | null>;
				}
			).getPluginModule("non-existent-plugin");
			expect(result).toBeNull();
		});

		it("should load plugin module using safeRequire", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockModule: MockPluginModule = {
				test: "module",
			} as MockPluginModule;
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(mockModule);

			const result = await (
				lifecycle as unknown as {
					getPluginModule: (
						pluginId: string,
					) => Promise<MockPluginModule | null>;
				}
			).getPluginModule("test-plugin");

			expect(result).toBe(mockModule);
			expect(safeRequire).toHaveBeenCalledWith(
				expect.stringContaining("src/plugin/available/test-plugin/index.js"),
			);
		});
	});

	describe("removeFromExtensionRegistry", () => {
		it("should remove all plugin extensions from registry", () => {
			// Setup extension registry with plugin extensions
			mockExtensionRegistry.graphql.builderExtensions = [
				{ pluginId: "test-plugin", fieldName: "testField" },
				{ pluginId: "other-plugin", fieldName: "otherField" },
			];
			mockExtensionRegistry.database.tables = {
				TestTable: { pluginId: "test-plugin" },
				OtherTable: { pluginId: "other-plugin" },
			};
			mockExtensionRegistry.hooks.pre = {
				testEvent: [
					{ pluginId: "test-plugin", handler: vi.fn() },
					{ pluginId: "other-plugin", handler: vi.fn() },
				],
			};
			mockExtensionRegistry.hooks.post = {
				testEvent: [{ pluginId: "test-plugin", handler: vi.fn() }],
			};

			(
				lifecycle as unknown as {
					removeFromExtensionRegistry: (pluginId: string) => void;
				}
			).removeFromExtensionRegistry("test-plugin");

			// Check that test-plugin extensions were removed
			expect(mockExtensionRegistry.graphql.builderExtensions).toHaveLength(1);
			expect(mockExtensionRegistry.graphql.builderExtensions[0]?.pluginId).toBe(
				"other-plugin",
			);
			expect(mockExtensionRegistry.database.tables.TestTable).toBeUndefined();
			expect(mockExtensionRegistry.database.tables.OtherTable).toBeDefined();
			const testEventHandlers = mockExtensionRegistry.hooks.pre.testEvent;
			expect(testEventHandlers).toBeDefined();
			expect(testEventHandlers).toHaveLength(1);
			if (testEventHandlers && testEventHandlers.length > 0) {
				expect(testEventHandlers[0]?.pluginId).toBe("other-plugin");
			}
			const postTestEventHandlers = mockExtensionRegistry.hooks.post.testEvent;
			expect(postTestEventHandlers).toBeDefined();
			expect(postTestEventHandlers).toHaveLength(0);
		});
	});

	describe("updatePluginInDatabase", () => {
		it("should successfully update plugin in database", async () => {
			const updates = { isActivated: true };

			await (
				lifecycle as unknown as {
					updatePluginInDatabase: (
						pluginId: string,
						updates: Record<string, unknown>,
					) => Promise<void>;
				}
			).updatePluginInDatabase("test-plugin", updates);

			expect(mockPluginContext.db.update).toHaveBeenCalled();
		});

		it("should handle database update errors", async () => {
			const dbError = new Error("Database error");
			mockPluginContext.db.update = vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => Promise.reject(dbError)),
				})),
			}));

			await expect(
				(
					lifecycle as unknown as {
						updatePluginInDatabase: (
							pluginId: string,
							updates: Record<string, unknown>,
						) => Promise<void>;
					}
				).updatePluginInDatabase("test-plugin", { isActivated: true }),
			).rejects.toThrow("Database error");
		});
	});

	describe("handlePluginError", () => {
		it("should log plugin errors", () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const error = new Error("Test error");

			(
				lifecycle as unknown as {
					handlePluginError: (
						pluginId: string,
						error: Error,
						phase: string,
					) => void;
				}
			).handlePluginError("test-plugin", error, "activate");

			expect(consoleSpy).toHaveBeenCalledWith(
				"Plugin test-plugin error during activate:",
				error,
			);
			consoleSpy.mockRestore();
		});
	});

	describe("triggerSchemaRebuildForDeactivation", () => {
		it("should trigger schema rebuild for deactivation", async () => {
			const { schemaManager } = await import(
				"../../../src/graphql/schemaManager"
			);
			(
				schemaManager.rebuildSchema as ReturnType<typeof vi.fn>
			).mockResolvedValue(undefined);

			await (
				lifecycle as unknown as {
					triggerSchemaRebuildForDeactivation: (
						pluginId: string,
					) => Promise<void>;
				}
			).triggerSchemaRebuildForDeactivation("test-plugin");

			expect(schemaManager.rebuildSchema).toHaveBeenCalled();
		});

		it("should handle schema rebuild errors gracefully", async () => {
			const { schemaManager } = await import(
				"../../../src/graphql/schemaManager"
			);
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			(
				schemaManager.rebuildSchema as ReturnType<typeof vi.fn>
			).mockRejectedValue(new Error("Schema rebuild failed"));

			await (
				lifecycle as unknown as {
					triggerSchemaRebuildForDeactivation: (
						pluginId: string,
					) => Promise<void>;
				}
			).triggerSchemaRebuildForDeactivation("test-plugin");

			expect(consoleSpy).toHaveBeenCalledWith(
				"❌ Schema rebuild failed after plugin deactivation test-plugin:",
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});
	});
});
