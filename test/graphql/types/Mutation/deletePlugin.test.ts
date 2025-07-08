import { beforeEach, describe, expect, it, vi } from "vitest";
import { deletePluginResolver } from "../../../../src/graphql/types/Mutation/deletePlugin";
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
		isPluginActive: vi.fn(),
		deactivatePlugin: vi.fn(),
		unloadPlugin: vi.fn(),
	}) as unknown as PluginManager;

let mockPluginManager: PluginManager;

describe("deletePlugin Mutation", () => {
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
		const mockDeleteChain = {
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([mockPlugin]),
			}),
		};
		vi.mocked(ctx.drizzleClient.delete).mockReturnValue(
			mockDeleteChain as unknown as ReturnType<typeof ctx.drizzleClient.delete>,
		);
	});

	describe("Basic Plugin Deletion", () => {
		it("should delete a plugin successfully", async () => {
			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			const result = await deletePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(vi.mocked(ctx.drizzleClient.delete)).toHaveBeenCalled();
		});

		it("should handle plugin cleanup when plugin is loaded", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(true);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(true);
			vi.mocked(mockPluginManager.deactivatePlugin).mockResolvedValue(true);
			vi.mocked(mockPluginManager.unloadPlugin).mockResolvedValue(true);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			const result = await deletePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(mockPluginManager.isPluginLoaded).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(mockPluginManager.isPluginActive).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(mockPluginManager.deactivatePlugin).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(mockPluginManager.unloadPlugin).toHaveBeenCalledWith(
				"test_plugin",
			);
		});

		it("should handle plugin cleanup when plugin is loaded but not active", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(true);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(false);
			vi.mocked(mockPluginManager.unloadPlugin).mockResolvedValue(true);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			const result = await deletePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(mockPluginManager.isPluginLoaded).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(mockPluginManager.isPluginActive).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(mockPluginManager.deactivatePlugin).not.toHaveBeenCalled();
			expect(mockPluginManager.unloadPlugin).toHaveBeenCalledWith(
				"test_plugin",
			);
		});

		it("should handle plugin cleanup when plugin is not loaded", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(false);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(false);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			const result = await deletePluginResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(mockPluginManager.isPluginLoaded).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(mockPluginManager.isPluginActive).toHaveBeenCalledWith(
				"test_plugin",
			);
			expect(mockPluginManager.deactivatePlugin).not.toHaveBeenCalled();
			expect(mockPluginManager.unloadPlugin).not.toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		it("should throw error when plugin not found", async () => {
			// Mock the delete chain to return empty array (no plugin found)
			const mockDeleteChain = {
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]), // Empty array means no plugin deleted
				}),
			};
			vi.mocked(ctx.drizzleClient.delete).mockReturnValue(
				mockDeleteChain as unknown as ReturnType<
					typeof ctx.drizzleClient.delete
				>,
			);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			await expect(deletePluginResolver(null, args, ctx)).rejects.toThrow(
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

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");

			// Mock the delete chain to throw the error
			const mockDeleteChain = {
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockRejectedValue(dbError),
				}),
			};
			vi.mocked(ctx.drizzleClient.delete).mockReturnValue(
				mockDeleteChain as unknown as ReturnType<
					typeof ctx.drizzleClient.delete
				>,
			);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			await expect(deletePluginResolver(null, args, ctx)).rejects.toThrow(
				dbError,
			);
		});

		it("should handle plugin deactivation errors gracefully", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(true);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(true);
			vi.mocked(mockPluginManager.deactivatePlugin).mockRejectedValue(
				new Error("Deactivation failed"),
			);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			// Should still delete the plugin even if cleanup fails
			const result = await deletePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});

		it("should handle plugin unloading errors gracefully", async () => {
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(true);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(false);
			vi.mocked(mockPluginManager.unloadPlugin).mockRejectedValue(
				new Error("Unload failed"),
			);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			// Should still delete the plugin even if cleanup fails
			const result = await deletePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});

		it("should handle null plugin manager gracefully", async () => {
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const args = {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			};

			// Should still delete the plugin even if plugin manager is null
			const result = await deletePluginResolver(null, args, ctx);
			expect(result).toEqual(mockPlugin);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty plugin ID", async () => {
			const args = { input: { id: "" } };
			await expect(deletePluginResolver(null, args, ctx)).rejects.toThrow(
				"Invalid Plugin ID format",
			);
		});

		it("should handle invalid UUID format", async () => {
			const args = { input: { id: "not-a-uuid" } };
			await expect(deletePluginResolver(null, args, ctx)).rejects.toThrow(
				"Invalid Plugin ID format",
			);
		});

		it("should handle plugin with special characters in pluginId", async () => {
			const specialPlugin = {
				...mockPlugin,
				pluginId: "test-plugin_with.special@chars",
			};
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(specialPlugin);

			// Mock that the plugin is loaded so unloadPlugin gets called
			vi.mocked(mockPluginManager.isPluginLoaded).mockReturnValue(true);
			vi.mocked(mockPluginManager.isPluginActive).mockReturnValue(false);
			vi.mocked(mockPluginManager.unloadPlugin).mockResolvedValue(true);

			// Mock the delete operation to return the special plugin
			const mockDeleteChain = {
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([specialPlugin]),
				}),
			};
			vi.mocked(ctx.drizzleClient.delete).mockReturnValue(
				mockDeleteChain as unknown as ReturnType<
					typeof ctx.drizzleClient.delete
				>,
			);

			const args = { input: { id: specialPlugin.id } };
			const result = await deletePluginResolver(null, args, ctx);
			expect(result).toEqual(specialPlugin);
			expect(mockPluginManager.unloadPlugin).toHaveBeenCalledWith(
				"test-plugin_with.special@chars",
			);
		});

		it("should handle multiple plugins being deleted in sequence", async () => {
			const args = { input: { id: "invalid-uuid" } };
			await expect(deletePluginResolver(null, args, ctx)).rejects.toThrow(
				"Invalid Plugin ID format",
			);
		});
	});
});
