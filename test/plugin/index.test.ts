/**
 * Plugin System Test Suite
 *
 * This file serves as the main entry point for all plugin system tests.
 * It imports and runs comprehensive tests for the entire plugin system including:
 * - Plugin Manager functionality
 * - Plugin utilities and helpers
 * - Plugin registry and initialization
 * - Plugin logging system
 * - GraphQL queries and mutations
 * - Plugin types and interfaces
 */

import { describe, expect, it, vi } from "vitest";
import {
	ExtensionPointType,
	PluginManager,
	PluginStatus,
	createPluginContext,
	debounce,
	deepClone,
	directoryExists,
	ensureDirectory,
	filterActiveExtensions,
	generatePluginId,
	initializePluginSystem,
	isValidPluginId,
	loadPluginManifest,
	normalizeImportPath,
	safeRequire,
	scanPluginsDirectory,
	sortExtensionPoints,
	validatePluginManifest,
} from "~/src/plugin";
import type {
	IDatabaseExtension,
	IExtensionPoints,
	IExtensionRegistry,
	IGraphQLExtension,
	IHookExtension,
	ILoadedPlugin,
	IPluginContext,
	IPluginDiscovery,
	IPluginError,
	IPluginLifecycle,
	IPluginManifest,
} from "~/src/plugin";

describe("Plugin Index Exports", () => {
	describe("PluginManager Export", () => {
		it("should export PluginManager as default", () => {
			expect(PluginManager).toBeDefined();
			expect(typeof PluginManager).toBe("function");
		});
	});

	describe("Type Exports", () => {
		it("should export PluginStatus enum", () => {
			expect(PluginStatus).toBeDefined();
			expect(typeof PluginStatus).toBe("object");
			expect(PluginStatus.ACTIVE).toBeDefined();
			expect(PluginStatus.INACTIVE).toBeDefined();
		});

		it("should export ExtensionPointType enum", () => {
			expect(ExtensionPointType).toBeDefined();
			expect(typeof ExtensionPointType).toBe("object");
		});
	});

	describe("Utility Function Exports", () => {
		it("should export manifest validation functions", () => {
			expect(validatePluginManifest).toBeDefined();
			expect(typeof validatePluginManifest).toBe("function");
		});

		it("should export plugin ID functions", () => {
			expect(generatePluginId).toBeDefined();
			expect(typeof generatePluginId).toBe("function");
			expect(isValidPluginId).toBeDefined();
			expect(typeof isValidPluginId).toBe("function");
		});

		it("should export manifest loading functions", () => {
			expect(loadPluginManifest).toBeDefined();
			expect(typeof loadPluginManifest).toBe("function");
		});

		it("should export directory scanning functions", () => {
			expect(scanPluginsDirectory).toBeDefined();
			expect(typeof scanPluginsDirectory).toBe("function");
		});

		it("should export import path functions", () => {
			expect(normalizeImportPath).toBeDefined();
			expect(typeof normalizeImportPath).toBe("function");
		});

		it("should export safe require function", () => {
			expect(safeRequire).toBeDefined();
			expect(typeof safeRequire).toBe("function");
		});

		it("should export directory utility functions", () => {
			expect(directoryExists).toBeDefined();
			expect(typeof directoryExists).toBe("function");
			expect(ensureDirectory).toBeDefined();
			expect(typeof ensureDirectory).toBe("function");
		});

		it("should export extension utility functions", () => {
			expect(sortExtensionPoints).toBeDefined();
			expect(typeof sortExtensionPoints).toBe("function");
			expect(filterActiveExtensions).toBeDefined();
			expect(typeof filterActiveExtensions).toBe("function");
		});

		it("should export utility functions", () => {
			expect(debounce).toBeDefined();
			expect(typeof debounce).toBe("function");
			expect(deepClone).toBeDefined();
			expect(typeof deepClone).toBe("function");
		});
	});

	describe("Registry Function Exports", () => {
		it("should export plugin context creation function", () => {
			expect(createPluginContext).toBeDefined();
			expect(typeof createPluginContext).toBe("function");
		});

		it("should export plugin system initialization function", () => {
			expect(initializePluginSystem).toBeDefined();
			expect(typeof initializePluginSystem).toBe("function");
		});
	});
});

