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

describe("Plugin GraphQL Queries", () => {
	let mockContextResult: ReturnType<typeof createMockGraphQLContext>;
	let ctx: ReturnType<typeof createMockGraphQLContext>["context"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockContextResult = createMockGraphQLContext();
		ctx = mockContextResult.context;
	});

	it("should return a plugin by ID", async () => {
		vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst).mockResolvedValue(
			mockPlugin,
		);

		const args = { input: { id: "123e4567-e89b-12d3-a456-426614174000" } };
		const result = await getPluginByIdResolver(null, args, ctx);

		expect(result).toEqual(mockPlugin);
	});

	it("should return null if plugin not found", async () => {
		vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst).mockResolvedValue(
			undefined,
		);

		const args = { input: { id: "123e4567-e89b-12d3-a456-426614174001" } };
		const result = await getPluginByIdResolver(null, args, ctx);

		expect(result).toBeUndefined();
	});

	it("should return all plugins with no filters", async () => {
		vi.mocked(ctx.drizzleClient.query.pluginsTable.findMany).mockResolvedValue([
			mockPlugin,
		]);

		const args = { input: {} };
		const result = await getPluginsResolver(null, args, ctx);

		expect(result).toEqual([mockPlugin]);
	});

	it("should return filtered plugins", async () => {
		vi.mocked(ctx.drizzleClient.query.pluginsTable.findMany).mockResolvedValue([
			mockPlugin,
		]);

		const args = { input: { pluginId: "test_plugin", isActivated: true } };
		const result = await getPluginsResolver(null, args, ctx);

		expect(result).toEqual([mockPlugin]);
	});
});
