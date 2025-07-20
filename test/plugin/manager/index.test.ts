import { describe, expect, it } from "vitest";

describe("Plugin Manager Index", () => {
	it("should export PluginManager as default", async () => {
		const module = await import("../../../src/plugin/manager/index");

		// Test default export
		expect(module.default).toBeDefined();
		expect(typeof module.default).toBe("function");

		// Test named export
		expect(module.PluginManager).toBeDefined();
		expect(typeof module.PluginManager).toBe("function");

		// Both should be the same
		expect(module.default).toBe(module.PluginManager);
	});

	it("should export ExtensionLoader", async () => {
		const module = await import("../../../src/plugin/manager/index");

		expect(module.ExtensionLoader).toBeDefined();
		expect(typeof module.ExtensionLoader).toBe("function");
	});

	it("should export PluginLifecycle", async () => {
		const module = await import("../../../src/plugin/manager/index");

		expect(module.PluginLifecycle).toBeDefined();
		expect(typeof module.PluginLifecycle).toBe("function");
	});

	it("should export PluginRegistry", async () => {
		const module = await import("../../../src/plugin/manager/index");

		expect(module.PluginRegistry).toBeDefined();
		expect(typeof module.PluginRegistry).toBe("function");
	});

	it("should have all expected exports", async () => {
		const module = await import("../../../src/plugin/manager/index");

		const expectedExports = [
			"default",
			"PluginManager",
			"ExtensionLoader",
			"PluginLifecycle",
			"PluginRegistry",
		];

		for (const exportName of expectedExports) {
			expect(module).toHaveProperty(exportName);
		}
	});

	it("should export exactly the expected number of items", async () => {
		const module = await import("../../../src/plugin/manager/index");

		// Count the number of exports (excluding internal properties)
		const exportCount = Object.keys(module).filter(
			(key) =>
				!key.startsWith("__") &&
				key !== "default" &&
				typeof module[key as keyof typeof module] !== "undefined",
		).length;

		// Should have 4 named exports + default export
		expect(exportCount).toBe(4);
	});
});
