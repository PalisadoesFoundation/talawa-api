import { describe, expect, it } from "vitest";
import {
	ExtensionPointType,
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
	PluginStatus,
} from "~/src/plugin/types";

describe("Plugin Types", () => {
	describe("PluginStatus Enum", () => {
		it("should have correct enum values", () => {
			expect(PluginStatus.ACTIVE).toBe("active");
			expect(PluginStatus.INACTIVE).toBe("inactive");
			expect(PluginStatus.ERROR).toBe("error");
			expect(PluginStatus.LOADING).toBe("loading");
		});

		it("should contain all expected values", () => {
			const values = Object.values(PluginStatus);
			expect(values).toContain("active");
			expect(values).toContain("inactive");
			expect(values).toContain("error");
			expect(values).toContain("loading");
		});
	});

	describe("ExtensionPointType Enum", () => {
		it("should have correct enum values", () => {
			expect(ExtensionPointType.GRAPHQL).toBe("graphql");
			expect(ExtensionPointType.DATABASE).toBe("database");
			expect(ExtensionPointType.HOOKS).toBe("hooks");
		});

		it("should contain all expected values", () => {
			const values = Object.values(ExtensionPointType);
			expect(values).toContain("graphql");
			expect(values).toContain("database");
			expect(values).toContain("hooks");
		});
	});

	describe("Interface Types", () => {
		it("should create valid IPluginManifest objects", () => {
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
			expect(manifest.version).toBe("1.0.0");
		});

		it("should create valid IGraphQLExtension objects", () => {
			const extension: IGraphQLExtension = {
				type: "query",
				name: "testQuery",
				file: "test.js",
				builderDefinition: "testResolver",
			};

			expect(extension.type).toBe("query");
			expect(extension.name).toBe("testQuery");
		});

		it("should create valid IDatabaseExtension objects", () => {
			const extension: IDatabaseExtension = {
				type: "table",
				name: "testTable",
				file: "test.js",
			};

			expect(extension.type).toBe("table");
			expect(extension.name).toBe("testTable");
		});

		it("should create valid IHookExtension objects", () => {
			const extension: IHookExtension = {
				type: "pre",
				event: "user:created",
				handler: "testHandler",
			};

			expect(extension.type).toBe("pre");
			expect(extension.event).toBe("user:created");
		});

		it("should create valid IExtensionPoints objects", () => {
			const extensionPoints: IExtensionPoints = {
				graphql: [
					{
						type: "query",
						name: "testQuery",
						file: "test.js",
						builderDefinition: "testResolver",
					},
				],
				database: [
					{
						type: "table",
						name: "testTable",
						file: "test.js",
					},
				],
			};

			expect(extensionPoints.graphql).toHaveLength(1);
			expect(extensionPoints.database).toHaveLength(1);
		});

		it("should create valid IPluginContext objects", () => {
			const context: IPluginContext = {
				db: {},
				graphql: {},
				pubsub: {},
				logger: {},
			};

			expect(context.db).toBeDefined();
			expect(context.graphql).toBeDefined();
		});

		it("should create valid IPluginLifecycle objects", () => {
			const lifecycle: IPluginLifecycle = {
				onLoad: async () => {},
				onActivate: async () => {},
			};

			expect(lifecycle.onLoad).toBeDefined();
			expect(lifecycle.onActivate).toBeDefined();
		});

		it("should create valid IPluginError objects", () => {
			const error: IPluginError = {
				pluginId: "test_plugin",
				error: new Error("Test error"),
				phase: "load",
				timestamp: new Date(),
			};

			expect(error.pluginId).toBe("test_plugin");
			expect(error.phase).toBe("load");
		});

		it("should create valid ILoadedPlugin objects", () => {
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

		it("should create valid IExtensionRegistry objects", () => {
			const registry: IExtensionRegistry = {
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
			};

			expect(registry.graphql).toBeDefined();
			expect(registry.database).toBeDefined();
			expect(registry.hooks).toBeDefined();
		});
	});
});
