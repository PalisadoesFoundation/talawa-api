import { beforeEach, describe, expect, it, vi } from "vitest";
import type { pluginsTable } from "../../../src/drizzle/tables/plugins";
import { PluginRegistry } from "../../../src/plugin/manager/registry";
import type { IPluginContext } from "../../../src/plugin/types";

// Mock types
interface MockDb {
	select: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
}

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
};

// Helper: create a valid mock plugin row
function createMockPluginRow(): typeof pluginsTable.$inferSelect {
	return {
		id: "1",
		pluginId: "test",
		isActivated: false,
		isInstalled: true,
		backup: false,
		createdAt: new Date(),
		updatedAt: null,
	};
}

describe("PluginRegistry", () => {
	let mockDb: MockDb;
	let pluginContext: IPluginContext;
	let registry: PluginRegistry;

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb = {
			select: vi.fn(),
			update: vi.fn(),
		};
		pluginContext = {
			db: mockDb,
			logger: mockLogger,
			graphql: {},
			pubsub: {},
		};
		registry = new PluginRegistry(pluginContext);
	});

	describe("getPluginFromDatabase", () => {
		it("returns plugin if found", async () => {
			const pluginRow = createMockPluginRow();
			const where = vi.fn().mockResolvedValue([pluginRow]);
			const from = vi.fn(() => ({ where }));
			mockDb.select.mockReturnValue({ from });
			const result = await registry.getPluginFromDatabase("test");
			expect(result).toEqual(pluginRow);
		});

		it("returns null if not found", async () => {
			const where = vi.fn().mockResolvedValue([]);
			const from = vi.fn(() => ({ where }));
			mockDb.select.mockReturnValue({ from });
			const result = await registry.getPluginFromDatabase("notfound");
			expect(result).toBeNull();
		});

		it("logs and returns null on error", async () => {
			const error = new Error("DB error");
			const where = vi.fn().mockRejectedValue(error);
			const from = vi.fn(() => ({ where }));
			mockDb.select.mockReturnValue({ from });
			const result = await registry.getPluginFromDatabase("fail");
			expect(result).toBeNull();
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error fetching plugin from database",
					err: error,
				}),
			);
		});
	});

	describe("updatePluginInDatabase", () => {
		it("updates plugin successfully", async () => {
			const where = vi.fn().mockResolvedValue(undefined);
			const set = vi.fn(() => ({ where }));
			mockDb.update.mockReturnValue({ set });
			await expect(
				registry.updatePluginInDatabase("test", { isActivated: true }),
			).resolves.not.toThrow();
			expect(mockDb.update).toHaveBeenCalled();
		});

		it("logs and throws on error", async () => {
			const error = new Error("Update error");
			const where = vi.fn().mockRejectedValue(error);
			const set = vi.fn(() => ({ where }));
			mockDb.update.mockReturnValue({ set });
			await expect(
				registry.updatePluginInDatabase("fail", { isActivated: false }),
			).rejects.toThrow("Update error");
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error updating plugin in database",
					err: error,
				}),
			);
		});
	});
});
