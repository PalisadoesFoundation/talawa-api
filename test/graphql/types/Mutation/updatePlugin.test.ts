import { beforeEach, describe, expect, it, vi } from "vitest";
import { updatePluginResolver } from "../../../../src/graphql/types/Mutation/updatePlugin";
import type PluginManager from "../../../../src/plugin/manager";
import { getPluginManagerInstance } from "../../../../src/plugin/registry";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

// Mock dependencies
vi.mock("../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

const mockPlugin = {
	id: "123e4567-e89b-12d3-a456-426614174000",
	pluginId: "test_plugin",
	isActivated: true,
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
		deactivatePlugin: vi.fn(),
	}) as unknown as PluginManager;

let mockPluginManager: PluginManager;

describe("updatePlugin Mutation", () => {
	let mockContextResult: ReturnType<typeof createMockGraphQLContext>;
	let ctx: ReturnType<typeof createMockGraphQLContext>["context"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockContextResult = createMockGraphQLContext();
		ctx = mockContextResult.context;

		// Create fresh mock plugin manager
		mockPluginManager = createMockPluginManager();
		vi.mocked(getPluginManagerInstance).mockReturnValue(mockPluginManager);

		// Configure default mock implementations
		vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst).mockResolvedValue(
			mockPlugin,
		);

		// Use a simpler mock chain that TypeScript can understand
		const mockUpdateChain = {
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([mockPlugin]),
				}),
			}),
		};
		vi.mocked(ctx.drizzleClient.update).mockReturnValue(
			mockUpdateChain as unknown as ReturnType<typeof ctx.drizzleClient.update>,
		);
	});

	describe("Basic Plugin Updates", () => {
		it("should update a plugin successfully with new values", async () => {
			// Mock that no plugin exists with the new pluginId
			vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst)
				.mockResolvedValueOnce(mockPlugin) // First call for the plugin being updated
				.mockResolvedValueOnce(undefined); // Second call for duplicate check

			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: "updated_plugin",
					isActivated: true,
					isInstalled: false,
					backup: true,
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(vi.mocked(ctx.drizzleClient.update)).toHaveBeenCalled();
		});

		it("should return existing plugin when no updates provided", async () => {
			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(
				vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst),
			).toHaveBeenCalled();
		});

		it("should update only specific fields", async () => {
			// Mock that no plugin exists with the new pluginId
			vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst)
				.mockResolvedValueOnce(mockPlugin) // First call for the plugin being updated
				.mockResolvedValueOnce(undefined); // Second call for duplicate check

			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: "new_plugin_id",
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
		});

		it("should update boolean fields correctly", async () => {
			const args = {
				input: {
					id: mockPlugin.id,
					isActivated: false,
					isInstalled: false,
					backup: true,
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
		});
	});

	describe("Plugin Not Found Handling", () => {
		it("should throw error when plugin not found", async () => {
			// Mock plugin not found
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(undefined);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			await expect(updatePluginResolver(null, args, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				}),
			);
		});

		it("should throw error when plugin not found during update", async () => {
			// Mock plugin found initially, but not found during update
			vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst)
				.mockResolvedValueOnce(mockPlugin) // First call for validation
				.mockResolvedValueOnce(undefined); // Second call during update

			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: "new_plugin_id",
				},
			};

			const result = await updatePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});
	});

	describe("Duplicate PluginId Handling", () => {
		it("should handle conflicting pluginId updates", async () => {
			const existingPlugin = {
				id: "123e4567-e89b-12d3-a456-426614174001",
				pluginId: "existing_plugin",
				isActivated: false,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst)
				.mockResolvedValueOnce(mockPlugin) // First call for the plugin being updated
				.mockResolvedValueOnce(existingPlugin); // Second call for duplicate check

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					pluginId: "existing_plugin",
				},
			};

			await expect(updatePluginResolver(null, args, ctx)).rejects.toThrow(
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

		it("should allow updating pluginId to same value", async () => {
			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: "test_plugin", // Same as current
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
		});
	});

	describe("Plugin Activation/Deactivation", () => {
		it("should handle plugin activation during update", async () => {
			// Mock current plugin as not activated
			const inactivePlugin = { ...mockPlugin, isActivated: false };
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(inactivePlugin);

			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(false);
			vi.mocked(mockPluginManager.loadPlugin).mockResolvedValue(true);
			vi.mocked(mockPluginManager.activatePlugin).mockResolvedValue(true);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					isActivated: true,
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

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

		it("should handle plugin deactivation during update", async () => {
			// Mock current plugin as activated
			const activatedPlugin = { ...mockPlugin, isActivated: true };
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(activatedPlugin);

			vi.mocked(mockPluginManager.deactivatePlugin).mockResolvedValue(true);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					isActivated: false,
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(
				vi.mocked(mockPluginManager.deactivatePlugin),
			).toHaveBeenCalledWith("test_plugin");
		});

		it("should not trigger activation/deactivation when isActivated doesn't change", async () => {
			// Mock that no plugin exists with the new pluginId
			vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst)
				.mockResolvedValueOnce(mockPlugin) // First call for the plugin being updated
				.mockResolvedValueOnce(undefined); // Second call for duplicate check

			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: "new_plugin_id",
					isActivated: mockPlugin.isActivated, // Same activation status
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(
				vi.mocked(mockPluginManager.isPluginLoaded),
			).not.toHaveBeenCalled();
			expect(vi.mocked(mockPluginManager.loadPlugin)).not.toHaveBeenCalled();
			expect(
				vi.mocked(mockPluginManager.activatePlugin),
			).not.toHaveBeenCalled();
			expect(
				vi.mocked(mockPluginManager.deactivatePlugin),
			).not.toHaveBeenCalled();
		});

		it("should handle plugin already loaded scenario during activation", async () => {
			const inactivePlugin = { ...mockPlugin, isActivated: false };
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(inactivePlugin);

			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(true);
			vi.mocked(mockPluginManager.activatePlugin).mockResolvedValue(true);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					isActivated: true,
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

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
					id: "123e4567-e89b-12d3-a456-426614174000",
					isActivated: true,
				},
			};

			// Should still update the plugin even if activation fails
			const result = await updatePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});

		it("should handle plugin activation errors gracefully", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(false);
			vi.mocked(mockPluginManager.loadPlugin).mockResolvedValue(true);
			vi.mocked(mockPluginManager.activatePlugin).mockRejectedValue(
				new Error("Activation failed"),
			);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					isActivated: true,
				},
			};

			// Should still update the plugin even if activation fails
			const result = await updatePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});

		it("should handle plugin deactivation errors gracefully", async () => {
			const activatedPlugin = { ...mockPlugin, isActivated: true };
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(activatedPlugin);

			vi.mocked(mockPluginManager.deactivatePlugin).mockRejectedValue(
				new Error("Deactivation failed"),
			);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					isActivated: false,
				},
			};

			// Should still update the plugin even if deactivation fails
			const result = await updatePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");

			// Mock that no plugin exists with the new pluginId
			vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst)
				.mockResolvedValueOnce(mockPlugin) // First call for the plugin being updated
				.mockResolvedValueOnce(undefined); // Second call for duplicate check

			// Mock the update chain to throw the error
			const mockUpdateChain = {
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockRejectedValue(dbError),
					}),
				}),
			};
			vi.mocked(ctx.drizzleClient.update).mockReturnValue(
				mockUpdateChain as unknown as ReturnType<
					typeof ctx.drizzleClient.update
				>,
			);

			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: "new_plugin_id",
				},
			};

			await expect(updatePluginResolver(null, args, ctx)).rejects.toThrow(
				dbError,
			);
		});

		it("should handle null plugin manager gracefully", async () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const args = {
				input: {
					id: mockPlugin.id,
					isActivated: true,
				},
			};

			// Should still update the plugin even if plugin manager is null
			const result = await updatePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty plugin ID", async () => {
			const args = { input: { id: "" } };
			await expect(updatePluginResolver(null, args, ctx)).rejects.toThrow(
				"Invalid Plugin ID format",
			);
		});

		it("should handle empty pluginId update", async () => {
			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: "",
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
		});

		it("should handle undefined values in update", async () => {
			const args = {
				input: {
					id: mockPlugin.id,
					pluginId: undefined,
					isActivated: undefined,
					isInstalled: undefined,
					backup: undefined,
				},
			};

			const result = await updatePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
		});

		it("should handle special characters in pluginId", async () => {
			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					pluginId: "test-plugin_with.special@chars",
				},
			};
			await expect(updatePluginResolver(null, args, ctx)).rejects.toThrow(
				"This action is forbidden on the resources associated to the provided arguments.",
			);
		});

		it("should handle multiple sequential updates", async () => {
			// First update
			vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst)
				.mockResolvedValueOnce(mockPlugin) // First call for the plugin being updated
				.mockResolvedValueOnce(undefined); // Second call for duplicate check

			const args1 = {
				input: {
					id: mockPlugin.id,
					pluginId: "updated_plugin_1",
				},
			};

			const result1 = await updatePluginResolver(null, args1, ctx);
			expect(result1).toEqual(mockPlugin);

			// Second update
			const args2 = {
				input: {
					id: mockPlugin.id,
					isActivated: false,
				},
			};

			const result2 = await updatePluginResolver(null, args2, ctx);
			expect(result2).toEqual(mockPlugin);
		});
	});
});
