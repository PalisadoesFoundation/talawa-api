import { describe, expect, it } from "vitest";
import { ExtensionPointType, PluginStatus } from "~/src/plugin/types";
import type {
	IDatabaseClient,
	IDatabaseExtension,
	IDrawerExtension,
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
	IPluginMetrics,
	IPluginValidationResult,
	IRouteExtension,
	IUnifiedPlugin,
} from "~/src/plugin/types";

describe("Plugin Types", () => {
	describe("Enums", () => {
		describe("PluginStatus", () => {
			it("should have correct enum values", () => {
				expect(PluginStatus.ACTIVE).toBe("active");
				expect(PluginStatus.INACTIVE).toBe("inactive");
				expect(PluginStatus.ERROR).toBe("error");
				expect(PluginStatus.LOADING).toBe("loading");
			});

			it("should have all expected values", () => {
				const values = Object.values(PluginStatus);
				expect(values).toContain("active");
				expect(values).toContain("inactive");
				expect(values).toContain("error");
				expect(values).toContain("loading");
				expect(values).toHaveLength(4);
			});
		});

		describe("ExtensionPointType", () => {
			it("should have correct enum values", () => {
				expect(ExtensionPointType.GRAPHQL).toBe("graphql");
				expect(ExtensionPointType.DATABASE).toBe("database");
				expect(ExtensionPointType.HOOKS).toBe("hooks");
			});

			it("should have all expected values", () => {
				const values = Object.values(ExtensionPointType);
				expect(values).toContain("graphql");
				expect(values).toContain("database");
				expect(values).toContain("hooks");
				expect(values).toHaveLength(3);
			});
		});
	});

	describe("Interfaces", () => {
		describe("IPluginManifest", () => {
			it("should allow valid plugin manifest", () => {
				const manifest: IPluginManifest = {
					name: "Test Plugin",
					pluginId: "test_plugin",
					version: "1.0.0",
					description: "A test plugin",
					author: "Test Author",
					main: "index.ts",
					extensionPoints: {
						graphql: [
							{
								type: "query",
								name: "testQuery",
								file: "graphql/queries.ts",
								resolver: "testQuery",
							},
						],
					},
				};

				expect(manifest.name).toBe("Test Plugin");
				expect(manifest.pluginId).toBe("test_plugin");
				expect(manifest.version).toBe("1.0.0");
				expect(manifest.description).toBe("A test plugin");
				expect(manifest.author).toBe("Test Author");
				expect(manifest.main).toBe("index.ts");
				expect(manifest.extensionPoints?.graphql).toHaveLength(1);
			});

			it("should allow optional fields", () => {
				const manifest: IPluginManifest = {
					name: "Test Plugin",
					pluginId: "test_plugin",
					version: "1.0.0",
					description: "A test plugin",
					author: "Test Author",
					main: "index.ts",
					icon: "icon.png",
					homepage: "https://example.com",
					license: "MIT",
					tags: ["test", "example"],
					dependencies: {
						"@types/node": "^18.0.0",
					},
				};

				expect(manifest.icon).toBe("icon.png");
				expect(manifest.homepage).toBe("https://example.com");
				expect(manifest.license).toBe("MIT");
				expect(manifest.tags).toEqual(["test", "example"]);
				expect(manifest.dependencies).toEqual({
					"@types/node": "^18.0.0",
				});
			});
		});

		describe("IExtensionPoints", () => {
			it("should allow all extension point types", () => {
				const extensionPoints: IExtensionPoints = {
					graphql: [
						{
							type: "query",
							name: "testQuery",
							file: "graphql/queries.ts",
							resolver: "testQuery",
							description: "A test query",
						},
						{
							type: "mutation",
							name: "testMutation",
							file: "graphql/mutations.ts",
							resolver: "testMutation",
						},
						{
							type: "subscription",
							name: "testSubscription",
							file: "graphql/subscriptions.ts",
							resolver: "testSubscription",
						},
					],
					database: [
						{
							type: "table",
							name: "testTable",
							file: "database/tables.ts",
						},
						{
							type: "enum",
							name: "testEnum",
							file: "database/enums.ts",
						},
						{
							type: "relation",
							name: "testRelation",
							file: "database/relations.ts",
						},
					],
					hooks: [
						{
							type: "pre",
							event: "user:created",
							handler: "onUserCreated",
							file: "hooks/user.ts",
						},
						{
							type: "post",
							event: "user:updated",
							handler: "onUserUpdated",
						},
					],
				};

				expect(extensionPoints.graphql).toHaveLength(3);
				expect(extensionPoints.database).toHaveLength(3);
				expect(extensionPoints.hooks).toHaveLength(2);
			});
		});

		describe("IGraphQLExtension", () => {
			it("should validate GraphQL extension structure", () => {
				const graphqlExtension: IGraphQLExtension = {
					type: "query",
					name: "getUser",
					file: "graphql/queries.ts",
					resolver: "getUser",
					description: "Get user by ID",
				};

				expect(graphqlExtension.type).toBe("query");
				expect(graphqlExtension.name).toBe("getUser");
				expect(graphqlExtension.file).toBe("graphql/queries.ts");
				expect(graphqlExtension.resolver).toBe("getUser");
				expect(graphqlExtension.description).toBe("Get user by ID");
			});

			it("should allow all GraphQL operation types", () => {
				const query: IGraphQLExtension = {
					type: "query",
					name: "getData",
					file: "graphql/queries.ts",
					resolver: "getData",
				};

				const mutation: IGraphQLExtension = {
					type: "mutation",
					name: "createData",
					file: "graphql/mutations.ts",
					resolver: "createData",
				};

				const subscription: IGraphQLExtension = {
					type: "subscription",
					name: "dataChanged",
					file: "graphql/subscriptions.ts",
					resolver: "dataChanged",
				};

				expect(query.type).toBe("query");
				expect(mutation.type).toBe("mutation");
				expect(subscription.type).toBe("subscription");
			});
		});

		describe("IDatabaseExtension", () => {
			it("should validate database extension structure", () => {
				const databaseExtension: IDatabaseExtension = {
					type: "table",
					name: "users",
					file: "database/tables.ts",
				};

				expect(databaseExtension.type).toBe("table");
				expect(databaseExtension.name).toBe("users");
				expect(databaseExtension.file).toBe("database/tables.ts");
			});

			it("should allow all database extension types", () => {
				const table: IDatabaseExtension = {
					type: "table",
					name: "users",
					file: "database/tables.ts",
				};

				const enum_: IDatabaseExtension = {
					type: "enum",
					name: "UserStatus",
					file: "database/enums.ts",
				};

				const relation: IDatabaseExtension = {
					type: "relation",
					name: "userPosts",
					file: "database/relations.ts",
				};

				expect(table.type).toBe("table");
				expect(enum_.type).toBe("enum");
				expect(relation.type).toBe("relation");
			});
		});

		describe("IHookExtension", () => {
			it("should validate hook extension structure", () => {
				const hookExtension: IHookExtension = {
					type: "pre",
					event: "user:created",
					handler: "onUserCreated",
					file: "hooks/user.ts",
				};

				expect(hookExtension.type).toBe("pre");
				expect(hookExtension.event).toBe("user:created");
				expect(hookExtension.handler).toBe("onUserCreated");
				expect(hookExtension.file).toBe("hooks/user.ts");
			});

			it("should allow both pre and post hooks", () => {
				const preHook: IHookExtension = {
					type: "pre",
					event: "user:created",
					handler: "onUserCreated",
				};

				const postHook: IHookExtension = {
					type: "post",
					event: "user:updated",
					handler: "onUserUpdated",
				};

				expect(preHook.type).toBe("pre");
				expect(postHook.type).toBe("post");
			});
		});

		describe("ILoadedPlugin", () => {
			it("should validate loaded plugin structure", () => {
				const loadedPlugin: ILoadedPlugin = {
					id: "test_plugin",
					manifest: {
						name: "Test Plugin",
						pluginId: "test_plugin",
						version: "1.0.0",
						description: "A test plugin",
						author: "Test Author",
						main: "index.ts",
					},
					graphqlResolvers: {
						getUser: () => ({}),
					},
					databaseTables: {
						users: {
							id: { type: "uuid", primaryKey: true },
						},
					},
					hooks: {
						"user:created": () => ({}),
					},
					status: PluginStatus.ACTIVE,
				};

				expect(loadedPlugin.id).toBe("test_plugin");
				expect(loadedPlugin.manifest.name).toBe("Test Plugin");
				expect(loadedPlugin.status).toBe(PluginStatus.ACTIVE);
				expect(loadedPlugin.graphqlResolvers).toBeDefined();
				expect(loadedPlugin.databaseTables).toBeDefined();
				expect(loadedPlugin.hooks).toBeDefined();
			});

			it("should allow error status with error message", () => {
				const errorPlugin: ILoadedPlugin = {
					id: "error_plugin",
					manifest: {
						name: "Error Plugin",
						pluginId: "error_plugin",
						version: "1.0.0",
						description: "A plugin with error",
						author: "Test Author",
						main: "index.ts",
					},
					graphqlResolvers: {},
					databaseTables: {},
					hooks: {},
					status: PluginStatus.ERROR,
					errorMessage: "Failed to load plugin",
				};

				expect(errorPlugin.status).toBe(PluginStatus.ERROR);
				expect(errorPlugin.errorMessage).toBe("Failed to load plugin");
			});
		});

		describe("IExtensionRegistry", () => {
			it("should validate extension registry structure", () => {
				const registry: IExtensionRegistry = {
					graphql: {
						queries: {
							getUser: {
								pluginId: "test_plugin",
								resolver: () => ({}),
							},
						},
						mutations: {
							createUser: {
								pluginId: "test_plugin",
								resolver: () => ({}),
							},
						},
						subscriptions: {
							userChanged: {
								pluginId: "test_plugin",
								resolver: () => ({}),
							},
						},
						types: {
							User: {},
						},
					},
					database: {
						tables: {
							users: {},
						},
						enums: {
							UserStatus: {},
						},
						relations: {
							userPosts: {},
						},
					},
					hooks: {
						pre: {
							"user:created": [() => ({}), () => ({})],
						},
						post: {
							"user:updated": [() => ({})],
						},
					},
				};

				expect(registry.graphql.queries).toBeDefined();
				expect(registry.graphql.mutations).toBeDefined();
				expect(registry.graphql.subscriptions).toBeDefined();
				expect(registry.graphql.types).toBeDefined();
				expect(registry.database.tables).toBeDefined();
				expect(registry.database.enums).toBeDefined();
				expect(registry.database.relations).toBeDefined();
				expect(registry.hooks.pre).toBeDefined();
				expect(registry.hooks.post).toBeDefined();
			});
		});

		describe("IPluginContext", () => {
			it("should validate plugin context structure", () => {
				const context: IPluginContext = {
					db: {},
					graphql: {},
					pubsub: {},
					logger: {
						info: () => {},
						error: () => {},
						warn: () => {},
						debug: () => {},
					},
				};

				expect(context.db).toBeDefined();
				expect(context.graphql).toBeDefined();
				expect(context.pubsub).toBeDefined();
				expect(context.logger).toBeDefined();
			});
		});

		describe("IPluginDiscovery", () => {
			it("should validate plugin discovery interface", () => {
				const discovery: IPluginDiscovery = {
					scanDirectory: async () => ["plugin1", "plugin2"],
					validateManifest: () => true,
					loadManifest: async () => ({
						name: "Test Plugin",
						pluginId: "test_plugin",
						version: "1.0.0",
						description: "A test plugin",
						author: "Test Author",
						main: "index.ts",
					}),
				};

				expect(typeof discovery.scanDirectory).toBe("function");
				expect(typeof discovery.validateManifest).toBe("function");
				expect(typeof discovery.loadManifest).toBe("function");
			});
		});

		describe("IPluginLifecycle", () => {
			it("should validate plugin lifecycle interface", () => {
				const lifecycle: IPluginLifecycle = {
					onLoad: async () => {},
					onActivate: async () => {},
					onDeactivate: async () => {},
					onUnload: async () => {},
				};

				expect(typeof lifecycle.onLoad).toBe("function");
				expect(typeof lifecycle.onActivate).toBe("function");
				expect(typeof lifecycle.onDeactivate).toBe("function");
				expect(typeof lifecycle.onUnload).toBe("function");
			});

			it("should allow optional lifecycle methods", () => {
				const lifecycle: IPluginLifecycle = {
					onLoad: async () => {},
					// Other methods are optional
				};

				expect(typeof lifecycle.onLoad).toBe("function");
				expect(lifecycle.onActivate).toBeUndefined();
				expect(lifecycle.onDeactivate).toBeUndefined();
				expect(lifecycle.onUnload).toBeUndefined();
			});
		});

		describe("IPluginError", () => {
			it("should validate plugin error structure", () => {
				const error: IPluginError = {
					pluginId: "test_plugin",
					error: new Error("Test error"),
					phase: "load",
					timestamp: new Date(),
				};

				expect(error.pluginId).toBe("test_plugin");
				expect(error.error).toBeInstanceOf(Error);
				expect(error.phase).toBe("load");
				expect(error.timestamp).toBeInstanceOf(Date);
			});

			it("should allow all error phases", () => {
				const loadError: IPluginError = {
					pluginId: "test_plugin",
					error: new Error("Load error"),
					phase: "load",
					timestamp: new Date(),
				};

				const activateError: IPluginError = {
					pluginId: "test_plugin",
					error: new Error("Activate error"),
					phase: "activate",
					timestamp: new Date(),
				};

				const deactivateError: IPluginError = {
					pluginId: "test_plugin",
					error: new Error("Deactivate error"),
					phase: "deactivate",
					timestamp: new Date(),
				};

				const unloadError: IPluginError = {
					pluginId: "test_plugin",
					error: new Error("Unload error"),
					phase: "unload",
					timestamp: new Date(),
				};

				expect(loadError.phase).toBe("load");
				expect(activateError.phase).toBe("activate");
				expect(deactivateError.phase).toBe("deactivate");
				expect(unloadError.phase).toBe("unload");
			});
		});

		describe("IUnifiedPlugin", () => {
			it("should validate unified plugin structure", () => {
				const unifiedPlugin: IUnifiedPlugin = {
					id: "test_plugin",
					manifest: {
						name: "Test Plugin",
						pluginId: "test_plugin",
						version: "1.0.0",
						description: "A test plugin",
						author: "Test Author",
						main: "index.ts",
					},
					status: PluginStatus.ACTIVE,
					extensions: {
						api: {
							graphqlResolvers: {
								getUser: () => ({}),
							},
							databaseTables: {
								users: {},
							},
							hooks: {
								"user:created": () => ({}),
							},
						},
						admin: {
							components: {
								UserList: {},
							},
							routes: [
								{
									pluginId: "test_plugin",
									path: "/users",
									component: "UserList",
									exact: true,
									isAdmin: true,
									permissions: ["read:users"],
								},
							],
							drawer: [
								{
									pluginId: "test_plugin",
									label: "Users",
									icon: "users",
									path: "/users",
									isAdmin: true,
									permissions: ["read:users"],
									order: 1,
								},
							],
						},
					},
				};

				expect(unifiedPlugin.id).toBe("test_plugin");
				expect(unifiedPlugin.manifest.name).toBe("Test Plugin");
				expect(unifiedPlugin.status).toBe(PluginStatus.ACTIVE);
				expect(unifiedPlugin.extensions?.api?.graphqlResolvers).toBeDefined();
				expect(unifiedPlugin.extensions?.admin?.components).toBeDefined();
			});
		});

		describe("IPluginValidationResult", () => {
			it("should validate plugin validation result structure", () => {
				const validationResult: IPluginValidationResult = {
					isValid: false,
					errors: ["Missing required field: version"],
					warnings: ["Deprecated field: homepage"],
					missingFields: ["version"],
					invalidTypes: ["author"],
				};

				expect(validationResult.isValid).toBe(false);
				expect(validationResult.errors).toContain(
					"Missing required field: version",
				);
				expect(validationResult.warnings).toContain(
					"Deprecated field: homepage",
				);
				expect(validationResult.missingFields).toContain("version");
				expect(validationResult.invalidTypes).toContain("author");
			});
		});

		describe("IPluginMetrics", () => {
			it("should validate plugin metrics structure", () => {
				const metrics: IPluginMetrics = {
					pluginId: "test_plugin",
					loadTime: 150,
					activationTime: 75,
					memoryUsage: 1024,
					errorCount: 2,
					lastError: new Date(),
					performanceScore: 85.5,
				};

				expect(metrics.pluginId).toBe("test_plugin");
				expect(metrics.loadTime).toBe(150);
				expect(metrics.activationTime).toBe(75);
				expect(metrics.memoryUsage).toBe(1024);
				expect(metrics.errorCount).toBe(2);
				expect(metrics.lastError).toBeInstanceOf(Date);
				expect(metrics.performanceScore).toBe(85.5);
			});
		});

		describe("IRouteExtension", () => {
			it("should validate route extension structure", () => {
				const route: IRouteExtension = {
					pluginId: "test_plugin",
					path: "/users",
					component: "UserList",
					exact: true,
					isAdmin: true,
					permissions: ["read:users", "write:users"],
				};

				expect(route.pluginId).toBe("test_plugin");
				expect(route.path).toBe("/users");
				expect(route.component).toBe("UserList");
				expect(route.exact).toBe(true);
				expect(route.isAdmin).toBe(true);
				expect(route.permissions).toEqual(["read:users", "write:users"]);
			});
		});

		describe("IDrawerExtension", () => {
			it("should validate drawer extension structure", () => {
				const drawer: IDrawerExtension = {
					pluginId: "test_plugin",
					label: "Users",
					icon: "users",
					path: "/users",
					isAdmin: true,
					permissions: ["read:users"],
					order: 1,
				};

				expect(drawer.pluginId).toBe("test_plugin");
				expect(drawer.label).toBe("Users");
				expect(drawer.icon).toBe("users");
				expect(drawer.path).toBe("/users");
				expect(drawer.isAdmin).toBe(true);
				expect(drawer.permissions).toEqual(["read:users"]);
				expect(drawer.order).toBe(1);
			});
		});

		describe("IDatabaseClient", () => {
			it("should validate database client interface", () => {
				const dbClient: IDatabaseClient = {
					select: () => ({
						from: () => ({
							where: () => Promise.resolve([]),
							limit: () => Promise.resolve([]),
						}),
					}),
					update: () => ({
						set: () => ({
							where: () => Promise.resolve(),
						}),
					}),
					execute: () => Promise.resolve(),
				};

				expect(typeof dbClient.select).toBe("function");
				expect(typeof dbClient.update).toBe("function");
				expect(typeof dbClient.execute).toBe("function");
			});
		});
	});

	describe("Type Compatibility", () => {
		it("should allow type casting between compatible interfaces", () => {
			const manifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.ts",
			};

			// Should be compatible with any object that has the required fields
			const compatibleObject = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.ts",
			};

			expect(manifest.name).toBe(compatibleObject.name);
			expect(manifest.pluginId).toBe(compatibleObject.pluginId);
			expect(manifest.version).toBe(compatibleObject.version);
		});

		it("should handle optional fields correctly", () => {
			const manifestWithOptionals: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.ts",
				icon: "icon.png",
				homepage: "https://example.com",
			};

			expect(manifestWithOptionals.icon).toBe("icon.png");
			expect(manifestWithOptionals.homepage).toBe("https://example.com");
			expect(manifestWithOptionals.license).toBeUndefined();
			expect(manifestWithOptionals.tags).toBeUndefined();
		});
	});
});
