import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IPluginManifest } from "../../src/plugin/types";
import {
	debounce,
	deepClone,
	filterActiveExtensions,
	generatePluginId,
	isValidPluginId,
	sortExtensionPoints,
	validatePluginManifest,
} from "../../src/plugin/utils";

describe("Plugin Utils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("validatePluginManifest", () => {
		it("should validate a correct manifest", () => {
			const validManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			expect(validatePluginManifest(validManifest)).toBe(true);
		});

		it("should reject invalid manifest types", () => {
			expect(validatePluginManifest(null)).toBe(false);
			expect(validatePluginManifest(undefined)).toBe(false);
			expect(validatePluginManifest("string")).toBe(false);
			expect(validatePluginManifest(123)).toBe(false);
		});

		it("should reject manifest with missing required fields", () => {
			const invalidManifest = {
				name: "Test Plugin",
				// missing pluginId, version, etc.
			};

			expect(validatePluginManifest(invalidManifest)).toBe(false);
		});

		it("should reject manifest with invalid version format", () => {
			const invalidManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "invalid-version",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			expect(validatePluginManifest(invalidManifest)).toBe(false);
		});

		it("should reject manifest with invalid pluginId format", () => {
			const invalidManifest = {
				name: "Test Plugin",
				pluginId: "Invalid-Plugin-ID",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			expect(validatePluginManifest(invalidManifest)).toBe(false);
		});
	});

	describe("generatePluginId", () => {
		it("should generate valid plugin IDs", () => {
			expect(generatePluginId("Test Plugin")).toBe("test_plugin");
			expect(generatePluginId("My Awesome Plugin!")).toBe("my_awesome_plugin");
			expect(generatePluginId("Plugin-123")).toBe("plugin123");
			expect(generatePluginId("  Plugin  Name  ")).toBe("plugin_name");
		});

		it("should handle special characters", () => {
			expect(generatePluginId("Plugin@#$%")).toBe("plugin");
			expect(generatePluginId("Test-Plugin")).toBe("testplugin");
			expect(generatePluginId("Plugin_Name")).toBe("plugin_name");
		});

		it("should handle empty and whitespace strings", () => {
			expect(generatePluginId("")).toBe("");
			expect(generatePluginId("   ")).toBe("");
			expect(generatePluginId("  _  ")).toBe("");
		});
	});

	describe("isValidPluginId", () => {
		it("should validate correct plugin IDs", () => {
			expect(isValidPluginId("test_plugin")).toBe(true);
			expect(isValidPluginId("myplugin")).toBe(true);
			expect(isValidPluginId("plugin123")).toBe(true);
			expect(isValidPluginId("testPlugin")).toBe(true);
		});

		it("should reject invalid plugin IDs", () => {
			expect(isValidPluginId("")).toBe(false);
			expect(isValidPluginId("123plugin")).toBe(false);
			expect(isValidPluginId("Plugin-Name")).toBe(false);
			expect(isValidPluginId("plugin@name")).toBe(false);
			expect(isValidPluginId("plugin name")).toBe(false);
		});

		it("should handle non-string inputs", () => {
			expect(isValidPluginId(null as unknown as string)).toBe(false);
			expect(isValidPluginId(undefined as unknown as string)).toBe(false);
			expect(isValidPluginId(123 as unknown as string)).toBe(false);
		});
	});

	describe("sortExtensionPoints", () => {
		it("should sort by order property", () => {
			const items = [
				{ id: "1", order: 3 },
				{ id: "2", order: 1 },
				{ id: "3", order: 2 },
			];

			const sorted = sortExtensionPoints(items);

			expect(sorted[0]?.id).toBe("2");
			expect(sorted[1]?.id).toBe("3");
			expect(sorted[2]?.id).toBe("1");
		});

		it("should handle items without order property", () => {
			const items = [{ id: "1", order: 1 }, { id: "2" }, { id: "3", order: 0 }];

			const sorted = sortExtensionPoints(items);

			// Check that the item with order 1 comes last
			const lastItem = sorted[sorted.length - 1];
			expect(lastItem?.order).toBe(1);

			// Check that the first two items have order 0 or undefined
			expect(sorted[0]?.order === 0 || sorted[0]?.order === undefined).toBe(
				true,
			);
			expect(sorted[1]?.order === 0 || sorted[1]?.order === undefined).toBe(
				true,
			);
		});
	});

	describe("filterActiveExtensions", () => {
		it("should filter extensions by active plugins", () => {
			const extensions = [
				{ id: "1", pluginId: "plugin1" },
				{ id: "2", pluginId: "plugin2" },
				{ id: "3", pluginId: "plugin1" },
				{ id: "4", pluginId: "plugin3" },
			];

			const activePlugins = new Set<string>(["plugin1", "plugin3"]);

			const filtered = filterActiveExtensions(extensions, activePlugins);

			expect(filtered).toHaveLength(3);
			expect(filtered.map((e) => e.id)).toEqual(["1", "3", "4"]);
		});

		it("should return empty array when no active plugins", () => {
			const extensions = [
				{ id: "1", pluginId: "plugin1" },
				{ id: "2", pluginId: "plugin2" },
			];

			const activePlugins = new Set<string>();

			const filtered = filterActiveExtensions(extensions, activePlugins);

			expect(filtered).toHaveLength(0);
		});
	});

	describe("debounce", () => {
		it("should debounce function calls", async () => {
			const mockFn = vi.fn();
			const debouncedFn = debounce(mockFn, 100);

			debouncedFn("arg1");
			debouncedFn("arg2");
			debouncedFn("arg3");

			expect(mockFn).not.toHaveBeenCalled();

			await new Promise((resolve) => setTimeout(resolve, 150));

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith("arg3");
		});
	});

	describe("deepClone", () => {
		it("should clone primitive values", () => {
			expect(deepClone(42)).toBe(42);
			expect(deepClone("test")).toBe("test");
			expect(deepClone(true)).toBe(true);
			expect(deepClone(null)).toBe(null);
		});

		it("should clone objects", () => {
			const original = { a: 1, b: { c: 2 } };
			const cloned = deepClone(original);

			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
			expect(cloned.b).not.toBe(original.b);
		});

		it("should clone arrays", () => {
			const original = [1, 2, { a: 3 }];
			const cloned = deepClone(original);

			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
			expect(cloned[2]).not.toBe(original[2]);
		});
	});

	describe("Utility Functions", () => {
		it("should have all required utility functions", () => {
			// Test that all utility functions exist and are callable
			expect(typeof validatePluginManifest).toBe("function");
			expect(typeof generatePluginId).toBe("function");
			expect(typeof isValidPluginId).toBe("function");
			expect(typeof sortExtensionPoints).toBe("function");
			expect(typeof filterActiveExtensions).toBe("function");
			expect(typeof debounce).toBe("function");
			expect(typeof deepClone).toBe("function");
		});
	});
});
