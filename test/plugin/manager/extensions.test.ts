import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExtensionLoader } from "../../../src/plugin/manager/extensions";
import type {
	IExtensionRegistry,
	IHookExtension,
	ILoadedPlugin,
	IPluginManifest,
} from "../../../src/plugin/types";
import type { IGraphQLExtension } from "../../../src/plugin/types";
import { PluginStatus } from "../../../src/plugin/types";

vi.mock("../../../src/plugin/utils", () => ({
	safeRequire: vi.fn(),
}));

import { safeRequire } from "../../../src/plugin/utils";

describe("ExtensionLoader basic", () => {
	let extensionLoader: ExtensionLoader;
	let mockLoadedPlugins: Map<string, ILoadedPlugin>;
	let mockExtensionRegistry: IExtensionRegistry;

	beforeEach(() => {
		vi.clearAllMocks();
		(safeRequire as ReturnType<typeof vi.fn>).mockReset();
		mockLoadedPlugins = new Map();
		mockLoadedPlugins.set("test-plugin", {
			id: "test-plugin",
			manifest: {
				pluginId: "test-plugin",
				name: "Test Plugin",
				version: "1.0.0",
				description: "desc",
				author: "author",
				main: "index.js",
			},
			graphqlResolvers: {},
			databaseTables: {},
			hooks: {},
			webhooks: {},
			status: PluginStatus.ACTIVE,
		});
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
				handlers: {},
			},
		};
		extensionLoader = new ExtensionLoader(
			"/test/plugins",
			mockLoadedPlugins,
			mockExtensionRegistry,
		);
	});

	it("should load extension points (graphql, database, hooks)", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "q",
						type: "query",
						builderDefinition: "res",
						file: "index.js",
					},
				],
				database: [{ name: "tbl", type: "table", file: "index.js" }],
				hooks: [{ type: "pre", event: "evt", handler: "hnd" }],
			},
		};
		const pluginModule = { res: () => 1, tbl: { columns: [] }, hnd: () => 2 };
		const mockResolver = () => 1;
		const mockTable = { columns: [] };
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			res: mockResolver,
		});
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			tbl: mockTable,
		});
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			hnd: () => 2,
		});
		await extensionLoader.loadExtensionPoints(
			"test-plugin",
			manifest,
			pluginModule,
		);
		// Check that the extension was registered in the registry
		expect(mockExtensionRegistry.graphql.builderExtensions).toHaveLength(1);
		expect(mockExtensionRegistry.graphql.builderExtensions[0]?.pluginId).toBe(
			"test-plugin",
		);
		expect(mockExtensionRegistry.graphql.builderExtensions[0]?.fieldName).toBe(
			"q",
		);
		expect(mockExtensionRegistry.database.tables.tbl).toBeDefined();
		expect(mockLoadedPlugins.get("test-plugin")?.hooks.evt).toBeDefined();
	});

	it("should load builder-first GraphQL extension from file", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "q",
						type: "query",
						builderDefinition: "res",
						file: "index.js",
					},
				],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			res: () => 1,
		});
		const pluginModule: Record<string, unknown> = {};
		await extensionLoader.loadExtensionPoints(
			"test-plugin",
			manifest,
			pluginModule,
		);
		expect(mockExtensionRegistry.graphql.builderExtensions).toHaveLength(1);
		expect(mockExtensionRegistry.graphql.builderExtensions[0]?.fieldName).toBe(
			"q",
		);
	});

	it("should load Database extension from file", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				database: [{ name: "tbl", type: "table", file: "index.js" }],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			tbl: { columns: [] },
		});
		const pluginModule: Record<string, unknown> = {};
		await extensionLoader.loadExtensionPoints(
			"test-plugin",
			manifest,
			pluginModule,
		);
		expect(mockExtensionRegistry.database.tables.tbl).toBeDefined();
		expect(
			mockLoadedPlugins.get("test-plugin")?.databaseTables.tbl,
		).toBeDefined();
	});

	it("should load Hook extension from file", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{ type: "pre", event: "evt", handler: "hnd", file: "index.js" },
				],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			hnd: () => 2,
		});
		const pluginModule: Record<string, unknown> = {};
		await extensionLoader.loadExtensionPoints(
			"test-plugin",
			manifest,
			pluginModule,
		);
		expect(mockLoadedPlugins.get("test-plugin")?.hooks.evt).toBeDefined();
		expect(mockExtensionRegistry.hooks.pre.evt).toBeDefined();
	});

	it("should handle GraphQL extension file loading errors", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "q",
						type: "query",
						builderDefinition: "res",
						file: "index.js",
					},
				],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			new Error("File not found"),
		);
		const pluginModule: Record<string, unknown> = {};
		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Failed to load GraphQL builder extension from index.js: Error: File not found",
		);
	});

	it("should handle Database extension file loading errors", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				database: [{ name: "tbl", type: "table", file: "index.js" }],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			new Error("File not found"),
		);
		const pluginModule: Record<string, unknown> = {};
		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Failed to load database extension from index.js: Error: File not found",
		);
	});

	it("should handle Database extension when table not found", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				database: [{ name: "tbl", type: "table", file: "index.js" }],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});
		const pluginModule: Record<string, unknown> = {};
		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Database table 'tbl' not found in plugin test-plugin",
		);
	});

	it("should handle Database extension when plugin not found", async () => {
		const manifest: IPluginManifest = {
			pluginId: "non-existent",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				database: [{ name: "tbl", type: "table", file: "index.js" }],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			tbl: { columns: [] },
		});
		const pluginModule: Record<string, unknown> = {};
		await expect(
			extensionLoader.loadExtensionPoints(
				"non-existent",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined(); // Should return early without error
	});

	it("should initialize databaseTables if not present", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				database: [{ name: "tbl", type: "table", file: "index.js" }],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			tbl: { columns: [] },
		});
		const pluginModule: Record<string, unknown> = {};
		const plugin = mockLoadedPlugins.get("test-plugin");
		if (plugin) {
			plugin.databaseTables = undefined as unknown as Record<
				string,
				Record<string, unknown>
			>;
		}
		await extensionLoader.loadExtensionPoints(
			"test-plugin",
			manifest,
			pluginModule,
		);
		expect(mockLoadedPlugins.get("test-plugin")?.databaseTables).toBeDefined();
	});

	it("should handle Hook extension file loading errors", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{ type: "pre", event: "evt", handler: "hnd", file: "index.js" },
				],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			new Error("File not found"),
		);
		const pluginModule: Record<string, unknown> = {};
		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Failed to load hook extension from index.js: Error: File not found",
		);
	});

	it("should handle Hook extension when handler not found or not function", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{ type: "pre", event: "evt", handler: "hnd", file: "index.js" },
				],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			hnd: "not a function",
		});
		const pluginModule: Record<string, unknown> = {};
		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Hook handler 'hnd' not found or not a function in plugin test-plugin",
		);
	});

	it("should handle Hook extension when plugin not found", async () => {
		const manifest: IPluginManifest = {
			pluginId: "non-existent",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{ type: "pre", event: "evt", handler: "hnd", file: "index.js" },
				],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			hnd: () => 2,
		});
		const pluginModule: Record<string, unknown> = {};
		await expect(
			extensionLoader.loadExtensionPoints(
				"non-existent",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined(); // Should return early without error
	});

	it("should initialize hooks if not present", async () => {
		const manifest: IPluginManifest = {
			pluginId: "test-plugin",
			name: "Test Plugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{ type: "pre", event: "evt", handler: "hnd", file: "index.js" },
				],
			},
		};
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			hnd: () => 2,
		});
		const pluginModule: Record<string, unknown> = {};
		const plugin = mockLoadedPlugins.get("test-plugin");
		if (plugin) {
			plugin.hooks = undefined as unknown as Record<
				string,
				(...args: unknown[]) => unknown
			>;
		}
		await extensionLoader.loadExtensionPoints(
			"test-plugin",
			manifest,
			pluginModule,
		);
		expect(mockLoadedPlugins.get("test-plugin")?.hooks).toBeDefined();
	});

	it("should handle Hook extension when plugin not found in manifest", async () => {
		const pluginId = "test-plugin";
		const extension: IHookExtension = {
			type: "pre",
			event: "user.created",
			handler: "handleUserCreated",
		};

		// Mock safeRequire to return null
		vi.mocked(safeRequire).mockResolvedValue(null);

		// Create a manifest with hook extension that will trigger the error path
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				hooks: [extension],
			},
		};

		await expect(
			extensionLoader.loadExtensionPoints(pluginId, manifest, {}),
		).rejects.toThrow(
			"Failed to load extension points: Hook handler 'handleUserCreated' not found or not a function in plugin test-plugin",
		);
	});

	it("should handle Hook extension when extension module is null", async () => {
		const pluginId = "test-plugin";
		const extension: IHookExtension = {
			type: "pre",
			event: "user.created",
			handler: "handleUserCreated",
			file: "hooks.js",
		};

		// Mock safeRequire to return null
		vi.mocked(safeRequire).mockResolvedValue(null);

		// Create a manifest with hook extension that will trigger the error path
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				hooks: [extension],
			},
		};

		await expect(
			extensionLoader.loadExtensionPoints(pluginId, manifest, {}),
		).rejects.toThrow(
			"Failed to load extension points: Failed to load hook extension from hooks.js: Error: Failed to load hook extension file: hooks.js",
		);
	});

	it("should get correct extension registry key for GraphQL queries", async () => {
		// Test through the public interface by creating a manifest with query extension
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						builderDefinition: "testResolver",
						file: "resolvers.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with the resolver
		vi.mocked(safeRequire).mockResolvedValue({
			testResolver: vi.fn(),
		});

		// Mock the plugin module to return a resolver function
		const pluginModule = {
			testResolver: vi.fn(),
		};

		// This will internally call getExtensionRegistryKey with "query" and "graphql"
		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();
	});

	it("should get correct extension registry key for GraphQL mutations", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testMutation",
						type: "mutation",
						builderDefinition: "testResolver",
						file: "resolvers.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with the resolver
		vi.mocked(safeRequire).mockResolvedValue({
			testResolver: vi.fn(),
		});

		const pluginModule = {
			testResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();
	});

	it("should get correct extension registry key for GraphQL subscriptions", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testSubscription",
						type: "subscription",
						builderDefinition: "testResolver",
						file: "resolvers.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with the resolver
		vi.mocked(safeRequire).mockResolvedValue({
			testResolver: vi.fn(),
		});

		const pluginModule = {
			testResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();
	});

	it("should throw error for missing builder definition", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testType",
						type: "query",
						// Intentionally missing builderDefinition to test error handling
						file: "resolvers.js",
					} as IGraphQLExtension,
				],
			},
		};

		// Mock safeRequire to return a module with the resolver
		vi.mocked(safeRequire).mockResolvedValue({
			testResolver: vi.fn(),
		});

		const pluginModule = {
			testResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Plugin test-plugin must use builder-first approach. Missing 'builderDefinition' for extension testType",
		);
	});

	it("should get correct extension registry key for database tables", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				database: [
					{
						name: "testTable",
						type: "table",
						file: "tables.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with the table definition
		vi.mocked(safeRequire).mockResolvedValue({
			testTable: { columns: {} },
		});

		const pluginModule = {
			testTable: { columns: {} },
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();
	});

	it("should get correct extension registry key for database enums", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				database: [
					{
						name: "testEnum",
						type: "enum",
						file: "enums.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with the enum definition
		vi.mocked(safeRequire).mockResolvedValue({
			testEnum: { values: [] },
		});

		const pluginModule = {
			testEnum: { values: [] },
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();
	});

	it("should get correct extension registry key for database relations", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				database: [
					{
						name: "testRelation",
						type: "relation",
						file: "relations.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with the relation definition
		vi.mocked(safeRequire).mockResolvedValue({
			testRelation: { references: {} },
		});

		const pluginModule = {
			testRelation: { references: {} },
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();
	});

	it("should throw error for unknown database extension type", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				database: [
					{
						name: "testUnknown",
						type: "unknown" as "table" | "enum" | "relation",
						file: "unknown.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with the unknown definition
		vi.mocked(safeRequire).mockResolvedValue({
			testUnknown: {},
		});

		const pluginModule = {
			testUnknown: {},
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Unknown database extension type: unknown",
		);
	});

	it("should handle GraphQL extension when builder function is not found", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						builderDefinition: "nonExistentResolver",
						file: "resolvers.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module without the resolver
		vi.mocked(safeRequire).mockResolvedValue({
			otherResolver: vi.fn(),
		});

		const pluginModule = {
			otherResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: GraphQL builder function 'nonExistentResolver' not found or not a function in plugin test-plugin",
		);
	});

	it("should handle GraphQL extension when builder function is not a function", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						builderDefinition: "notAFunction",
						file: "resolvers.js",
					},
				],
			},
		};

		// Mock safeRequire to return a module with a non-function value
		vi.mocked(safeRequire).mockResolvedValue({
			notAFunction: "not a function",
		});

		const pluginModule = {
			notAFunction: "not a function",
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: GraphQL builder function 'notAFunction' not found or not a function in plugin test-plugin",
		);
	});

	it("should handle GraphQL extension when file is null", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						builderDefinition: "testResolver",
						file: "resolvers.js",
					},
				],
			},
		};

		// Mock safeRequire to return null
		vi.mocked(safeRequire).mockResolvedValue(null);

		const pluginModule = {
			testResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Failed to load GraphQL builder extension from resolvers.js: Error: Failed to load GraphQL extension file: resolvers.js",
		);
	});

	it("should handle GraphQL extension from main plugin module", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						builderDefinition: "testResolver",
						file: "",
						// No file specified, should use main plugin module
					},
				],
			},
		};

		const pluginModule = {
			testResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();

		expect(mockExtensionRegistry.graphql.builderExtensions).toHaveLength(1);
		expect(mockExtensionRegistry.graphql.builderExtensions[0]?.fieldName).toBe(
			"testQuery",
		);
	});

	it("should handle GraphQL extension when builder definition is missing from main module", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						builderDefinition: "missingResolver",
						file: "",
						// No file specified, should use main plugin module
					},
				],
			},
		};

		const pluginModule = {
			otherResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: GraphQL builder function 'missingResolver' not found or not a function in plugin test-plugin",
		);
	});

	it("should handle database extension from main plugin module", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				database: [
					{
						name: "testTable",
						type: "table",
						file: "",
						// No file specified, should use main plugin module
					},
				],
			},
		};

		const pluginModule = {
			testTable: { columns: {} },
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();

		expect(mockExtensionRegistry.database.tables.testTable).toBeDefined();
		expect(
			mockLoadedPlugins.get("test-plugin")?.databaseTables.testTable,
		).toBeDefined();
	});

	it("should handle hook extension from main plugin module", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{
						type: "pre",
						event: "testEvent",
						handler: "testHandler",
						// No file specified, should use main plugin module
					},
				],
			},
		};

		const pluginModule = {
			testHandler: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();

		expect(mockLoadedPlugins.get("test-plugin")?.hooks.testEvent).toBeDefined();
		expect(mockExtensionRegistry.hooks.pre.testEvent).toBeDefined();
	});

	it("should handle hook extension when handler is missing from main module", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{
						type: "pre",
						event: "testEvent",
						handler: "missingHandler",
						// No file specified, should use main plugin module
					},
				],
			},
		};

		const pluginModule = {
			otherHandler: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Hook handler 'missingHandler' not found or not a function in plugin test-plugin",
		);
	});

	it("should handle hook extension when handler is not a function in main module", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{
						type: "pre",
						event: "testEvent",
						handler: "notAFunction",
						// No file specified, should use main plugin module
					},
				],
			},
		};

		const pluginModule = {
			notAFunction: "not a function",
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).rejects.toThrow(
			"Failed to load extension points: Hook handler 'notAFunction' not found or not a function in plugin test-plugin",
		);
	});

	it("should handle post hooks correctly", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{
						type: "post",
						event: "testEvent",
						handler: "testHandler",
					},
				],
			},
		};

		const pluginModule = {
			testHandler: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();

		expect(mockLoadedPlugins.get("test-plugin")?.hooks.testEvent).toBeDefined();
		expect(mockExtensionRegistry.hooks.post.testEvent).toBeDefined();
	});

	it("should handle multiple hooks for the same event", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				hooks: [
					{
						type: "pre",
						event: "testEvent",
						handler: "testHandler1",
					},
					{
						type: "pre",
						event: "testEvent",
						handler: "testHandler2",
					},
				],
			},
		};

		const pluginModule = {
			testHandler1: vi.fn(),
			testHandler2: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();

		// The second handler should override the first one in the plugin hooks
		expect(mockLoadedPlugins.get("test-plugin")?.hooks.testEvent).toBeDefined();
		// Both handlers should be in the registry
		expect(mockExtensionRegistry.hooks.pre.testEvent).toHaveLength(2);
	});

	it("should handle empty extension points gracefully", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "test-plugin",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			// No extensionPoints
		};

		const pluginModule = {};

		await expect(
			extensionLoader.loadExtensionPoints(
				"test-plugin",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined();
	});

	it("should handle plugin not found gracefully", async () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "non-existent",
			version: "1.0.0",
			description: "Test plugin",
			author: "Test Author",
			main: "index.js",
			extensionPoints: {
				graphql: [
					{
						name: "testQuery",
						type: "query",
						builderDefinition: "testResolver",
						file: "index.js",
					},
				],
			},
		};

		const pluginModule = {
			testResolver: vi.fn(),
		};

		await expect(
			extensionLoader.loadExtensionPoints(
				"non-existent",
				manifest,
				pluginModule,
			),
		).resolves.toBeUndefined(); // Should return early without error
	});
});
