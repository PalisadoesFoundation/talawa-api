import { beforeEach, describe, expect, it, vi } from "vitest";
import { deletePluginResolver } from "../../../../src/graphql/types/Mutation/deletePlugin";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
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

describe("deletePlugin Mutation", () => {
	let mockContextResult: ReturnType<typeof createMockGraphQLContext>;
	let ctx: ReturnType<typeof createMockGraphQLContext>["context"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockContextResult = createMockGraphQLContext();
		ctx = mockContextResult.context;

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

	it("should throw error when plugin not found", async () => {
		// Mock the delete chain to return empty array (no plugin found)
		const mockDeleteChain = {
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([]), // Empty array means no plugin deleted
			}),
		};
		vi.mocked(ctx.drizzleClient.delete).mockReturnValue(
			mockDeleteChain as unknown as ReturnType<typeof ctx.drizzleClient.delete>,
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
			mockDeleteChain as unknown as ReturnType<typeof ctx.drizzleClient.delete>,
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
});