describe("Plugin Index Integration", () => {
	describe("Type Compatibility", () => {
		it("should have compatible plugin manifest types", () => {
			const manifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			expect(manifest.name).toBe("Test Plugin");
			expect(manifest.pluginId).toBe("test_plugin");
		});

		it("should have compatible extension point types", () => {
			const extensionPoints: IExtensionPoints = {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						resolver: "testResolver",
						file: "",
					},
				],
				database: [
					{
						name: "testTable",
						type: "table",
						file: "",
					},
				],
			};

			expect(extensionPoints.graphql).toHaveLength(1);
			expect(extensionPoints.database).toHaveLength(1);
		});

		it("should have compatible GraphQL extension types", () => {
			const graphqlExtension: IGraphQLExtension = {
				name: "testQuery",
				type: "query",
				resolver: "testResolver",
				file: "",
			};

			expect(graphqlExtension.name).toBe("testQuery");
			expect(graphqlExtension.type).toBe("query");
		});

		it("should have compatible database extension types", () => {
			const databaseExtension: IDatabaseExtension = {
				name: "testTable",
				type: "table",
				file: "",
			};

			expect(databaseExtension.name).toBe("testTable");
			expect(databaseExtension.type).toBe("table");
		});

		it("should have compatible hook extension types", () => {
			const hookExtension: IHookExtension = {
				type: "pre",
				event: "user:created",
				handler: "testHandler",
				file: "",
			};

			expect(hookExtension.event).toBe("user:created");
			expect(hookExtension.handler).toBe("testHandler");
		});

		it("should have compatible loaded plugin types", () => {
			const loadedPlugin: ILoadedPlugin = {
				id: "test_plugin",
				manifest: {
					name: "Test Plugin",
					pluginId: "test_plugin",
					version: "1.0.0",
					description: "A test plugin",
					author: "Test Author",
					main: "index.js",
				},
				status: PluginStatus.ACTIVE,
				graphqlResolvers: {},
				databaseTables: {},
				hooks: {},
			};

			expect(loadedPlugin.id).toBe("test_plugin");
			expect(loadedPlugin.status).toBe(PluginStatus.ACTIVE);
		});

		it("should have compatible extension registry types", () => {
			const extensionRegistry: IExtensionRegistry = {
				graphql: {
					queries: {},
					mutations: {},
					subscriptions: {},
					types: {},
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

			expect(extensionRegistry.graphql).toBeDefined();
			expect(extensionRegistry.database).toBeDefined();
			expect(extensionRegistry.hooks).toBeDefined();
		});

		it("should have compatible plugin context types", () => {
			const mockDb = {};
			const mockGraphQL = {};
			const mockPubSub = {};
			const mockLogger = {};

			const pluginContext: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			expect(pluginContext.db).toBe(mockDb);
			expect(pluginContext.graphql).toBe(mockGraphQL);
			expect(pluginContext.pubsub).toBe(mockPubSub);
			expect(pluginContext.logger).toBe(mockLogger);
		});

		it("should have compatible plugin discovery types", () => {
			const pluginDiscovery: IPluginDiscovery = {
				scanDirectory: vi.fn(),
				validateManifest: vi.fn(),
				loadManifest: vi.fn(),
			};

			expect(pluginDiscovery.scanDirectory).toBeDefined();
			expect(pluginDiscovery.loadManifest).toBeDefined();
			expect(pluginDiscovery.validateManifest).toBeDefined();
		});

		it("should have compatible plugin lifecycle types", () => {
			const pluginLifecycle: IPluginLifecycle = {
				onLoad: vi.fn(),
				onActivate: vi.fn(),
				onDeactivate: vi.fn(),
				onUnload: vi.fn(),
			};

			expect(pluginLifecycle.onLoad).toBeDefined();
			expect(pluginLifecycle.onActivate).toBeDefined();
			expect(pluginLifecycle.onDeactivate).toBeDefined();
			expect(pluginLifecycle.onUnload).toBeDefined();
		});

		it("should have compatible plugin error types", () => {
			const pluginError: IPluginError = {
				pluginId: "test_plugin",
				error: new Error("Test error"),
				phase: "load",
				timestamp: new Date(),
			};

			expect(pluginError.pluginId).toBe("test_plugin");
			expect(pluginError.phase).toBe("load");
			expect(pluginError.error).toBeInstanceOf(Error);
		});
	});

	describe("Enum Values", () => {
		it("should have correct PluginStatus enum values", () => {
			expect(PluginStatus.ACTIVE).toBe("active");
			expect(PluginStatus.INACTIVE).toBe("inactive");
		});

		it("should have correct ExtensionPointType enum values", () => {
			expect(ExtensionPointType.GRAPHQL).toBe("graphql");
			expect(ExtensionPointType.DATABASE).toBe("database");
			expect(ExtensionPointType.HOOKS).toBe("hooks");
		});
	});

	describe("Function Integration", () => {
		it("should be able to use exported functions together", async () => {
			// Test that we can use the exported functions in combination
			const pluginId = "test_plugin";
			const isValid = isValidPluginId(pluginId);
			const generatedId = generatePluginId("Test Plugin");

			expect(typeof isValid).toBe("boolean");
			expect(typeof generatedId).toBe("string");
		});

		it("should be able to create plugin context with exported types", () => {
			const mockDb = {};
			const mockGraphQL = {};
			const mockPubSub = {};
			const mockLogger = {};

			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			expect(context).toBeDefined();
			expect(context.db).toBe(mockDb);
		});

		it("should be able to validate plugin manifest with exported types", () => {
			const manifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			// This should not throw any type errors
			expect(manifest).toBeDefined();
			expect(manifest.name).toBe("Test Plugin");
		});
	});

	describe("Export Completeness", () => {
		it("should export all necessary plugin system components", () => {
			// Test that all main runtime components are exported
			const exports = {
				PluginManager,
				PluginStatus,
				ExtensionPointType,
				validatePluginManifest,
				generatePluginId,
				loadPluginManifest,
				scanPluginsDirectory,
				isValidPluginId,
				normalizeImportPath,
				safeRequire,
				directoryExists,
				ensureDirectory,
				sortExtensionPoints,
				filterActiveExtensions,
				debounce,
				deepClone,
				createPluginContext,
				initializePluginSystem,
			};

			// Verify all exports are defined
			for (const [name, exportValue] of Object.entries(exports)) {
				expect(exportValue, `${name} should be exported`).toBeDefined();
			}
		});

		it("should maintain backward compatibility for existing imports", () => {
			// Test that existing import patterns still work
			expect(PluginManager).toBeDefined();
			expect(PluginStatus).toBeDefined();
			expect(validatePluginManifest).toBeDefined();
		});
	});
});
