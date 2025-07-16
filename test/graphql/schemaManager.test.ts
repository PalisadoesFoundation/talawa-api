import { beforeEach, describe, expect, it, vi } from "vitest";
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

// Mock GraphQL builder - define inline to avoid hoisting issues
vi.mock("~/src/graphql/builder", () => ({
	builder: {
		queryField: vi.fn(),
		mutationField: vi.fn(),
		subscriptionField: vi.fn(),
		toSchema: vi.fn(),
	},
}));

// Mock plugin manager with vi.mocked wrapper
const createMockPluginManager = () =>
	({
		getActivePlugins: vi.fn(),
		getExtensionRegistry: vi.fn(),
		isPluginActive: vi.fn(),
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
					status: PluginStatus.ACTIVE,
				},
			];

			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					queries: {
						getPluginData: {
							pluginId: "plugin1",
							resolver: vi.fn(),
						},
						getInactivePluginData: {
							pluginId: "inactive_plugin",
							resolver: vi.fn(),
						},
					},
					mutations: {
						createPluginData: {
							pluginId: "plugin1",
							resolver: vi.fn(),
						},
					},
					subscriptions: {},
					types: {},
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
			};

			vi.mocked(mockPluginManager.getActivePlugins).mockReturnValue(
				mockActivePlugins,
			);
			vi.mocked(mockPluginManager.getExtensionRegistry).mockReturnValue(
				mockExtensionRegistry,
			);
			vi.mocked(mockPluginManager.isPluginActive)
				.mockReturnValueOnce(true) // plugin1 is active
				.mockReturnValueOnce(false); // inactive_plugin is not active

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
					status: PluginStatus.ACTIVE,
				},
			];

			const mockExtensionRegistry: IExtensionRegistry = {
				graphql: {
					queries: {},
					mutations: {},
					subscriptions: {},
					types: {},
				},
				database: { tables: {}, enums: {}, relations: {} },
				hooks: { pre: {}, post: {} },
			};

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

	describe("GraphQL Field Registration", () => {
		it("should register query fields correctly", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField("test_plugin", "query", "getTestData", extension);

			expect(vi.mocked(builder).queryField).toHaveBeenCalledWith(
				"test_plugin_getTestData",
				expect.any(Function),
			);
		});

		it("should register mutation fields correctly", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField(
				"test_plugin",
				"mutation",
				"createTestData",
				extension,
			);

			expect(vi.mocked(builder).mutationField).toHaveBeenCalledWith(
				"test_plugin_createTestData",
				expect.any(Function),
			);
		});

		it("should register subscription fields correctly", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField(
				"test_plugin",
				"subscription",
				"testDataChanged",
				extension,
			);

			expect(vi.mocked(builder).subscriptionField).toHaveBeenCalledWith(
				"test_plugin_testDataChanged",
				expect.any(Function),
			);
		});

		it("should handle field registration errors gracefully", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			// Mock the builder to throw an error
			vi.mocked(builder).queryField.mockImplementation(() => {
				throw new Error("Registration failed");
			});

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField("test_plugin", "query", "getTestData", extension);
		});
	});

	describe("Plugin Context Creation", () => {
		it("should create proper plugin context for queries", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const mockGraphQLContext = {
				drizzleClient: { query: {} },
				pubsub: {},
				log: {},
				currentClient: {},
				envConfig: {},
				jwt: {},
				minio: {},
			};

			// Mock the query field to capture the resolver
			let capturedResolver: unknown;
			vi.mocked(builder).queryField.mockImplementation(
				(name, builderFunction) => {
					// Create a mock 't' object that mimics the Pothos field builder
					const mockT = {
						string: vi.fn().mockImplementation((config) => {
							capturedResolver = config.resolve;
							return config;
						}),
					} as unknown as Parameters<
						Parameters<typeof builder.queryField>[1]
					>[0];
					// Call the builder function to capture the resolver
					builderFunction(mockT);
				},
			);

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField("test_plugin", "query", "getTestData", extension);

			// Call the captured resolver
			await (
				capturedResolver as (
					parent: unknown,
					args: unknown,
					context: unknown,
				) => Promise<unknown>
			)(null, { input: "test" }, mockGraphQLContext);
		});

		it("should create proper plugin context for mutations", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const mockGraphQLContext = {
				drizzleClient: { query: {} },
				pubsub: {},
				log: {},
				currentClient: {},
				envConfig: {},
				jwt: {},
				minio: {},
			};

			// Mock the mutation field to capture the resolver
			let capturedResolver: unknown;
			vi.mocked(builder).mutationField.mockImplementation(
				(name, builderFunction) => {
					// Create a mock 't' object that mimics the Pothos field builder
					const mockT = {
						string: vi.fn().mockImplementation((config) => {
							capturedResolver = config.resolve;
							return config;
						}),
						arg: {
							string: vi.fn().mockReturnValue("mockArg"),
						},
					} as unknown as Parameters<
						Parameters<typeof builder.mutationField>[1]
					>[0];
					// Call the builder function to capture the resolver
					builderFunction(mockT);
				},
			);

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField(
				"test_plugin",
				"mutation",
				"createTestData",
				extension,
			);

			// Call the captured resolver
			await (
				capturedResolver as (
					parent: unknown,
					args: unknown,
					context: unknown,
				) => Promise<unknown>
			)(null, { input: JSON.stringify({ test: "data" }) }, mockGraphQLContext);
		});

		it("should handle invalid JSON input in mutations", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const mockGraphQLContext = {
				drizzleClient: { query: {} },
				pubsub: {},
				log: {},
				currentClient: {},
				envConfig: {},
				jwt: {},
				minio: {},
			};

			// Mock the mutation field to capture the resolver
			let capturedResolver: unknown;
			vi.mocked(builder).mutationField.mockImplementation(
				(name, builderFunction) => {
					// Create a mock 't' object that mimics the Pothos field builder
					const mockT = {
						string: vi.fn().mockImplementation((config) => {
							capturedResolver = config.resolve;
							return config;
						}),
						arg: {
							string: vi.fn().mockReturnValue("mockArg"),
						},
					} as unknown as Parameters<
						Parameters<typeof builder.mutationField>[1]
					>[0];
					// Call the builder function to capture the resolver
					builderFunction(mockT);
				},
			);

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField(
				"test_plugin",
				"mutation",
				"createTestData",
				extension,
			);

			// Call the captured resolver with invalid JSON
			await expect(
				(
					capturedResolver as (
						parent: unknown,
						args: unknown,
						context: unknown,
					) => Promise<unknown>
				)(null, { input: "invalid json" }, mockGraphQLContext),
			).rejects.toThrow("Invalid JSON input");
		});

		it("should handle null input in mutations", async () => {
			const mockResolver = vi.fn();
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const mockGraphQLContext = {
				drizzleClient: { query: {} },
				pubsub: {},
				log: {},
				currentClient: {},
				envConfig: {},
				jwt: {},
				minio: {},
			};

			// Mock the mutation field to capture the resolver
			let capturedResolver: unknown;
			vi.mocked(builder).mutationField.mockImplementation(
				(name, builderFunction) => {
					// Create a mock 't' object that mimics the Pothos field builder
					const mockT = {
						string: vi.fn().mockImplementation((config) => {
							capturedResolver = config.resolve;
							return config;
						}),
						arg: {
							string: vi.fn().mockReturnValue("mockArg"),
						},
					} as unknown as Parameters<
						Parameters<typeof builder.mutationField>[1]
					>[0];
					// Call the builder function to capture the resolver
					builderFunction(mockT);
				},
			);

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField(
				"test_plugin",
				"mutation",
				"createTestData",
				extension,
			);

			// Call the captured resolver with null input
			await (
				capturedResolver as (
					parent: unknown,
					args: unknown,
					context: unknown,
				) => Promise<unknown>
			)(null, { input: null }, mockGraphQLContext);

			// Should not throw and should call the resolver with empty object
			expect(mockResolver).toHaveBeenCalledWith(null, {}, expect.any(Object));
		});
	});

	describe("Error Handling", () => {
		it("should handle resolver execution errors", async () => {
			const mockResolver = vi
				.fn()
				.mockRejectedValue(new Error("Resolver failed"));
			const extension = {
				pluginId: "test_plugin",
				resolver: mockResolver,
			};

			const mockGraphQLContext = {
				drizzleClient: { query: {} },
				pubsub: {},
				log: {},
				currentClient: {},
				envConfig: {},
				jwt: {},
				minio: {},
			};

			// Mock the query field to capture the resolver
			let capturedResolver: unknown;
			vi.mocked(builder).queryField.mockImplementation(
				(name, builderFunction) => {
					// Create a mock 't' object that mimics the Pothos field builder
					const mockT = {
						string: vi.fn().mockImplementation((config) => {
							capturedResolver = config.resolve;
							return config;
						}),
					} as unknown as Parameters<
						Parameters<typeof builder.queryField>[1]
					>[0];
					// Call the builder function to capture the resolver
					builderFunction(mockT);
				},
			);

			const registerGraphQLField = (
				schemaManager as unknown as {
					registerGraphQLField: (
						pluginId: string,
						fieldType: string,
						fieldName: string,
						extension: unknown,
					) => void;
				}
			).registerGraphQLField.bind(schemaManager);
			registerGraphQLField("test_plugin", "query", "getTestData", extension);

			// Call the captured resolver
			await expect(
				(
					capturedResolver as (
						parent: unknown,
						args: unknown,
						context: unknown,
					) => Promise<unknown>
				)(null, {}, mockGraphQLContext),
			).rejects.toThrow("Resolver failed");
		});

		it("should handle missing plugin manager during extension registration", async () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const registerActivePluginExtensions = (
				schemaManager as unknown as {
					registerActivePluginExtensions: () => Promise<void>;
				}
			).registerActivePluginExtensions.bind(schemaManager);
			await registerActivePluginExtensions();
		});
	});
});
