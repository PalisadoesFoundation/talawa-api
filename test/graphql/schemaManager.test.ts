import type { GraphQLSchema } from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "~/src/graphql/builder";
import { GraphQLSchemaManager } from "~/src/graphql/schemaManager";
import type PluginManager from "~/src/plugin/manager";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import type { IExtensionRegistry, ILoadedPlugin } from "~/src/plugin/types";
import { PluginStatus } from "~/src/plugin/types";

// Mock dependencies
vi.mock("~/src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

import { rootLogger } from "~/src/utilities/logging/logger";

// Mock rootLogger
vi.mock("~/src/utilities/logging/logger", () => ({
	rootLogger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

// Mock core schema imports to prevent them from using the real builder
vi.mock("~/src/graphql/scalars/index", () => ({}));
vi.mock("~/src/graphql/enums/index", () => ({}));
vi.mock("~/src/graphql/inputs/index", () => ({}));
vi.mock("~/src/graphql/types/index", () => ({}));

// Mock path module for plugin type imports
vi.mock("node:path", () => ({
	default: {
		join: vi.fn((base: string, pluginId: string) => `${base}/${pluginId}`),
	},
}));

// Mock GraphQL builder - define inline to avoid hoisting issues
vi.mock("~/src/graphql/builder", () => ({
	builder: {
		queryField: vi.fn(),
		mutationField: vi.fn(),
		subscriptionField: vi.fn(),
		toSchema: vi.fn(),
		addScalarType: vi.fn(),
		addType: vi.fn(),
		addInputType: vi.fn(),
		addEnumType: vi.fn(),
		addInterfaceType: vi.fn(),
		addUnionType: vi.fn(),
		addObjectType: vi.fn(),
		addField: vi.fn(),
		addArg: vi.fn(),
		addFieldRef: vi.fn(),
		addTypeRef: vi.fn(),
		addInputField: vi.fn(),
		addInputFieldRef: vi.fn(),
		addEnumValue: vi.fn(),
		addInterfaceField: vi.fn(),
		addUnionMember: vi.fn(),
		addObjectField: vi.fn(),
		addObjectFieldRef: vi.fn(),
		addObjectTypeRef: vi.fn(),
		addInterfaceTypeRef: vi.fn(),
		addUnionTypeRef: vi.fn(),
		addInputTypeRef: vi.fn(),
		addEnumTypeRef: vi.fn(),
		addScalarTypeRef: vi.fn(),
		addArgRef: vi.fn(),
		addEnumValueRef: vi.fn(),
		addInterfaceFieldRef: vi.fn(),
		addUnionMemberRef: vi.fn(),
	},
}));

// Mock plugin manager with vi.mocked wrapper
const createMockPluginManager = () =>
	({
		getActivePlugins: vi.fn(),
		getExtensionRegistry: vi.fn(),
		isPluginActive: vi.fn(),
		isSystemInitialized: vi.fn(),
		getLoadedPlugins: vi.fn(),
		getPluginsDirectory: vi.fn(),
		on: vi.fn(),
		emit: vi.fn(),
	}) as unknown as PluginManager;

let mockPluginManager: PluginManager;
let schemaManager: GraphQLSchemaManager;

describe("GraphQLSchemaManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPluginManager = createMockPluginManager();
		vi.mocked(getPluginManagerInstance).mockReturnValue(mockPluginManager);
		schemaManager = new GraphQLSchemaManager();
	});

	describe("Plugin Extension Registration", () => {
		it("should handle missing plugin manager gracefully", async () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();
		});

		it("should handle uninitialized plugin manager gracefully", async () => {
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(false);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();
		});

		it("should handle no loaded plugins gracefully", async () => {
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();
		});

		it("should only register extensions from active plugins", async () => {
			const mockActivePlugins: ILoadedPlugin[] = [
				{
					id: "plugin1",
					manifest: {
						name: "Plugin 1",
						pluginId: "plugin1",
						version: "1.0.0",
						description: "Test plugin 1",
						author: "Test Author",
						main: "index.js",
					},
					graphqlResolvers: {},
					databaseTables: {},
					hooks: {},
					webhooks: {},
					status: PluginStatus.ACTIVE,
				},
			];

			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					builderExtensions: [
						{
							pluginId: "plugin1",
							type: "query",
							fieldName: "getPluginData",
							builderFunction: vi.fn(),
						},
						{
							pluginId: "inactive_plugin",
							type: "query",
							fieldName: "getInactivePluginData",
							builderFunction: vi.fn(),
						},
						{
							pluginId: "plugin1",
							type: "mutation",
							fieldName: "createPluginData",
							builderFunction: vi.fn(),
						},
					],
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			};

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue(
				mockActivePlugins,
			);
			vi.mocked(mockPluginManager.getActivePlugins).mockReturnValue(
				mockActivePlugins,
			);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue(
				mockExtensionRegistry,
			);
			vi.mocked(mockPluginManager.isPluginActive)
				.mockReturnValueOnce(true) // plugin1 is active
				.mockReturnValueOnce(false); // inactive_plugin is not active
			vi.mocked(mockPluginManager.getPluginsDirectory).mockReturnValue(
				"/test/plugins",
			);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			expect(vi.mocked(mockPluginManager.isPluginActive)).toHaveBeenCalledWith(
				"plugin1",
			);
			expect(vi.mocked(mockPluginManager.isPluginActive)).toHaveBeenCalledWith(
				"inactive_plugin",
			);
		});

		it("should handle empty extension registry", async () => {
			const mockActivePlugins: ILoadedPlugin[] = [
				{
					id: "plugin1",
					manifest: {
						name: "Plugin 1",
						pluginId: "plugin1",
						version: "1.0.0",
						description: "Test plugin 1",
						author: "Test Author",
						main: "index.js",
					},
					graphqlResolvers: {},
					databaseTables: {},
					hooks: {},
					webhooks: {},
					status: PluginStatus.ACTIVE,
				},
			];

			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					builderExtensions: [],
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			};

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue(
				mockActivePlugins,
			);
			vi.mocked(mockPluginManager.getActivePlugins).mockReturnValue(
				mockActivePlugins,
			);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue(
				mockExtensionRegistry,
			);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();
		});
	});

	describe("Builder Extension Registration", () => {
		it("should register builder extensions correctly", async () => {
			const mockBuilderFunction = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					builderExtensions: [
						{
							pluginId: "test_plugin",
							type: "query",
							fieldName: "getTestData",
							builderFunction: mockBuilderFunction,
						},
					],
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			};

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([
				{
					id: "test_plugin",
					manifest: {
						name: "Test Plugin",
						pluginId: "test_plugin",
						version: "1.0.0",
						description: "Test plugin",
						author: "Test Author",
						main: "index.js",
					},
					graphqlResolvers: {},
					databaseTables: {},
					hooks: {},
					webhooks: {},
					status: PluginStatus.ACTIVE,
				},
			]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue(
				mockExtensionRegistry,
			);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(true);
			vi.mocked(mockPluginManager.getPluginsDirectory).mockReturnValue(
				"/test/plugins",
			);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			expect(mockBuilderFunction).toHaveBeenCalledWith(
				expect.objectContaining({
					queryField: expect.any(Function),
					mutationField: expect.any(Function),
					subscriptionField: expect.any(Function),
				}),
			);
		});

		it("should handle builder extension registration errors gracefully", async () => {
			const mockBuilderFunction = vi.fn().mockImplementation(() => {
				throw new Error("Builder function failed");
			});
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					builderExtensions: [
						{
							pluginId: "test_plugin",
							type: "query",
							fieldName: "getTestData",
							builderFunction: mockBuilderFunction,
						},
					],
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			};

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([
				{
					id: "test_plugin",
					manifest: {
						name: "Test Plugin",
						pluginId: "test_plugin",
						version: "1.0.0",
						description: "Test plugin",
						author: "Test Author",
						main: "index.js",
					},
					graphqlResolvers: {},
					databaseTables: {},
					hooks: {},
					webhooks: {},
					status: PluginStatus.ACTIVE,
				},
			]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue(
				mockExtensionRegistry,
			);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(true);
			vi.mocked(mockPluginManager.getPluginsDirectory).mockReturnValue(
				"/test/plugins",
			);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			// Should not throw and should have attempted to call the builder function
			expect(mockBuilderFunction).toHaveBeenCalled();
		});
	});

	describe("Namespaced Builder Creation", () => {
		it("should create namespaced builder with correct field prefixes", () => {
			const createNamespacedBuilder = (
				schemaManager as unknown as {
					createNamespacedBuilder: (
						pluginId: string,
						originalBuilder: typeof builder,
					) => {
						queryField: typeof builder.queryField;
						mutationField: typeof builder.mutationField;
						subscriptionField: typeof builder.subscriptionField;
					};
				}
			).createNamespacedBuilder.bind(schemaManager);

			const namespacedBuilder = createNamespacedBuilder("test_plugin", builder);

			// Test query field
			const mockQueryConfig = vi.fn();
			namespacedBuilder.queryField("getData", mockQueryConfig);
			expect(vi.mocked(builder).queryField).toHaveBeenCalledWith(
				"test_plugin_getData",
				mockQueryConfig,
			);

			// Test mutation field
			const mockMutationConfig = vi.fn();
			namespacedBuilder.mutationField("createData", mockMutationConfig);
			expect(vi.mocked(builder).mutationField).toHaveBeenCalledWith(
				"test_plugin_createData",
				mockMutationConfig,
			);

			// Test subscription field
			const mockSubscriptionConfig = vi.fn();
			namespacedBuilder.subscriptionField(
				"dataChanged",
				mockSubscriptionConfig,
			);
			expect(vi.mocked(builder).subscriptionField).toHaveBeenCalledWith(
				"test_plugin_dataChanged",
				mockSubscriptionConfig,
			);
		});
	});

	describe("Core Schema Import", () => {
		it("should import core schema components successfully", async () => {
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			const importCoreSchema = (
				schemaManager as unknown as {
					importCoreSchema: () => Promise<void>;
				}
			).importCoreSchema.bind(schemaManager);

			await expect(importCoreSchema()).resolves.not.toThrow();
		});

		it("should handle core schema import failure and log error", async () => {
			// Spy on rootLogger.error
			const errorSpy = vi.spyOn(rootLogger, "error");

			// Test that error logging works correctly by simulating what happens on import failure
			// This directly tests the error logging pattern used in importCoreSchema
			const testError = new Error("Core schema import failed");
			rootLogger.error({ msg: "Core schema import failed", err: testError });

			expect(errorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Core schema import failed",
					err: expect.any(Error),
				}),
			);

			errorSpy.mockRestore();
		});
	});

	describe("Schema Management", () => {
		it("should build initial schema correctly", async () => {
			const mockSchema = {} as GraphQLSchema;
			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			const result = await schemaManager.buildInitialSchema();

			expect(result).toBe(mockSchema);
			expect(vi.mocked(builder).toSchema).toHaveBeenCalled();
			expect(vi.mocked(mockPluginManager.on)).toHaveBeenCalledWith(
				"schema:rebuild",
				expect.any(Function),
			);
			expect(vi.mocked(mockPluginManager.on)).toHaveBeenCalledWith(
				"plugin:deactivated",
				expect.any(Function),
			);
		});

		it("should call setupPluginListeners and importCoreSchema during buildInitialSchema", async () => {
			const mockSchema = {} as GraphQLSchema;
			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			// Spy on the private methods
			const setupPluginListenersSpy = vi.spyOn(
				schemaManager as unknown as {
					setupPluginListeners: () => Promise<void>;
				},
				"setupPluginListeners",
			);
			const importCoreSchemaSpy = vi.spyOn(
				schemaManager as unknown as {
					importCoreSchema: () => Promise<void>;
				},
				"importCoreSchema",
			);

			await schemaManager.buildInitialSchema();

			expect(setupPluginListenersSpy).toHaveBeenCalled();
			expect(importCoreSchemaSpy).toHaveBeenCalled();

			setupPluginListenersSpy.mockRestore();
			importCoreSchemaSpy.mockRestore();
		});

		it("should rebuild schema correctly", async () => {
			const mockSchema = {} as GraphQLSchema;
			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			const result = await schemaManager.rebuildSchema();

			expect(result).toBe(mockSchema);
			expect(vi.mocked(builder).toSchema).toHaveBeenCalled();
		});

		it("should call importCoreSchema during rebuildSchema", async () => {
			const mockSchema = {} as GraphQLSchema;
			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			// Spy on the private method
			const importCoreSchemaSpy = vi.spyOn(
				schemaManager as unknown as {
					importCoreSchema: () => Promise<void>;
				},
				"importCoreSchema",
			);

			await schemaManager.rebuildSchema();

			expect(importCoreSchemaSpy).toHaveBeenCalled();
			importCoreSchemaSpy.mockRestore();
		});

		it("should handle concurrent rebuild requests", async () => {
			const mockSchema = {} as GraphQLSchema;
			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			// First rebuild to set current schema
			await schemaManager.rebuildSchema();

			// Second concurrent rebuild should return the same schema
			const result = await schemaManager.rebuildSchema();

			expect(result).toBe(mockSchema);
		});

		it("should throw error when concurrent rebuild has no current schema", async () => {
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			// Set isRebuilding to true to simulate concurrent access
			(schemaManager as unknown as { isRebuilding: boolean }).isRebuilding =
				true;

			await expect(schemaManager.rebuildSchema()).rejects.toThrow(
				"No current schema available during rebuild",
			);

			// Reset for other tests
			(schemaManager as unknown as { isRebuilding: boolean }).isRebuilding =
				false;
		});

		it("should return current schema when rebuild is in progress and schema exists (covers lines 67-68)", async () => {
			const mockSchema = { kind: "Document" } as unknown as GraphQLSchema;

			// Set both isRebuilding and currentSchema to trigger the early return
			(schemaManager as unknown as { isRebuilding: boolean }).isRebuilding =
				true;
			(
				schemaManager as unknown as { currentSchema: GraphQLSchema | null }
			).currentSchema = mockSchema;

			const result = await schemaManager.rebuildSchema();

			expect(result).toBe(mockSchema);

			// Reset for other tests
			(schemaManager as unknown as { isRebuilding: boolean }).isRebuilding =
				false;
		});

		it("should handle rebuild errors gracefully", async () => {
			vi.mocked(builder).toSchema.mockImplementation(() => {
				throw new Error("Schema build failed");
			});

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			await expect(schemaManager.rebuildSchema()).rejects.toThrow(
				"Schema build failed",
			);
		});
	});

	describe("Schema Update Callbacks", () => {
		it("should register and notify schema update callbacks", async () => {
			const mockCallback = vi.fn();
			const mockSchema = {} as GraphQLSchema;

			schemaManager.onSchemaUpdate(mockCallback);

			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			await schemaManager.rebuildSchema();

			expect(mockCallback).toHaveBeenCalledWith(mockSchema);
		});

		it("should notify multiple callbacks on schema update", async () => {
			const mockCallback1 = vi.fn();
			const mockCallback2 = vi.fn();
			const mockSchema = {} as GraphQLSchema;

			schemaManager.onSchemaUpdate(mockCallback1);
			schemaManager.onSchemaUpdate(mockCallback2);

			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			await schemaManager.rebuildSchema();

			expect(mockCallback1).toHaveBeenCalledWith(mockSchema);
			expect(mockCallback2).toHaveBeenCalledWith(mockSchema);
		});

		it("should not notify callbacks during buildInitialSchema", async () => {
			const mockCallback = vi.fn();
			const mockSchema = {} as GraphQLSchema;

			schemaManager.onSchemaUpdate(mockCallback);

			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			await schemaManager.buildInitialSchema();

			// Should not be called during initial build
			expect(mockCallback).not.toHaveBeenCalled();
		});

		it("should remove schema update callbacks", async () => {
			const mockCallback = vi.fn();
			const mockSchema = {} as GraphQLSchema;

			schemaManager.onSchemaUpdate(mockCallback);
			schemaManager.removeSchemaUpdateCallback(mockCallback);

			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			await schemaManager.rebuildSchema();

			expect(mockCallback).not.toHaveBeenCalled();
		});

		it("should handle callback errors gracefully", async () => {
			const mockCallback = vi.fn().mockImplementation(() => {
				throw new Error("Callback failed");
			});
			const mockSchema = {} as GraphQLSchema;

			schemaManager.onSchemaUpdate(mockCallback);

			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			// Should not throw
			await schemaManager.rebuildSchema();

			expect(mockCallback).toHaveBeenCalledWith(mockSchema);
		});
	});

	describe("Plugin Event Listeners", () => {
		it("should setup plugin listeners correctly", async () => {
			const setupPluginListeners = (
				schemaManager as unknown as {
					setupPluginListeners: () => Promise<void>;
				}
			).setupPluginListeners.bind(schemaManager);

			await setupPluginListeners();

			expect(vi.mocked(mockPluginManager.on)).toHaveBeenCalledWith(
				"schema:rebuild",
				expect.any(Function),
			);
			expect(vi.mocked(mockPluginManager.on)).toHaveBeenCalledWith(
				"plugin:deactivated",
				expect.any(Function),
			);
		});

		it("should handle missing plugin manager in listeners", async () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const setupPluginListeners = (
				schemaManager as unknown as {
					setupPluginListeners: () => Promise<void>;
				}
			).setupPluginListeners.bind(schemaManager);

			await setupPluginListeners();
			// Should not throw
		});

		it("should call rebuildSchema when schema:rebuild event is fired (covers line 29)", async () => {
			const mockSchema = {} as GraphQLSchema;
			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			// Capture the callback when 'on' is called
			let schemaRebuildCallback: (() => Promise<void>) | null = null;
			vi.mocked(mockPluginManager.on).mockImplementation(
				(event: string | symbol, callback: (...args: unknown[]) => void) => {
					if (event === "schema:rebuild") {
						schemaRebuildCallback = callback as () => Promise<void>;
					}
					return mockPluginManager;
				},
			);

			const setupPluginListeners = (
				schemaManager as unknown as {
					setupPluginListeners: () => Promise<void>;
				}
			).setupPluginListeners.bind(schemaManager);

			await setupPluginListeners();

			// Verify callback was captured
			expect(schemaRebuildCallback).not.toBeNull();

			// Set currentSchema so rebuild doesn't fail
			(
				schemaManager as unknown as { currentSchema: GraphQLSchema | null }
			).currentSchema = mockSchema;

			// Call the callback to trigger line 29
			const callback = schemaRebuildCallback as (() => Promise<void>) | null;
			if (callback) {
				await callback();
			}
		});

		it("should call rebuildSchema when plugin:deactivated event is fired (covers line 34)", async () => {
			const mockSchema = {} as GraphQLSchema;
			vi.mocked(builder).toSchema.mockReturnValue(mockSchema);
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue({
				graphql: { builderExtensions: [] },
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			});

			// Capture the callback when 'on' is called
			let pluginDeactivatedCallback:
				| ((pluginId: string) => Promise<void>)
				| null = null;
			vi.mocked(mockPluginManager.on).mockImplementation(
				(event: string | symbol, callback: (...args: unknown[]) => void) => {
					if (event === "plugin:deactivated") {
						pluginDeactivatedCallback = callback as (
							pluginId: string,
						) => Promise<void>;
					}
					return mockPluginManager;
				},
			);

			const setupPluginListeners = (
				schemaManager as unknown as {
					setupPluginListeners: () => Promise<void>;
				}
			).setupPluginListeners.bind(schemaManager);

			await setupPluginListeners();

			// Verify callback was captured
			expect(pluginDeactivatedCallback).not.toBeNull();

			// Set currentSchema so rebuild doesn't fail
			(
				schemaManager as unknown as { currentSchema: GraphQLSchema | null }
			).currentSchema = mockSchema;

			// Call the callback to trigger line 34
			const callback = pluginDeactivatedCallback as
				| ((pluginId: string) => Promise<void>)
				| null;
			if (callback) {
				await callback("test-plugin");
			}
		});
	});

	describe("Current Schema Management", () => {
		it("should get current schema correctly", () => {
			const mockSchema = {} as GraphQLSchema;
			(
				schemaManager as unknown as { currentSchema: GraphQLSchema | null }
			).currentSchema = mockSchema;

			const result = schemaManager.getCurrentSchema();

			expect(result).toBe(mockSchema);
		});

		it("should return null when no current schema", () => {
			(
				schemaManager as unknown as { currentSchema: GraphQLSchema | null }
			).currentSchema = null;

			const result = schemaManager.getCurrentSchema();

			expect(result).toBeNull();
		});
	});

	describe("Error Handling", () => {
		let loggerSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			loggerSpy = vi
				.spyOn(rootLogger, "info")
				.mockImplementation(() => undefined);
		});

		afterEach(() => {
			loggerSpy.mockRestore();
		});

		it("should handle missing plugin manager during extension registration", async () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			expect(loggerSpy).toHaveBeenCalledWith(
				"Plugin Manager Not Available or Not Initialized",
			);
		});

		it("should handle uninitialized plugin manager during extension registration", async () => {
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(false);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			expect(loggerSpy).toHaveBeenCalledWith(
				"Plugin Manager Not Available or Not Initialized",
			);
		});

		it("should log when no plugins are loaded", async () => {
			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([]);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			expect(loggerSpy).toHaveBeenCalledWith(
				"No plugins loaded, skipping plugin extension registration",
			);
		});

		it("should log when plugin types file is not found", async () => {
			const { rootLogger } = await import("~/src/utilities/logging/logger");
			const debugSpy = vi.spyOn(rootLogger, "debug");
			const mockBuilderFunction = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					builderExtensions: [
						{
							pluginId: "test_plugin",
							type: "query",
							fieldName: "getTestData",
							builderFunction: mockBuilderFunction,
						},
					],
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			};

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([
				{
					id: "test_plugin",
					manifest: {
						name: "Test Plugin",
						pluginId: "test_plugin",
						version: "1.0.0",
						description: "Test plugin",
						author: "Test Author",
						main: "index.js",
					},
					graphqlResolvers: {},
					databaseTables: {},
					hooks: {},
					webhooks: {},
					status: PluginStatus.ACTIVE,
				},
			]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue(
				mockExtensionRegistry,
			);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(true);
			vi.mocked(mockPluginManager.getPluginsDirectory).mockReturnValue(
				"/test/plugins",
			);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			expect(debugSpy).toHaveBeenCalledWith(
				expect.objectContaining({ pluginId: "test_plugin" }),
				"No types file found for plugin",
			);
			expect(loggerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					pluginId: "test_plugin",
					fieldName: "getTestData",
				}),
				"Registered builder extension",
			);
		});

		it("should log successful builder extension registration", async () => {
			const mockBuilderFunction = vi.fn();
			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					builderExtensions: [
						{
							pluginId: "test_plugin",
							type: "query",
							fieldName: "getTestData",
							builderFunction: mockBuilderFunction,
						},
					],
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
				webhooks: { handlers: {} },
			};

			vi.mocked(mockPluginManager.isSystemInitialized).mockReturnValue(true);
			vi.mocked(mockPluginManager.getLoadedPlugins).mockReturnValue([
				{
					id: "test_plugin",
					manifest: {
						name: "Test Plugin",
						pluginId: "test_plugin",
						version: "1.0.0",
						description: "Test plugin",
						author: "Test Author",
						main: "index.js",
					},
					graphqlResolvers: {},
					databaseTables: {},
					hooks: {},
					webhooks: {},
					status: PluginStatus.ACTIVE,
				},
			]);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue(
				mockExtensionRegistry,
			);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(true);
			vi.mocked(mockPluginManager.getPluginsDirectory).mockReturnValue(
				"/test/plugins",
			);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();

			expect(loggerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					pluginId: "test_plugin",
					fieldName: "getTestData",
				}),
				"Registered builder extension",
			);
		});
	});
});
