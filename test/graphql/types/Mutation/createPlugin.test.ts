import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPluginResolver } from "../../../../src/graphql/types/Mutation/createPlugin";
import type PluginManager from "../../../../src/plugin/manager";
import { getPluginManagerInstance } from "../../../../src/plugin/registry";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

// Mock dependencies
vi.mock("../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

vi.mock("../../../../src/plugin/utils", () => ({
	createPluginTables: vi.fn().mockResolvedValue(undefined),
	loadPluginManifest: vi.fn().mockResolvedValue({
		extensionPoints: {
			database: [],
		},
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
		vi.mocked(getPluginManagerInstance).mockReturnValue(mockPluginManager);

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

	it("should throw error when plugin with same pluginId already exists", async () => {
		// Mock finding an existing plugin with the same pluginId
		vi.mocked(ctx.drizzleClient.query.pluginsTable.findFirst).mockResolvedValue(
			mockPlugin,
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

		// Should still create the plugin even if activation fails
		const result = await createPluginResolver(null, args, ctx);
		expect(result).toEqual(mockPlugin);
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
			mockInsertChain as unknown as ReturnType<typeof ctx.drizzleClient.insert>,
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
