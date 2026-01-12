import { type ChildProcess, spawn } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PluginLifecycle } from "../../../src/plugin/manager/lifecycle";
import type { IPluginManifest } from "../../../src/plugin/types";
import { PluginStatus } from "../../../src/plugin/types";

// Type for accessing private methods in tests
type PluginLifecycleWithPrivate = PluginLifecycle & {
	loadPluginManifest: (pluginId: string) => Promise<IPluginManifest | null>;
	handlePluginError: (pluginId: string, error: Error, phase: string) => void;
	callOnUninstallHook: (pluginId: string) => Promise<void>;
	callOnActivateHook: (pluginId: string) => Promise<void>;
	callOnDeactivateHook: (pluginId: string) => Promise<void>;
	callOnUnloadHook: (pluginId: string) => Promise<void>;
	loadedPlugins: Map<string, unknown>;
};

// Mock dependencies
vi.mock("../../../src/plugin/utils", () => ({
	dropPluginTables: vi.fn(),
	safeRequire: vi.fn(),
	createPluginTables: vi.fn(),
	isValidPluginId: vi.fn(() => true), // Default to returning true for valid plugin IDs
}));

vi.mock("../../../src/graphql/schemaManager", () => ({
	schemaManager: {
		rebuildSchema: vi.fn(),
	},
}));

vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

// Type definitions for mocks
interface MockPluginContext {
	db: {
		update: ReturnType<typeof vi.fn>;
	};
	logger: {
		info: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
		warn: ReturnType<typeof vi.fn>;
		debug: ReturnType<typeof vi.fn>;
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
	onInstall?: ReturnType<typeof vi.fn>;
	onActivate?: ReturnType<typeof vi.fn>;
	onDeactivate?: ReturnType<typeof vi.fn>;
	onUninstall?: ReturnType<typeof vi.fn>;
	onUnload?: ReturnType<typeof vi.fn>;
}

describe("PluginLifecycle", () => {
	let lifecycle: PluginLifecycle;
	let mockPluginContext: MockPluginContext;
	let mockLoadedPlugins: Map<string, MockLoadedPlugin>;
	let mockExtensionRegistry: MockExtensionRegistry;
	let mockPluginManager: MockPluginManager;

	beforeEach(async () => {
		// Reset mocks - use resetAllMocks to clear implementation queues too
		vi.resetAllMocks();

		// Re-establish default mock implementations after reset
		const { isValidPluginId } = await import("../../../src/plugin/utils");
		(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValue(true);

		// Default child_process.spawn mock: return an EventEmitter that emits close
		// (individual tests can override as needed)
		const { EventEmitter } = require("node:events");
		vi.mocked(spawn).mockImplementation(() => {
			const proc = new EventEmitter();
			setImmediate(() => proc.emit("close", 0));
			return proc as unknown as ChildProcess;
		});

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
				error: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn(),
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

	describe("installPlugin", () => {
		it("should successfully install a plugin", async () => {
			const { safeRequire, createPluginTables } = await import(
				"../../../src/plugin/utils"
			);
			const mockManifest = {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: {
					database: [
						{
							name: "TestTable",
							file: "tables.js",
							type: "table",
						},
					],
				},
			};
			const mockPluginModule: MockPluginModule = {
				onInstall: vi.fn(() => Promise.resolve()),
			};

			(safeRequire as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockManifest) // For manifest loading
				.mockResolvedValueOnce({ TestTable: {} }) // For table definition loading
				.mockResolvedValueOnce(mockPluginModule); // For plugin module loading

			(createPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(
				undefined,
			);

			const result = await lifecycle.installPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:installing",
				"test-plugin",
			);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:installed",
				"test-plugin",
			);
			expect(createPluginTables).toHaveBeenCalled();
			expect(mockPluginModule.onInstall).toHaveBeenCalledWith(
				mockPluginContext,
			);
		});

		it("should handle plugin without database tables", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockManifest = {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: {},
			};
			const mockPluginModule: MockPluginModule = {
				onInstall: vi.fn(() => Promise.resolve()),
			};

			(safeRequire as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockManifest) // For manifest loading
				.mockResolvedValueOnce(mockPluginModule); // For plugin module loading

			const result = await lifecycle.installPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:installing",
				"test-plugin",
			);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:installed",
				"test-plugin",
			);
		});

		it("should handle manifest loading failure", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			const result = await lifecycle.installPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			expect(result).toBe(false);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:installing",
				"test-plugin",
			);
		});

		it("should handle table creation failure", async () => {
			const { safeRequire, createPluginTables } = await import(
				"../../../src/plugin/utils"
			);
			const mockManifest = {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: {
					database: [
						{
							name: "TestTable",
							file: "tables.js",
							type: "table",
						},
					],
				},
			};

			(safeRequire as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockManifest) // For manifest loading
				.mockResolvedValueOnce({ TestTable: {} }); // For table definition loading

			(createPluginTables as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Table creation failed"),
			);

			const result = await lifecycle.installPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			expect(result).toBe(false);
		});

		it("should handle table definition loading failure", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockManifest = {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: {
					database: [
						{
							name: "TestTable",
							file: "tables.js",
							type: "table",
						},
					],
				},
			};

			(safeRequire as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockManifest) // For manifest loading
				.mockResolvedValueOnce(null); // For table definition loading - fails

			const result = await lifecycle.installPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			expect(result).toBe(false);
		});

