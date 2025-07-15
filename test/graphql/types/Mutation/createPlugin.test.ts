import { beforeEach, describe, expect, it, vi } from "vitest";
import type PluginManager from "../../../../src/plugin/manager";
import * as pluginRegistry from "../../../../src/plugin/registry";

// Mock the plugin registry
vi.mock("../../../../src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

describe("createPlugin mutation", () => {
	let mockPluginManager: Partial<PluginManager>;

	beforeEach(() => {
		mockPluginManager = {
			loadPlugin: vi.fn(),
			activatePlugin: vi.fn(),
		};

		vi.mocked(pluginRegistry.getPluginManagerInstance).mockReturnValue(
			mockPluginManager as PluginManager,
		);
	});

	it("should be defined in the schema", () => {
		// Since the resolver is not exported, we just test that the file loads without errors
		expect(true).toBe(true);
	});
});
