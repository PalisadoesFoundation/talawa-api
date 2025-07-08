import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getPluginByIdResolver,
	getPluginsResolver,
} from "../../../../src/graphql/types/Query/plugins";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

const mockPlugin = {
	id: "123e4567-e89b-12d3-a456-426614174000",
	pluginId: "test_plugin",
	isActivated: true,
	isInstalled: true,
	backup: false,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockPlugin2 = {
	id: "123e4567-e89b-12d3-a456-426614174001",
	pluginId: "another_plugin",
	isActivated: false,
	isInstalled: true,
	backup: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("Plugin GraphQL Queries", () => {
	let mockContextResult: ReturnType<typeof createMockGraphQLContext>;
	let ctx: ReturnType<typeof createMockGraphQLContext>["context"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockContextResult = createMockGraphQLContext();
		ctx = mockContextResult.context;
	});

	describe("getPluginByIdResolver", () => {
		it("should return a plugin by ID", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(mockPlugin);

			const args = { input: { id: "123e4567-e89b-12d3-a456-426614174000" } };
			const result = await getPluginByIdResolver(null, args, ctx);

			expect(result).toEqual(mockPlugin);
			expect(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.anything(),
			});
		});

		it("should return null if plugin not found", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockResolvedValue(undefined);

			const args = { input: { id: "123e4567-e89b-12d3-a456-426614174001" } };
			const result = await getPluginByIdResolver(null, args, ctx);

			expect(result).toBeUndefined();
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findFirst,
			).mockRejectedValue(dbError);

			const args = { input: { id: "123e4567-e89b-12d3-a456-426614174000" } };

			await expect(getPluginByIdResolver(null, args, ctx)).rejects.toThrow(
				dbError,
			);
		});

		it("should handle invalid input gracefully", async () => {
			const args = { input: { id: "invalid-uuid" } };

			// Should throw a validation error for invalid UUID
			await expect(getPluginByIdResolver(null, args, ctx)).rejects.toThrow(
				"Invalid Plugin ID format",
			);
		});
	});

	describe("getPluginsResolver", () => {
		it("should return all plugins with no filters", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin, mockPlugin2]);

			const args = { input: {} };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin, mockPlugin2]);
			expect(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should return filtered plugins by pluginId", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin]);

			const args = { input: { pluginId: "test_plugin" } };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin]);
		});

		it("should return filtered plugins by isActivated", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin]);

			const args = { input: { isActivated: true } };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin]);
		});

		it("should return filtered plugins by isInstalled", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin, mockPlugin2]);

			const args = { input: { isInstalled: true } };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin, mockPlugin2]);
		});

		it("should return filtered plugins with multiple criteria", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin]);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
					isInstalled: true,
				},
			};
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin]);
		});

		it("should return empty array when no plugins match filters", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([]);

			const args = { input: { pluginId: "non_existent_plugin" } };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([]);
		});

		it("should handle null input gracefully", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin, mockPlugin2]);

			const args = { input: null };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin, mockPlugin2]);
		});

		it("should handle database errors gracefully", async () => {
			const dbError = new Error("Database connection failed");
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockRejectedValue(dbError);

			const args = { input: {} };

			await expect(getPluginsResolver(null, args, ctx)).rejects.toThrow(
				dbError,
			);
		});

		it("should handle complex filtering with undefined values", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin]);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: undefined,
					isInstalled: undefined,
				},
			};
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin]);
		});

		it("should handle empty string filters", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([]);

			const args = { input: { pluginId: "" } };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([]);
		});

		it("should handle boolean false filters", async () => {
			vi.mocked(
				ctx.drizzleClient.query.pluginsTable.findMany,
			).mockResolvedValue([mockPlugin2]);

			const args = { input: { isActivated: false } };
			const result = await getPluginsResolver(null, args, ctx);

			expect(result).toEqual([mockPlugin2]);
		});
	});
});
