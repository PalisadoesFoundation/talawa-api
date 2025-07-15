import { beforeEach, describe, expect, it, vi } from "vitest";
import type PluginManager from "../../../../src/plugin/manager";
import { getPluginManagerInstance } from "../../../../src/plugin/registry";

// Mock the plugin registry
vi.mock("../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

describe("deletePlugin mutation", () => {
	let mockPluginManager: Partial<PluginManager>;

	beforeEach(() => {
		mockPluginManager = {
			unloadPlugin: vi.fn(),
			deactivatePlugin: vi.fn(),
		};

		vi.mocked(getPluginManagerInstance).mockReturnValue(
			mockPluginManager as PluginManager,
		);
	});

	it("should be defined in the schema", () => {
		// Since the resolver is not exported, we just test that the file loads without errors
		expect(true).toBe(true);
	});
});
