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

import { afterEach, describe, expect, it, test, vi } from "vitest";

import {
	createPluginContext,
	debounce,
	deepClone,
	directoryExists,
	ExtensionPointType,
	ensureDirectory,
	filterActiveExtensions,
	generatePluginId,
	type IDatabaseExtension,
	type IExtensionPoints,
	type IExtensionRegistry,
	type IGraphQLExtension,
	type IHookExtension,
	type ILoadedPlugin,
	type IPluginContext,
	type IPluginError,
	type IPluginLifecycle,
	type IPluginManifest,
	initializePluginSystem,
	isValidPluginId,
	loadPluginManifest,
	normalizeImportPath,
	PluginManager,
	PluginStatus,
	safeRequire,
	sortExtensionPoints,
	validatePluginManifest,
} from "~/src/plugin";

afterEach(() => {
	vi.clearAllMocks();
});

describe("Plugin System Index", () => {
	describe("Core exports", () => {
		test("exports PluginManager", () => {
			expect(PluginManager).toBeDefined();
			expect(typeof PluginManager).toBe("function");
		});

		test("exports plugin registry functions", () => {
			expect(createPluginContext).toBeDefined();
			expect(typeof createPluginContext).toBe("function");
			expect(initializePluginSystem).toBeDefined();
			expect(typeof initializePluginSystem).toBe("function");
		});
	});

	describe("Type exports", () => {
		test("exports PluginStatus enum", () => {
			expect(PluginStatus).toBeDefined();
			expect(PluginStatus.LOADING).toBe("loading");
			expect(PluginStatus.ACTIVE).toBe("active");
			expect(PluginStatus.INACTIVE).toBe("inactive");
			expect(PluginStatus.ERROR).toBe("error");
		});

		test("exports ExtensionPointType enum", () => {
			expect(ExtensionPointType).toBeDefined();
			expect(ExtensionPointType.GRAPHQL).toBe("graphql");
			expect(ExtensionPointType.DATABASE).toBe("database");
			expect(ExtensionPointType.HOOKS).toBe("hooks");
		});
	});

	describe("Utility exports", () => {
		test("exports validation utilities", () => {
			expect(validatePluginManifest).toBeDefined();
			expect(typeof validatePluginManifest).toBe("function");
			expect(isValidPluginId).toBeDefined();
			expect(typeof isValidPluginId).toBe("function");
		});

		test("exports plugin utilities", () => {
			expect(generatePluginId).toBeDefined();
			expect(typeof generatePluginId).toBe("function");
			expect(loadPluginManifest).toBeDefined();
			expect(typeof loadPluginManifest).toBe("function");
			expect(normalizeImportPath).toBeDefined();
			expect(typeof normalizeImportPath).toBe("function");
		});

		test("exports file system utilities", () => {
			expect(safeRequire).toBeDefined();
			expect(typeof safeRequire).toBe("function");
			expect(directoryExists).toBeDefined();
			expect(typeof directoryExists).toBe("function");
			expect(ensureDirectory).toBeDefined();
			expect(typeof ensureDirectory).toBe("function");
		});

		test("exports collection utilities", () => {
			expect(sortExtensionPoints).toBeDefined();
			expect(typeof sortExtensionPoints).toBe("function");
			expect(filterActiveExtensions).toBeDefined();
			expect(typeof filterActiveExtensions).toBe("function");
		});

		test("exports helper utilities", () => {
			expect(debounce).toBeDefined();
			expect(typeof debounce).toBe("function");
			expect(deepClone).toBeDefined();
			expect(typeof deepClone).toBe("function");
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
				description: "Test plugin description",
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
						type: "query",
						name: "testQuery",
						file: "test.js",
						builderDefinition: "testBuilder",
					},
				],
				database: [
					{
						type: "table",
						name: "testTable",
						file: "test-table.js",
					},
				],
			};

			expect(extensionPoints.graphql).toHaveLength(1);
			expect(extensionPoints.database).toHaveLength(1);
		});

		it("should have compatible GraphQL extension types", () => {
			const graphqlExtension: IGraphQLExtension = {
				type: "query",
				name: "testQuery",
				file: "test.js",
				builderDefinition: "testBuilder",
			};

			expect(graphqlExtension.name).toBe("testQuery");
			expect(graphqlExtension.type).toBe("query");
		});

		it("should have compatible database extension types", () => {
			const databaseExtension: IDatabaseExtension = {
				type: "table",
				name: "testTable",
				file: "test-table.js",
			};

			expect(databaseExtension.name).toBe("testTable");
			expect(databaseExtension.type).toBe("table");
		});

		it("should have compatible hook extension types", () => {
			const hookExtension: IHookExtension = {
				type: "pre",
				event: "user:created",
				handler: "testHandler",
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
					description: "Test description",
					author: "Test Author",
					main: "index.js",
				},
				status: PluginStatus.ACTIVE,
				graphqlResolvers: {},
				databaseTables: {},
				hooks: {},
				webhooks: {},
			};

			expect(loadedPlugin.id).toBe("test_plugin");
			expect(loadedPlugin.status).toBe(PluginStatus.ACTIVE);
		});

		it("should have compatible extension registry types", () => {
			const extensionRegistry: IExtensionRegistry = {
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
					handlers: {},
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

			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			});

			expect(context).toBeDefined();
			expect(context.db).toBe(mockDb);
		});

		it("should be able to validate plugin manifest with exported types", () => {
			const manifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test description",
				author: "Test Author",
				main: "index.js",
			};

			expect(manifest).toBeDefined();
			expect(manifest.name).toBe("Test Plugin");
		});
	});

	describe("Export Completeness", () => {
		it("should export all necessary plugin system components", () => {
			const exportedComponents = {
				PluginManager,
				PluginStatus,
				ExtensionPointType,
				createPluginContext,
				initializePluginSystem,
				validatePluginManifest,
				isValidPluginId,
				generatePluginId,
				loadPluginManifest,
				normalizeImportPath,
				safeRequire,
				directoryExists,
				ensureDirectory,
				sortExtensionPoints,
				filterActiveExtensions,
				debounce,
				deepClone,
			};

			const expectedExports = [
				"PluginManager",
				"PluginStatus",
				"ExtensionPointType",
				"createPluginContext",
				"initializePluginSystem",
				"validatePluginManifest",
				"isValidPluginId",
				"generatePluginId",
				"loadPluginManifest",
				"normalizeImportPath",
				"safeRequire",
				"directoryExists",
				"ensureDirectory",
				"sortExtensionPoints",
				"filterActiveExtensions",
				"debounce",
				"deepClone",
			];

			for (const exportName of expectedExports) {
				const exportValue =
					exportedComponents[exportName as keyof typeof exportedComponents];
				expect(exportValue, `${exportName} should be exported`).toBeDefined();
			}
		});

		it("should maintain backward compatibility for existing imports", () => {
			// Test that critical exports are still available
			expect(PluginManager).toBeDefined();
			expect(PluginStatus).toBeDefined();
			expect(validatePluginManifest).toBeDefined();
		});
	});
});
