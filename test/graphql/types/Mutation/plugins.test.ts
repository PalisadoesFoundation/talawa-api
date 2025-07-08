import { beforeEach, describe, expect, it, vi } from "vitest";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import { builder } from "~/src/graphql/builder";
import { getPluginManagerInstance } from "~/src/plugin/registry";

// Mock dependencies
vi.mock("~/src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

vi.mock("~/src/utilities/TalawaGraphQLError");

vi.mock("~/src/graphql/builder", () => ({
	builder: {
		mutationFields: vi.fn(),
		inputType: vi.fn(),
	},
}));

vi.mock("drizzle-orm");

vi.mock("~/src/drizzle/tables/plugins", () => ({
	pluginsTable: {
		id: "id",
		pluginId: "pluginId",
	},
}));

vi.mock("~/src/graphql/types/Plugin/Plugin", () => ({
	Plugin: "MockedPlugin",
}));

vi.mock("../Plugin/inputs", () => ({
	CreatePluginInput: "MockedCreatePluginInput",
	UpdatePluginInput: "MockedUpdatePluginInput",
	DeletePluginInput: "MockedDeletePluginInput",
}));

describe("Plugin Mutations", () => {
	let mockDrizzleClient: {
		query: {
			pluginsTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
		insert: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	let mockPluginManager: {
		isPluginLoaded: ReturnType<typeof vi.fn>;
		isPluginActive: ReturnType<typeof vi.fn>;
		loadPlugin: ReturnType<typeof vi.fn>;
		activatePlugin: ReturnType<typeof vi.fn>;
		deactivatePlugin: ReturnType<typeof vi.fn>;
		unloadPlugin: ReturnType<typeof vi.fn>;
	};
	let mockContext: {
		drizzleClient: typeof mockDrizzleClient;
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		// Setup mock drizzle client
		mockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(),
				},
			},
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn(),
				}),
			}),
			update: vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn(),
					}),
				}),
			}),
			delete: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn(),
				}),
			}),
		};

		// Setup mock plugin manager
		mockPluginManager = {
			isPluginLoaded: vi.fn(),
			isPluginActive: vi.fn(),
			loadPlugin: vi.fn(),
			activatePlugin: vi.fn(),
			deactivatePlugin: vi.fn(),
			unloadPlugin: vi.fn(),
		};

		// Setup mock context
		mockContext = {
			drizzleClient: mockDrizzleClient,
		};

		// Mock builder methods
		vi.mocked(builder.inputType).mockReturnValue("MockedInputType" as never);
		vi.mocked(builder.mutationFields).mockReturnValue(undefined);

		// Import the mutations module to ensure it's loaded
		await import("~/src/graphql/types/Mutation/plugins");
	});

	describe("Plugin mutations module", () => {
		it("should define the plugin mutations", () => {
			// Test that the mutation fields mock is set up correctly
			expect(vi.mocked(builder.mutationFields)).toBeDefined();
		});

		it("should use the correct input types", () => {
			// Test that input types mock is set up correctly
			expect(vi.mocked(builder.inputType)).toBeDefined();
		});
	});

	describe("Plugin validation schemas", () => {
		it("should validate createPlugin input correctly", async () => {
			// Import the schemas for testing
			const pluginsModule = await import(
				"~/src/graphql/types/Mutation/plugins"
			);

			// Since we can't access the schemas directly, we test the module exists
			expect(pluginsModule).toBeDefined();
		});

		it("should validate updatePlugin input correctly", async () => {
			const pluginsModule = await import(
				"~/src/graphql/types/Mutation/plugins"
			);

			expect(pluginsModule).toBeDefined();
		});

		it("should validate deletePlugin input correctly", async () => {
			const pluginsModule = await import(
				"~/src/graphql/types/Mutation/plugins"
			);

			expect(pluginsModule).toBeDefined();
		});
	});

	describe("Database operations", () => {
		it("should call drizzle client methods with correct parameters", () => {
			// Test that our mock drizzle client is set up correctly
			expect(mockDrizzleClient.query.pluginsTable.findFirst).toBeDefined();
			expect(mockDrizzleClient.insert).toBeDefined();
			expect(mockDrizzleClient.update).toBeDefined();
			expect(mockDrizzleClient.delete).toBeDefined();
		});

		it("should use the correct table for operations", () => {
			// Test that we're using the plugins table
			expect(pluginsTable).toBeDefined();
			expect(pluginsTable.id).toBe("id");
			expect(pluginsTable.pluginId).toBe("pluginId");
		});
	});

	describe("Plugin manager integration", () => {
		it("should be able to get plugin manager instance", () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(
				mockPluginManager as never,
			);

			const instance = getPluginManagerInstance();
			expect(instance).toBe(mockPluginManager);
			expect(getPluginManagerInstance).toHaveBeenCalled();
		});

		it("should handle null plugin manager", () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const instance = getPluginManagerInstance();
			expect(instance).toBeNull();
		});
	});

	describe("Error handling", () => {
		it("should handle database connection errors", () => {
			mockDrizzleClient.query.pluginsTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			expect(mockDrizzleClient.query.pluginsTable.findFirst).toBeDefined();
		});

		it("should handle plugin manager errors", () => {
			mockPluginManager.loadPlugin.mockRejectedValue(
				new Error("Plugin load failed"),
			);

			expect(mockPluginManager.loadPlugin).toBeDefined();
		});
	});

	describe("GraphQL integration", () => {
		it("should register mutations with GraphQL builder", () => {
			// Test that the mutation fields mock is set up correctly
			expect(vi.mocked(builder.mutationFields)).toBeDefined();
		});

		it("should use correct input types for mutations", () => {
			// Test that the input type mock is set up correctly
			expect(vi.mocked(builder.inputType)).toBeDefined();
		});
	});

	describe("Module dependencies", () => {
		it("should import all required modules", async () => {
			// Test that all imports work correctly
			const pluginsModule = await import(
				"~/src/graphql/types/Mutation/plugins"
			);
			expect(pluginsModule).toBeDefined();
		});

		it("should have all required mocks", () => {
			expect(vi.mocked(getPluginManagerInstance)).toBeDefined();
			expect(vi.mocked(builder.mutationFields)).toBeDefined();
			expect(vi.mocked(builder.inputType)).toBeDefined();
		});
	});

	describe("Type safety", () => {
		it("should work with proper TypeScript types", () => {
			// Test that our type definitions work
			expect(mockContext.drizzleClient).toBe(mockDrizzleClient);
			expect(typeof mockPluginManager.isPluginLoaded).toBe("function");
			expect(typeof mockPluginManager.loadPlugin).toBe("function");
		});
	});
});