		it("should handle missing table definition in file", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockManifest = {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: {
					database: [
						{
							name: "TestTable",
							file: "tables.js",
							type: "table",
						},
					],
				},
			};

			(safeRequire as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockManifest) // For manifest loading
				.mockResolvedValueOnce({}); // For table definition loading - empty object

			const result = await lifecycle.installPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			expect(result).toBe(false);
		});

		it("should handle onInstall hook failure gracefully", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockManifest = {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: {},
			};
			const mockPluginModule: MockPluginModule = {
				onInstall: vi.fn(() => Promise.reject(new Error("Install failed"))),
			};

			(safeRequire as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce(mockManifest) // For manifest loading
				.mockResolvedValueOnce(mockPluginModule); // For plugin module loading

			const result = await lifecycle.installPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			// The onInstall hook failure is caught and logged, but doesn't fail the installation
			expect(result).toBe(true);
		});

		it("should reject invalid plugin ID during installation", async () => {
			const { isValidPluginId } = await import("../../../src/plugin/utils");
			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

			// Logger already mocked in mockPluginContext

			const maliciousPluginId = "../malicious-plugin";
			const result = await lifecycle.installPlugin(
				maliciousPluginId,
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.installPlugin
				>[1],
			);

			expect(result).toBe(false);
			// Verify isValidPluginId was called with the supplied plugin id
			expect(isValidPluginId).toHaveBeenCalledWith(maliciousPluginId);
			// Verify logger.error was called exactly once for the error
			expect(mockPluginContext.logger.error).toHaveBeenCalledTimes(1);
			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: expect.stringContaining(
						"Plugin ../malicious-plugin error during install",
					),
					err: expect.any(Error),
				}),
			);
		});
	});

	describe("uninstallPlugin", () => {
		beforeEach(() => {
			// Add plugin to loaded plugins for uninstall tests
			mockLoadedPlugins.set("test-plugin", {
				id: "test-plugin",
				status: PluginStatus.ACTIVE,
				manifest: {
					main: "index.js",
				},
				databaseTables: { TestTable: {} },
			});
		});

		it("should successfully uninstall a plugin", async () => {
			// Mock isValidPluginId to return true FIRST before any lifecycle calls
			const { safeRequire, dropPluginTables, isValidPluginId } = await import(
				"../../../src/plugin/utils"
			);
			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValue(true);

			const mockPluginModule: MockPluginModule = {
				onUninstall: vi.fn(() => Promise.resolve()),
			};

			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);
			(dropPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(
				undefined,
			);

			// Mock private methods called by uninstallPlugin
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"loadPluginManifest",
			).mockResolvedValue({
				pluginId: "test-plugin",
				main: "index.js",
			});
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"updatePluginInDatabase",
			).mockResolvedValue(undefined);
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"triggerSchemaRebuild",
			).mockResolvedValue(undefined);
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"manageDocker",
			).mockResolvedValue(undefined);

			// Ensure the plugin is in loadedPlugins
			mockLoadedPlugins.set("test-plugin", {
				id: "test-plugin",
				status: PluginStatus.INACTIVE,
				manifest: {
					main: "index.js",
				},
				databaseTables: { TestTable: {} },
			});

			const result = await lifecycle.uninstallPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.uninstallPlugin
				>[1],
			);

			expect(result).toBe(true);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:uninstalling",
				"test-plugin",
			);
			expect(mockPluginManager.emit).toHaveBeenCalledWith(
				"plugin:uninstalled",
				"test-plugin",
			);
			expect(dropPluginTables).toHaveBeenCalled();
			expect(mockPluginModule.onUninstall).toHaveBeenCalledWith(
				mockPluginContext,
			);
			expect(mockLoadedPlugins.has("test-plugin")).toBe(false);
		});

		it("should handle uninstall errors gracefully", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onUninstall: vi.fn(() => Promise.reject(new Error("Uninstall failed"))),
			};

			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			const result = await lifecycle.uninstallPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.uninstallPlugin
				>[1],
			);

			// The onUninstall hook failure is caught and logged, but doesn't fail the uninstallation
			expect(result).toBe(true);
		});

		it("should handle plugin without database tables", async () => {
			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.databaseTables = undefined as unknown as Record<string, unknown>;
			}

			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			const result = await lifecycle.uninstallPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.uninstallPlugin
				>[1],
			);

			expect(result).toBe(true);
		});

		it("should handle database table removal failure", async () => {
			const { safeRequire, dropPluginTables } = await import(
				"../../../src/plugin/utils"
			);

			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});
			(dropPluginTables as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Table removal failed"),
			);

			const result = await lifecycle.uninstallPlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.uninstallPlugin
				>[1],
			);

			expect(result).toBe(true); // Should still succeed despite table removal failure
		});

		it("should reject invalid plugin ID during uninstallation", async () => {
			const { isValidPluginId } = await import("../../../src/plugin/utils");
			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

			// Logger already mocked in mockPluginContext

			const maliciousPluginId = "../malicious-plugin";
			const result = await lifecycle.uninstallPlugin(
				maliciousPluginId,
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.uninstallPlugin
				>[1],
			);

			expect(result).toBe(false);
			// Verify isValidPluginId was called with the supplied plugin id
			expect(isValidPluginId).toHaveBeenCalledWith(maliciousPluginId);
			expect(mockPluginManager.emit).not.toHaveBeenCalledWith(
				"plugin:installed",
				maliciousPluginId,
			);
			// Verify logger.error was called exactly once for the error
			expect(mockPluginContext.logger.error).toHaveBeenCalledTimes(1);
			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: expect.stringContaining(
						"Plugin ../malicious-plugin error during uninstall",
					),
					err: expect.any(Error),
				}),
			);
		});
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

			// Mock private methods called by activatePlugin
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"loadPluginManifest",
			).mockResolvedValue({
				pluginId: "test-plugin",
				main: "index.js",
			});
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"updatePluginInDatabase",
			).mockResolvedValue(undefined);
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"triggerSchemaRebuild",
			).mockResolvedValue(undefined);

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

			// Mock private methods and make them throw
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"loadPluginManifest",
			).mockResolvedValue({
				pluginId: "test-plugin",
				main: "index.js",
			});
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"updatePluginInDatabase",
			).mockResolvedValue(undefined);
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"triggerSchemaRebuild",
			).mockResolvedValue(undefined);
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"manageDocker",
			).mockResolvedValue(undefined);

			const result = await lifecycle.activatePlugin(
				"test-plugin",
				mockPluginManager as unknown as Parameters<
					typeof lifecycle.activatePlugin
				>[1],
			);

			// The onActivate hook failure is caught and logged, so activation should succeed
			expect(result).toBe(true);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.ACTIVE,
			);
		});

		it("should handle plugin module without onActivate hook", async () => {
			const { safeRequire, isValidPluginId } = await import(
				"../../../src/plugin/utils"
			);
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});
			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValue(true);

			// Mock private methods
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"loadPluginManifest",
			).mockResolvedValue({
				pluginId: "test-plugin",
				main: "index.js",
			});
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"updatePluginInDatabase",
			).mockResolvedValue(undefined);
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"triggerSchemaRebuild",
			).mockResolvedValue(undefined);
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"manageDocker",
			).mockResolvedValue(undefined);

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

			const { safeRequire, isValidPluginId } = await import(
				"../../../src/plugin/utils"
			);
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});
			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValue(true);

			// Mock private method loadPluginManifest
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"loadPluginManifest",
			).mockResolvedValue({
				pluginId: "test-plugin",
				main: "index.js",
			});

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
			// Mock isValidPluginId to return true FIRST
			const { safeRequire, isValidPluginId } = await import(
				"../../../src/plugin/utils"
			);
			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValue(true);

			const mockPluginModule: MockPluginModule = {
				onDeactivate: vi.fn(() => Promise.resolve()),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			// Mock private method loadPluginManifest
			vi.spyOn(
				lifecycle as unknown as PluginLifecycleWithPrivate,
				"loadPluginManifest",
			).mockResolvedValue({
				pluginId: "test-plugin",
				main: "index.js",
			});

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

			// The onDeactivate hook failure is caught and logged, but doesn't fail the deactivation
			expect(result).toBe(true);
			expect(mockLoadedPlugins.get("test-plugin")?.status).toBe(
				PluginStatus.INACTIVE,
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

		it("should handle unload errors gracefully", async () => {
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

			// The onUnload hook failure is caught and logged, but doesn't fail the unload
			expect(result).toBe(true);
			expect(mockLoadedPlugins.has("test-plugin")).toBe(false); // Plugin should still be removed
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

		it("should handle onInstall hook errors gracefully", async () => {
			const pluginId = "test-plugin";

			// Mock getPluginModule to return a module with onInstall that throws
			const mockPluginModule = {
				onInstall: vi.fn().mockRejectedValue(new Error("Install hook failed")),
			};

			// Mock the getPluginModule method
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue(mockPluginModule);

			// Loggers are already mocked

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					callOnInstallHook: (pluginId: string) => Promise<void>;
				}
			).callOnInstallHook(pluginId);

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error calling onInstall lifecycle hook for plugin test-plugin",
					err: expect.any(Error),
				}),
			);

			getPluginModuleSpy.mockRestore();
		});

		it("should handle onActivate hook errors gracefully", async () => {
			const pluginId = "test-plugin";

			// Mock getPluginModule to return a module with onActivate that throws
			const mockPluginModule = {
				onActivate: vi
					.fn()
					.mockRejectedValue(new Error("Activate hook failed")),
			};

			// Mock the getPluginModule method
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue(mockPluginModule);

			// Loggers are already mocked

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					callOnActivateHook: (pluginId: string) => Promise<void>;
				}
			).callOnActivateHook(pluginId);

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error calling onActivate lifecycle hook for plugin test-plugin",
					err: expect.any(Error),
				}),
			);

			getPluginModuleSpy.mockRestore();
		});

		it("should handle onDeactivate hook errors gracefully", async () => {
			const pluginId = "test-plugin";

			// Mock getPluginModule to return a module with onDeactivate that throws
			const mockPluginModule = {
				onDeactivate: vi
					.fn()
					.mockRejectedValue(new Error("Deactivate hook failed")),
			};

			// Mock the getPluginModule method
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue(mockPluginModule);

			// Loggers are already mocked

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					callOnDeactivateHook: (pluginId: string) => Promise<void>;
				}
			).callOnDeactivateHook(pluginId);

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error calling onDeactivate lifecycle hook for plugin test-plugin",
					err: expect.any(Error),
				}),
			);

			getPluginModuleSpy.mockRestore();
		});

		it("should handle onUninstall hook errors gracefully", async () => {
			const pluginId = "test-plugin";

			// Mock getPluginModule to return a module with onUninstall that throws
			const mockPluginModule = {
				onUninstall: vi
					.fn()
					.mockRejectedValue(new Error("Uninstall hook failed")),
			};

			// Mock the getPluginModule method
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue(mockPluginModule);

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					callOnUninstallHook: (pluginId: string) => Promise<void>;
				}
			).callOnUninstallHook(pluginId);

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error calling onUninstall lifecycle hook for plugin test-plugin",
					err: expect.any(Error),
				}),
			);

			getPluginModuleSpy.mockRestore();
		});

		it("should handle onUnload hook errors gracefully", async () => {
			const pluginId = "test-plugin";

			// Mock getPluginModule to return a module with onUnload that throws
			const mockPluginModule = {
				onUnload: vi.fn().mockRejectedValue(new Error("Unload hook failed")),
			};

			// Mock the getPluginModule method
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue(mockPluginModule);

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					callOnUnloadHook: (pluginId: string) => Promise<void>;
				}
			).callOnUnloadHook(pluginId);

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error calling onUnload lifecycle hook for plugin test-plugin",
					err: expect.any(Error),
				}),
			);
			getPluginModuleSpy.mockRestore();
		});
	});

	describe("manageDocker", () => {
		it("should skip Docker management when Docker is disabled", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: false,
				},
			};

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Test passes if no error is thrown (early return when disabled)
		});

		it("should skip Docker management when Docker config is not provided", async () => {
			const pluginId = "test-plugin";
			const manifest = {};

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Test passes if no error is thrown (early return when no config)
		});

		it("should handle Docker configuration with custom compose file", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "custom-compose.yml",
				},
			};

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Test passes if no error is thrown (will fail on docker check but that's expected)
		});

		it("should handle Docker configuration with service argument", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					service: "test-service",
				},
			};

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Test passes if no error is thrown (will fail on docker check but that's expected)
		});

		it("should handle Docker configuration with environment variables", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					env: {
						CUSTOM_VAR: "test-value",
						ANOTHER_VAR: "another-value",
					},
				},
			};

			// Call the private method through reflection
			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Test passes if no error is thrown (will fail on docker check but that's expected)
		});

		it("should handle different Docker actions", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
				},
			};

			// Test different actions
			const actions = [
				"install",
				"activate",
				"deactivate",
				"uninstall",
			] as const;

			for (const action of actions) {
				await (
					lifecycle as unknown as {
						manageDocker: (
							pluginId: string,
							manifest: unknown,
							action: string,
						) => Promise<void>;
					}
				).manageDocker(pluginId, manifest, action);

				// Test passes if no error is thrown (will fail on docker check but that's expected)
			}
		});

		it("should execute docker build command when buildOnInstall is true", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					buildOnInstall: true,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Covers line 645
			expect(spawn).toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining([
					"docker",
					"compose",
					"-f",
					expect.stringContaining("docker-compose.yml"),
					"build",
				]),
				expect.any(Object),
			);
		});

		it("should execute docker up command when upOnActivate is true", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					upOnActivate: true,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "activate");

			// Covers line 650
			expect(spawn).toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining([
					"docker",
					"compose",
					"-f",
					expect.stringContaining("docker-compose.yml"),
					"up",
					"-d",
				]),
				expect.any(Object),
			);
		});

		it("should execute docker down command when downOnDeactivate is true", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					downOnDeactivate: true,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "deactivate");

			// Covers line 655
			expect(spawn).toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining([
					"docker",
					"compose",
					"-f",
					expect.stringContaining("docker-compose.yml"),
					"down",
				]),
				expect.any(Object),
			);
		});

		it("should execute docker down with volumes when removeOnUninstall is true", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					removeOnUninstall: true,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "uninstall");

			// Covers line 660
			expect(spawn).toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining([
					"docker",
					"compose",
					"-f",
					expect.stringContaining("docker-compose.yml"),
					"down",
					"-v",
				]),
				expect.any(Object),
			);
		});
	});

	describe("Error Handling with handlePluginError", () => {
		it("should handle install errors and call handlePluginError", async () => {
			const pluginId = "test-plugin";
			const mockPluginManager = {
				emit: vi.fn(),
			};

			// Mock loadPluginManifest to throw an error
			const loadPluginManifestSpy = vi
				.spyOn(lifecycle as PluginLifecycleWithPrivate, "loadPluginManifest")
				.mockRejectedValue(new Error("Manifest loading failed"));

			// Mock handlePluginError to capture the call
			const handlePluginErrorSpy = vi.spyOn(
				lifecycle as PluginLifecycleWithPrivate,
				"handlePluginError",
			);

			const result = await lifecycle.installPlugin(pluginId, mockPluginManager);

			expect(result).toBe(false);
			expect(handlePluginErrorSpy).toHaveBeenCalledWith(
				pluginId,
				expect.any(Error),
				"install",
			);

			loadPluginManifestSpy.mockRestore();
			handlePluginErrorSpy.mockRestore();
		});

		it("should handle uninstall errors and call handlePluginError", async () => {
			const pluginId = "test-plugin";
			const mockPluginManager = {
				emit: vi.fn(),
			};

			// Mock callOnUninstallHook to throw an error
			const callOnUninstallHookSpy = vi
				.spyOn(lifecycle as PluginLifecycleWithPrivate, "callOnUninstallHook")
				.mockRejectedValue(new Error("Uninstall hook failed"));

			// Mock handlePluginError to capture the call
			const handlePluginErrorSpy = vi.spyOn(
				lifecycle as PluginLifecycleWithPrivate,
				"handlePluginError",
			);

			const result = await lifecycle.uninstallPlugin(
				pluginId,
				mockPluginManager,
			);

			expect(result).toBe(false);
			expect(handlePluginErrorSpy).toHaveBeenCalledWith(
				pluginId,
				expect.any(Error),
				"uninstall",
			);

			callOnUninstallHookSpy.mockRestore();
			handlePluginErrorSpy.mockRestore();
		});

		it("should handle activate errors, reset status, and call handlePluginError", async () => {
			const pluginId = "test-plugin";
			const mockPluginManager = {
				emit: vi.fn(),
			};

			// Add plugin to loaded plugins
			const mockPlugin = {
				id: pluginId,
				status: PluginStatus.INACTIVE,
				module: {},
				manifest: {} as IPluginManifest,
				graphqlResolvers: {},
				databaseTables: {},
				hooks: {},
				webhooks: {},
			};
			(
				lifecycle as unknown as { loadedPlugins: Map<string, unknown> }
			).loadedPlugins.set(pluginId, mockPlugin);

			// Mock callOnActivateHook to throw an error
			const callOnActivateHookSpy = vi
				.spyOn(lifecycle as PluginLifecycleWithPrivate, "callOnActivateHook")
				.mockRejectedValue(new Error("Activate hook failed"));

			// Mock handlePluginError to capture the call
			const handlePluginErrorSpy = vi.spyOn(
				lifecycle as PluginLifecycleWithPrivate,
				"handlePluginError",
			);

			const result = await lifecycle.activatePlugin(
				pluginId,
				mockPluginManager,
			);

			expect(result).toBe(false);
			expect(mockPlugin.status).toBe(PluginStatus.INACTIVE); // Should be reset to INACTIVE
			expect(handlePluginErrorSpy).toHaveBeenCalledWith(
				pluginId,
				expect.any(Error),
				"activate",
			);

			callOnActivateHookSpy.mockRestore();
			handlePluginErrorSpy.mockRestore();
		});

		it("should handle deactivate errors, reset status, and call handlePluginError", async () => {
			const pluginId = "test-plugin";
			const mockPluginManager = {
				emit: vi.fn(),
			};

			// Add plugin to loaded plugins
			const mockPlugin = {
				id: pluginId,
				status: PluginStatus.ACTIVE,
				module: {},
				manifest: {} as IPluginManifest,
				graphqlResolvers: {},
				databaseTables: {},
				hooks: {},
				webhooks: {},
			};
			(
				lifecycle as unknown as { loadedPlugins: Map<string, unknown> }
			).loadedPlugins.set(pluginId, mockPlugin);

			// Mock callOnDeactivateHook to throw an error
			const callOnDeactivateHookSpy = vi
				.spyOn(lifecycle as PluginLifecycleWithPrivate, "callOnDeactivateHook")
				.mockRejectedValue(new Error("Deactivate hook failed"));

			// Mock handlePluginError to capture the call
			const handlePluginErrorSpy = vi.spyOn(
				lifecycle as PluginLifecycleWithPrivate,
				"handlePluginError",
			);

			const result = await lifecycle.deactivatePlugin(
				pluginId,
				mockPluginManager,
			);

			expect(result).toBe(false);
			expect(mockPlugin.status).toBe(PluginStatus.ACTIVE); // Should be reset to ACTIVE
			expect(handlePluginErrorSpy).toHaveBeenCalledWith(
				pluginId,
				expect.any(Error),
				"deactivate",
			);

			callOnDeactivateHookSpy.mockRestore();
			handlePluginErrorSpy.mockRestore();
		});

		it("should handle unload errors and call handlePluginError", async () => {
			const pluginId = "test-plugin";
			const mockPluginManager = {
				emit: vi.fn(),
			};

			// Add plugin to loaded plugins
			const mockPlugin = {
				id: pluginId,
				status: PluginStatus.ACTIVE,
				module: {},
				manifest: {} as IPluginManifest,
				graphqlResolvers: {},
				databaseTables: {},
				hooks: {},
				webhooks: {},
			};
			(
				lifecycle as unknown as { loadedPlugins: Map<string, unknown> }
			).loadedPlugins.set(pluginId, mockPlugin);

			// Mock callOnUnloadHook to throw an error
			const callOnUnloadHookSpy = vi
				.spyOn(lifecycle as PluginLifecycleWithPrivate, "callOnUnloadHook")
				.mockRejectedValue(new Error("Unload hook failed"));

			// Mock handlePluginError to capture the call
			const handlePluginErrorSpy = vi.spyOn(
				lifecycle as PluginLifecycleWithPrivate,
				"handlePluginError",
			);

			const result = await lifecycle.unloadPlugin(pluginId, mockPluginManager);

			expect(result).toBe(false);
			expect(handlePluginErrorSpy).toHaveBeenCalledWith(
				pluginId,
				expect.any(Error),
				"unload",
			);

			callOnUnloadHookSpy.mockRestore();
			handlePluginErrorSpy.mockRestore();
		});

		it("should handle manifest loading failure in install", async () => {
			const pluginId = "test-plugin";
			const mockPluginManager = {
				emit: vi.fn(),
			};

			// Mock loadPluginManifest to return null (manifest loading failure)
			const loadPluginManifestSpy = vi
				.spyOn(lifecycle as PluginLifecycleWithPrivate, "loadPluginManifest")
				.mockResolvedValue(null);

			// Mock handlePluginError to capture the call
			const handlePluginErrorSpy = vi.spyOn(
				lifecycle as PluginLifecycleWithPrivate,
				"handlePluginError",
			);

			const result = await lifecycle.installPlugin(pluginId, mockPluginManager);

			expect(result).toBe(false);
			expect(handlePluginErrorSpy).toHaveBeenCalledWith(
				pluginId,
				expect.any(Error),
				"install",
			);

			loadPluginManifestSpy.mockRestore();
			handlePluginErrorSpy.mockRestore();
		});

		it("should handle manifest loading failure in uninstall", async () => {
			const pluginId = "test-plugin";
			const mockPluginManager = {
				emit: vi.fn(),
			};

			// Mock loadPluginManifest to throw an error (manifest loading failure)
			const loadPluginManifestSpy = vi
				.spyOn(lifecycle as PluginLifecycleWithPrivate, "loadPluginManifest")
				.mockRejectedValue(new Error("Manifest loading failed"));

			// Mock handlePluginError to capture the call
			const handlePluginErrorSpy = vi.spyOn(
				lifecycle as PluginLifecycleWithPrivate,
				"handlePluginError",
			);

			const result = await lifecycle.uninstallPlugin(
				pluginId,
				mockPluginManager,
			);

			expect(result).toBe(false);
			expect(handlePluginErrorSpy).toHaveBeenCalledWith(
				pluginId,
				expect.any(Error),
				"uninstall",
			);

			loadPluginManifestSpy.mockRestore();
			handlePluginErrorSpy.mockRestore();
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
			// Logger is already mocked
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

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Plugin test-plugin error during activate",
					err: error,
				}),
			);
		});
	});

	describe("triggerSchemaRebuild", () => {
		it("should trigger schema rebuild", async () => {
			const { schemaManager } = await import(
				"../../../src/graphql/schemaManager"
			);
			(
				schemaManager.rebuildSchema as ReturnType<typeof vi.fn>
			).mockResolvedValue(undefined);

			await (
				lifecycle as unknown as {
					triggerSchemaRebuild: () => Promise<void>;
				}
			).triggerSchemaRebuild();

			expect(schemaManager.rebuildSchema).toHaveBeenCalled();
		});

		it("should handle schema rebuild errors gracefully", async () => {
			const { schemaManager } = await import(
				"../../../src/graphql/schemaManager"
			);
			// Logger is already mocked
			(
				schemaManager.rebuildSchema as ReturnType<typeof vi.fn>
			).mockRejectedValue(new Error("Schema rebuild failed"));

			await (
				lifecycle as unknown as {
					triggerSchemaRebuild: () => Promise<void>;
				}
			).triggerSchemaRebuild();

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Schema rebuild failed",
					err: expect.any(Error),
				}),
			);
		});
	});

	describe("loadPluginManifest", () => {
		it("should load plugin manifest successfully", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockManifest = {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(mockManifest);

			const result = await (
				lifecycle as unknown as {
					loadPluginManifest: (pluginId: string) => Promise<unknown>;
				}
			).loadPluginManifest("test-plugin");

			expect(result).toBe(mockManifest);
			expect(safeRequire).toHaveBeenCalledWith(
				expect.stringContaining(
					"src/plugin/available/test-plugin/manifest.json",
				),
			);
		});

		it("should throw error if manifest loading fails", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			await expect(
				(
					lifecycle as unknown as {
						loadPluginManifest: (pluginId: string) => Promise<unknown>;
					}
				).loadPluginManifest("test-plugin"),
			).rejects.toThrow("Failed to load manifest for plugin test-plugin");
		});
	});

	describe("createPluginDatabases", () => {
		it("should create plugin databases successfully", async () => {
			const { safeRequire, createPluginTables } = await import(
				"../../../src/plugin/utils"
			);
			const mockManifest = {
				pluginId: "test-plugin",
				extensionPoints: {
					database: [
						{
							name: "TestTable",
							file: "tables.js",
							type: "table",
						},
					],
				},
			};

			// Mock safeRequire to return the table definition when called for the table file
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({
				TestTable: { id: "test" },
			});

			(createPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(
				undefined,
			);

			await (
				lifecycle as unknown as {
					createPluginDatabases: (
						pluginId: string,
						manifest: unknown,
					) => Promise<void>;
				}
			).createPluginDatabases("test-plugin", mockManifest);

			expect(createPluginTables).toHaveBeenCalled();
		});

		it("should handle plugin without database tables", async () => {
			const mockManifest = {
				pluginId: "test-plugin",
				extensionPoints: {},
			};

			await (
				lifecycle as unknown as {
					createPluginDatabases: (
						pluginId: string,
						manifest: unknown,
					) => Promise<void>;
				}
			).createPluginDatabases("test-plugin", mockManifest);

			// Should not throw and should not call createPluginTables
		});

		it("should handle empty database extension points", async () => {
			const mockManifest = {
				pluginId: "test-plugin",
				extensionPoints: {
					database: [],
				},
			};

			await (
				lifecycle as unknown as {
					createPluginDatabases: (
						pluginId: string,
						manifest: unknown,
					) => Promise<void>;
				}
			).createPluginDatabases("test-plugin", mockManifest);

			// Should not throw and should not call createPluginTables
		});
	});

	describe("removePluginDatabases", () => {
		it("should remove plugin databases successfully", async () => {
			const { dropPluginTables } = await import("../../../src/plugin/utils");
			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.databaseTables = { TestTable: {} };
			}

			(dropPluginTables as ReturnType<typeof vi.fn>).mockResolvedValue(
				undefined,
			);

			await (
				lifecycle as unknown as {
					removePluginDatabases: (pluginId: string) => Promise<void>;
				}
			).removePluginDatabases("test-plugin");

			expect(dropPluginTables).toHaveBeenCalled();
		});

		it("should handle plugin without database tables", async () => {
			const { dropPluginTables } = await import("../../../src/plugin/utils");
			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.databaseTables = undefined as unknown as Record<string, unknown>;
			}

			await (
				lifecycle as unknown as {
					removePluginDatabases: (pluginId: string) => Promise<void>;
				}
			).removePluginDatabases("test-plugin");

			expect(dropPluginTables).not.toHaveBeenCalled();
		});

		it("should handle plugin not found", async () => {
			const { dropPluginTables } = await import("../../../src/plugin/utils");

			await (
				lifecycle as unknown as {
					removePluginDatabases: (pluginId: string) => Promise<void>;
				}
			).removePluginDatabases("non-existent-plugin");

			expect(dropPluginTables).not.toHaveBeenCalled();
		});
	});

	describe("callOnInstallHook", () => {
		beforeEach(() => {
			// Add plugin to loaded plugins for hook tests
			mockLoadedPlugins.set("test-plugin", {
				id: "test-plugin",
				status: PluginStatus.INACTIVE,
				manifest: {
					main: "index.js",
				},
				databaseTables: {},
			});
		});

		it("should call onInstall hook successfully", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onInstall: vi.fn(() => Promise.resolve()),
			};

			// Mock safeRequire to return our mock module when called for the plugin's main file
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			await (
				lifecycle as unknown as {
					callOnInstallHook: (pluginId: string) => Promise<void>;
				}
			).callOnInstallHook("test-plugin");

			expect(mockPluginModule.onInstall).toHaveBeenCalledWith(
				mockPluginContext,
			);
		});

		it("should handle plugin module without onInstall hook", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			await expect(
				(
					lifecycle as unknown as {
						callOnInstallHook: (pluginId: string) => Promise<void>;
					}
				).callOnInstallHook("test-plugin"),
			).resolves.not.toThrow();
		});

		it("should handle onInstall hook errors gracefully", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");

			const mockPluginModule: MockPluginModule = {
				onInstall: vi.fn(() => Promise.reject(new Error("Install failed"))),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			await (
				lifecycle as unknown as {
					callOnInstallHook: (pluginId: string) => Promise<void>;
				}
			).callOnInstallHook("test-plugin");

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error calling onInstall lifecycle hook for plugin test-plugin",
					err: expect.any(Error),
				}),
			);
		});
	});

	describe("callOnUninstallHook", () => {
		it("should call onUninstall hook successfully", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			const mockPluginModule: MockPluginModule = {
				onUninstall: vi.fn(() => Promise.resolve()),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			await (
				lifecycle as unknown as {
					callOnUninstallHook: (pluginId: string) => Promise<void>;
				}
			).callOnUninstallHook("test-plugin");

			expect(mockPluginModule.onUninstall).toHaveBeenCalledWith(
				mockPluginContext,
			);
		});

		it("should handle plugin module without onUninstall hook", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue({});

			await expect(
				(
					lifecycle as unknown as {
						callOnUninstallHook: (pluginId: string) => Promise<void>;
					}
				).callOnUninstallHook("test-plugin"),
			).resolves.not.toThrow();
		});

		it("should handle onUninstall hook errors gracefully", async () => {
			const { safeRequire } = await import("../../../src/plugin/utils");

			const mockPluginModule: MockPluginModule = {
				onUninstall: vi.fn(() => Promise.reject(new Error("Uninstall failed"))),
			};
			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(
				mockPluginModule,
			);

			await (
				lifecycle as unknown as {
					callOnUninstallHook: (pluginId: string) => Promise<void>;
				}
			).callOnUninstallHook("test-plugin");

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error calling onUninstall lifecycle hook for plugin test-plugin",
					err: expect.any(Error),
				}),
			);
		});
	});

	describe("loadPluginManifest validation", () => {
		it("should throw error for invalid plugin ID in loadPluginManifest", async () => {
			const { isValidPluginId } = await import("../../../src/plugin/utils");
			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

			await expect(
				(
					lifecycle as unknown as {
						loadPluginManifest: (pluginId: string) => Promise<unknown>;
					}
				).loadPluginManifest("../malicious"),
			).rejects.toThrow("Invalid plugin ID: ../malicious");
		});
	});

	describe("manageDocker edge cases", () => {
		it("should warn and return when Docker command fails (docker not available)", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			// Make docker --version fail
			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(
				(command: string, args: string[]) => {
					const proc = new EventEmitter();
					setImmediate(() => {
						if (command === "docker" && args[0] === "--version") {
							proc.emit("close", 1); // Non-zero exit code for docker --version
						} else {
							proc.emit("close", 0);
						}
					});
					return proc;
				},
			);

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			expect(mockPluginContext.logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("Docker not available"),
			);
		});

		it("should warn and return when docker compose is not available", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			let callCount = 0;
			// Make docker compose version fail but docker --version pass
			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(
				(command: string, args: string[]) => {
					const proc = new EventEmitter();
					setImmediate(() => {
						callCount++;
						if (
							callCount === 2 &&
							command === "docker" &&
							args[0] === "compose"
						) {
							proc.emit("close", 1); // Non-zero exit code for docker compose
						} else {
							proc.emit("close", 0);
						}
					});
					return proc;
				},
			);

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			expect(mockPluginContext.logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("'docker compose' not available"),
			);
		});

		it("should handle spawn error event as Docker not available", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			// Make spawn emit error - this triggers the Docker availability check failure
			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => {
					proc.emit("error", new Error("Spawn failed"));
				});
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Spawn error during docker --version check results in "Docker not available" message
			expect(mockPluginContext.logger.warn).toHaveBeenCalledWith(
				expect.stringContaining("Docker not available"),
			);
		});

		it("should skip buildOnInstall when explicitly set to false", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					buildOnInstall: false,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "install");

			// Should not have called build because buildOnInstall is false
			expect(spawn).not.toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining(["build"]),
				expect.any(Object),
			);
		});

		it("should skip upOnActivate when explicitly set to false", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					upOnActivate: false,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "activate");

			// Should not have called up because upOnActivate is false
			expect(spawn).not.toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining(["up", "-d"]),
				expect.any(Object),
			);
		});

		it("should skip downOnDeactivate when explicitly set to false", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					downOnDeactivate: false,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "deactivate");

			// Should not have called down because downOnDeactivate is false
			expect(spawn).not.toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining(["down"]),
				expect.any(Object),
			);
		});

		it("should skip removeOnUninstall when explicitly set to false", async () => {
			const pluginId = "test-plugin";
			const manifest = {
				docker: {
					enabled: true,
					composeFile: "docker-compose.yml",
					removeOnUninstall: false,
				},
			};

			const { spawn } = await import("node:child_process");
			const EventEmitter = (await import("node:events")).EventEmitter;

			(spawn as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
				const proc = new EventEmitter();
				setImmediate(() => proc.emit("close", 0));
				return proc;
			});

			await (
				lifecycle as unknown as {
					manageDocker: (
						pluginId: string,
						manifest: unknown,
						action: string,
					) => Promise<void>;
				}
			).manageDocker(pluginId, manifest, "uninstall");

			// Should not have called down -v because removeOnUninstall is false
			expect(spawn).not.toHaveBeenCalledWith(
				"sudo",
				expect.arrayContaining(["down", "-v"]),
				expect.any(Object),
			);
		});
	});

	describe("removePluginDatabases error handling", () => {
		it("should handle database table removal error gracefully", async () => {
			const { dropPluginTables } = await import("../../../src/plugin/utils");
			const plugin = mockLoadedPlugins.get("test-plugin");
			if (plugin) {
				plugin.databaseTables = { TestTable: {} };
			}

			(dropPluginTables as ReturnType<typeof vi.fn>).mockRejectedValue(
				new Error("Drop failed"),
			);

			await (
				lifecycle as unknown as {
					removePluginDatabases: (pluginId: string) => Promise<void>;
				}
			).removePluginDatabases("test-plugin");

			expect(mockPluginContext.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: expect.stringContaining("Failed to remove tables"),
				}),
			);
		});
	});
});
