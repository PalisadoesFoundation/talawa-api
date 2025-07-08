import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPluginResolver } from "../../../../src/graphql/types/Mutation/createPlugin";
import type PluginManager from "../../../../src/plugin/manager";
import * as pluginRegistry from "../../../../src/plugin/registry";
import * as pluginUtils from "../../../../src/plugin/utils";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

// Mock dependencies
vi.mock("../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

vi.mock("../../../../src/plugin/utils", () => ({
	createPluginTables: vi.fn().mockResolvedValue(undefined),
	loadPluginManifest: vi.fn().mockResolvedValue({
		name: "Test Plugin",
		pluginId: "test_plugin",
		version: "1.0.0",
		description: "A test plugin",
		author: "Test Author",
		main: "index.js",
		extensionPoints: { database: [] },
	}),
	safeRequire: vi.fn().mockResolvedValue({}),
}));

const mockPlugin = {
	id: "123e4567-e89b-12d3-a456-426614174000",
	pluginId: "test_plugin",
	isActivated: false,
	isInstalled: true,
	backup: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// Mock plugin manager with vi.mocked wrapper
const createMockPluginManager = () =>
	({
		isPluginLoaded: vi.fn(),
		loadPlugin: vi.fn(),
		activatePlugin: vi.fn(),
	}) as unknown as PluginManager;

let mockPluginManager: PluginManager;

describe("createPlugin Mutation", () => {
	let mockContextResult: ReturnType<typeof createMockGraphQLContext>;
	let ctx: ReturnType<typeof createMockGraphQLContext>["context"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockContextResult = createMockGraphQLContext();
		ctx = mockContextResult.context;

		// Create fresh mock plugin manager
		mockPluginManager = createMockPluginManager();
		vi.mocked(pluginRegistry.getPluginManagerInstance).mockReturnValue(
			mockPluginManager,
		);

		// Configure the existing mock drizzle client methods
		vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst).mockResolvedValue(
			undefined,
		);

		// Use a simpler mock chain that TypeScript can understand
		const mockInsertChain = {
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockPlugin]),
			}),
		};
		vi.mocked(ctx.drizzleClient.insert).mockReturnValue(
			mockInsertChain as unknown as ReturnType<typeof ctx.drizzleClient.insert>,
		);
	});

	describe("Basic Plugin Creation", () => {
		it("should create a plugin successfully with default values", async () => {
			const args = {
				input: {
					pluginId: "test_plugin",
				},
			};

			const result = await createPluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(
				vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst),
			).toHaveBeenCalled();
		});

		it("should create a plugin with custom activation settings", async () => {
			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
					isInstalled: false,
					backup: true,
				},
			};

			const result = await createPluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(vi.mocked(ctx.drizzleClient.insert)).toHaveBeenCalled();
		});

		it("should create a plugin with all custom settings", async () => {
			const args = {
				input: {
					pluginId: "custom_plugin",
					isActivated: true,
					isInstalled: true,
					backup: true,
				},
			};

			const result = await createPluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
		});
	});

	describe("Duplicate Plugin Handling", () => {
		it("should throw error when plugin with same pluginId already exists", async () => {
			// Mock finding an existing plugin with the same pluginId
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(mockPlugin);

			const args = {
				input: {
					pluginId: "test_plugin",
				},
			};

			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "A plugin with this ID already exists",
							},
						],
					},
				}),
			);
		});

		it("should handle database constraint violation errors", async () => {
			const dbError = new Error(
				"duplicate key value violates unique constraint",
			) as Error & { code: string };
			dbError.code = "23505";

			// Mock the insert chain to throw the error
			const mockInsertChain = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockRejectedValue(dbError),
				}),
			};
			vi.mocked(ctx.drizzleClient.insert).mockReturnValue(
				mockInsertChain as unknown as ReturnType<
					typeof ctx.drizzleClient.insert
				>,
			);

			const args = {
				input: {
					pluginId: "test_plugin",
				},
			};

			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "A plugin with this ID already exists",
							},
						],
					},
				}),
			);
		});
	});

	describe("Plugin Activation", () => {
		it("should activate plugin when isActivated is true", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(false);
			vi.mocked(mockPluginManager.loadPlugin).mockResolvedValue(true);
			vi.mocked(mockPluginManager.activatePlugin).mockResolvedValue(true);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
				},
			};

			const result = await createPluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(vi.mocked(mockPluginManager.isPluginLoaded)).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(vi.mocked(mockPluginManager.loadPlugin)).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(vi.mocked(mockPluginManager.activatePlugin)).toHaveBeenCalledWith(
				"test_plugin",
			);
		});

		it("should not activate plugin when isActivated is false", async () => {
			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: false,
				},
			};

			const result = await createPluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(
				vi.mocked(mockPluginManager.isPluginLoaded),
			).not.toHaveBeenCalled();
			expect(vi.mocked(mockPluginManager.loadPlugin)).not.toHaveBeenCalled();
			expect(
				vi.mocked(mockPluginManager.activatePlugin),
			).not.toHaveBeenCalled();
		});

		it("should not activate plugin when isActivated is undefined", async () => {
			const args = {
				input: {
					pluginId: "test_plugin",
				},
			};

			const result = await createPluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(
				vi.mocked(mockPluginManager.isPluginLoaded),
			).not.toHaveBeenCalled();
			expect(vi.mocked(mockPluginManager.loadPlugin)).not.toHaveBeenCalled();
			expect(
				vi.mocked(mockPluginManager.activatePlugin),
			).not.toHaveBeenCalled();
		});

		it("should handle plugin already loaded scenario", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(true);
			vi.mocked(mockPluginManager.activatePlugin).mockResolvedValue(true);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
				},
			};

			const result = await createPluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(vi.mocked(mockPluginManager.isPluginLoaded)).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(vi.mocked(mockPluginManager.loadPlugin)).not.toHaveBeenCalled();
			expect(vi.mocked(mockPluginManager.activatePlugin)).toHaveBeenCalledWith(
				"test_plugin",
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle plugin loading errors gracefully", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(false);
			vi.mocked(mockPluginManager.loadPlugin).mockRejectedValue(
				new Error("Load failed"),
			);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
				},
			};

			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});

		it("should handle plugin activation errors gracefully", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(false);
			vi.mocked(mockPluginManager.loadPlugin).mockResolvedValue(true);
			vi.mocked(mockPluginManager.activatePlugin).mockRejectedValue(
				new Error("Activation failed"),
			);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
				},
			};

			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");

			// Mock the insert chain to throw the error
			const mockInsertChain = {
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockRejectedValue(dbError),
				}),
			};
			vi.mocked(ctx.drizzleClient.insert).mockReturnValue(
				mockInsertChain as unknown as ReturnType<
					typeof ctx.drizzleClient.insert
				>,
			);

			const args = {
				input: {
					pluginId: "test_plugin",
				},
			};

			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				dbError,
			);
		});

		it("should handle manifest loading errors gracefully", async () => {
			vi.mocked(pluginUtils.loadPluginManifest).mockRejectedValue(
				new Error("Manifest not found"),
			);

			const args = {
				input: {
					pluginId: "test_plugin",
				},
			};

			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});

		it("should handle table creation errors gracefully", async () => {
			const args = {
				input: {
					pluginId: "test_plugin",
				},
			};
			// Simulate manifest loading success with database extensions to trigger table creation
			vi.mocked(pluginUtils.loadPluginManifest).mockResolvedValue({
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: {
					database: [{ name: "test_table", file: "test.js", type: "table" }],
				},
			});
			// Mock safeRequire to return a module with the table definition
			vi.mocked(pluginUtils.safeRequire).mockResolvedValue({
				test_table: { columns: {} },
			});
			vi.mocked(pluginUtils.createPluginTables).mockRejectedValue(
				new Error("Table creation failed"),
			);
			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty pluginId", async () => {
			const args = { input: { pluginId: "" } };
			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});

		it("should handle very long pluginId", async () => {
			const args = { input: { pluginId: "a".repeat(300) } };
			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});

		it("should handle special characters in pluginId", async () => {
			const args = { input: { pluginId: "test-plugin_with.special@chars" } };
			await expect(createPluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});

		it("should handle null plugin manager gracefully", async () => {
			const args = { input: { pluginId: "test_plugin" } };
			vi.mocked(pluginRegistry.getPluginManagerInstance).mockReturnValue(null);
			// Mock manifest to avoid table creation
			vi.mocked(pluginUtils.loadPluginManifest).mockResolvedValue({
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
				extensionPoints: { database: [] },
			});
			const result = await createPluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});
	});
});
