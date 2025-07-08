import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IPluginManifest } from "../../src/plugin/types";
import * as utils from "../../src/plugin/utils";

function mockDirent(name: string, isDir: boolean): fs.Dirent {
	return {
		name,
		isDirectory: () => isDir,
		isFile: () => !isDir,
		isBlockDevice: () => false,
		isCharacterDevice: () => false,
		isSymbolicLink: () => false,
		isFIFO: () => false,
		isSocket: () => false,
	} as unknown as fs.Dirent;
}

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

			expect(utils.validatePluginManifest(validManifest)).toBe(true);
		});

		it("should reject invalid manifest types", () => {
			expect(utils.validatePluginManifest(null)).toBe(false);
			expect(utils.validatePluginManifest(undefined)).toBe(false);
			expect(utils.validatePluginManifest("string")).toBe(false);
			expect(utils.validatePluginManifest(123)).toBe(false);
		});

		it("should reject manifest with missing required fields", () => {
			const invalidManifest = {
				name: "Test Plugin",
				// missing pluginId, version, etc.
			};

			expect(utils.validatePluginManifest(invalidManifest)).toBe(false);
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

			expect(utils.validatePluginManifest(invalidManifest)).toBe(false);
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

			expect(utils.validatePluginManifest(invalidManifest)).toBe(false);
		});
	});

	describe("generatePluginId", () => {
		it("should generate valid plugin IDs", () => {
			expect(utils.generatePluginId("Test Plugin")).toBe("test_plugin");
			expect(utils.generatePluginId("My Awesome Plugin!")).toBe(
				"my_awesome_plugin",
			);
			expect(utils.generatePluginId("Plugin-123")).toBe("plugin123");
			expect(utils.generatePluginId("  Plugin  Name  ")).toBe("plugin_name");
		});

		it("should handle special characters", () => {
			expect(utils.generatePluginId("Plugin@#$%")).toBe("plugin");
			expect(utils.generatePluginId("Test-Plugin")).toBe("testplugin");
			expect(utils.generatePluginId("Plugin_Name")).toBe("plugin_name");
		});

		it("should handle empty and whitespace strings", () => {
			expect(utils.generatePluginId("")).toBe("");
			expect(utils.generatePluginId("   ")).toBe("");
			expect(utils.generatePluginId("  _  ")).toBe("");
		});
	});

	describe("isValidPluginId", () => {
		it("should validate correct plugin IDs", () => {
			expect(utils.isValidPluginId("test_plugin")).toBe(true);
			expect(utils.isValidPluginId("myplugin")).toBe(true);
			expect(utils.isValidPluginId("plugin123")).toBe(true);
			expect(utils.isValidPluginId("testPlugin")).toBe(true);
		});

		it("should reject invalid plugin IDs", () => {
			expect(utils.isValidPluginId("")).toBe(false);
			expect(utils.isValidPluginId("123plugin")).toBe(false);
			expect(utils.isValidPluginId("Plugin-Name")).toBe(false);
			expect(utils.isValidPluginId("plugin@name")).toBe(false);
			expect(utils.isValidPluginId("plugin name")).toBe(false);
		});

		it("should handle non-string inputs", () => {
			expect(utils.isValidPluginId(null as unknown as string)).toBe(false);
			expect(utils.isValidPluginId(undefined as unknown as string)).toBe(false);
			expect(utils.isValidPluginId(123 as unknown as string)).toBe(false);
		});
	});

	describe("sortExtensionPoints", () => {
		it("should sort by order property", () => {
			const items = [
				{ id: "1", order: 3 },
				{ id: "2", order: 1 },
				{ id: "3", order: 2 },
			];

			const sorted = utils.sortExtensionPoints(items);

			expect(sorted[0]?.id).toBe("2");
			expect(sorted[1]?.id).toBe("3");
			expect(sorted[2]?.id).toBe("1");
		});

		it("should handle items without order property", () => {
			const items = [{ id: "1", order: 1 }, { id: "2" }, { id: "3", order: 0 }];

			const sorted = utils.sortExtensionPoints(items);

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

			const filtered = utils.filterActiveExtensions(extensions, activePlugins);

			expect(filtered).toHaveLength(3);
			expect(filtered.map((e) => e.id)).toEqual(["1", "3", "4"]);
		});

		it("should return empty array when no active plugins", () => {
			const extensions = [
				{ id: "1", pluginId: "plugin1" },
				{ id: "2", pluginId: "plugin2" },
			];

			const activePlugins = new Set<string>();

			const filtered = utils.filterActiveExtensions(extensions, activePlugins);

			expect(filtered).toHaveLength(0);
		});
	});

	describe("debounce", () => {
		it("should debounce function calls", async () => {
			const mockFn = vi.fn();
			const debouncedFn = utils.debounce(mockFn, 100);

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
			expect(utils.deepClone(42)).toBe(42);
			expect(utils.deepClone("test")).toBe("test");
			expect(utils.deepClone(true)).toBe(true);
			expect(utils.deepClone(null)).toBe(null);
		});

		it("should clone objects", () => {
			const original = { a: 1, b: { c: 2 } };
			const cloned = utils.deepClone(original);

			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
			expect(cloned.b).not.toBe(original.b);
		});

		it("should clone arrays", () => {
			const original = [1, 2, { a: 3 }];
			const cloned = utils.deepClone(original);

			expect(cloned).toEqual(original);
			expect(cloned).not.toBe(original);
			expect(cloned[2]).not.toBe(original[2]);
		});
	});

	describe("Utility Functions", () => {
		it("should have all required utility functions", () => {
			// Test that all utility functions exist and are callable
			expect(typeof utils.validatePluginManifest).toBe("function");
			expect(typeof utils.generatePluginId).toBe("function");
			expect(typeof utils.isValidPluginId).toBe("function");
			expect(typeof utils.sortExtensionPoints).toBe("function");
			expect(typeof utils.filterActiveExtensions).toBe("function");
			expect(typeof utils.debounce).toBe("function");
			expect(typeof utils.deepClone).toBe("function");
		});
	});

	describe("scanPluginsDirectory", () => {
		it("should return plugin IDs for directories with manifest.json", async () => {
			const readdirSpy = vi
				.spyOn(fs.promises, "readdir")
				.mockResolvedValue([
					mockDirent("pluginA", true),
					mockDirent("notAPlugin", false),
					mockDirent("pluginB", true),
				]);
			const accessSpy = vi
				.spyOn(fs.promises, "access")
				.mockImplementation(async (p) => {
					if (p.toString().includes("pluginA")) return;
					if (p.toString().includes("pluginB")) return;
					throw new Error("no manifest");
				});
			const plugins = await utils.scanPluginsDirectory("/plugins");
			expect(plugins).toContain("pluginA");
			expect(plugins).toContain("pluginB");
			expect(plugins).not.toContain("notAPlugin");
			readdirSpy.mockRestore();
			accessSpy.mockRestore();
		});

		it("should return empty array if directory does not exist", async () => {
			vi.spyOn(fs.promises, "readdir").mockRejectedValue(new Error("fail"));
			const plugins = await utils.scanPluginsDirectory("/bad");
			expect(plugins).toEqual([]);
		});
	});

	describe("safeRequire", () => {
		it("should return null if import fails", async () => {
			const result = await utils.safeRequire("/bad/module");
			expect(result).toBeNull();
		});
	});

	describe("directoryExists", () => {
		it("should return true if directory exists", async () => {
			vi.spyOn(fs.promises, "stat").mockResolvedValue({
				isDirectory: () => true,
			} as fs.Stats);
			const exists = await utils.directoryExists("/exists");
			expect(exists).toBe(true);
		});
		it("should return false if directory does not exist", async () => {
			vi.spyOn(fs.promises, "stat").mockRejectedValue(new Error("fail"));
			const exists = await utils.directoryExists("/nope");
			expect(exists).toBe(false);
		});
	});

	describe("ensureDirectory", () => {
		it("should create directory if not exists", async () => {
			const mkdirSpy = vi
				.spyOn(fs.promises, "mkdir")
				.mockResolvedValue(undefined);
			await expect(utils.ensureDirectory("/newdir")).resolves.not.toThrow();
			mkdirSpy.mockRestore();
		});
		it("should throw if mkdir fails", async () => {
			vi.spyOn(fs.promises, "mkdir").mockRejectedValue(new Error("fail"));
			await expect(utils.ensureDirectory("/faildir")).rejects.toThrow("fail");
		});
	});

	describe("normalizeImportPath", () => {
		it("should normalize and join paths", () => {
			const base = "/base";
			const rel = "foo/bar.js";
			const result = utils.normalizeImportPath(base, rel);
			expect(result).toContain("base");
			expect(result).toContain("foo/bar.js");
			expect(result).not.toContain("\\");
		});
	});

	describe("generateCreateTableSQL and generateCreateIndexSQL", () => {
		it("should generate SQL for a simple table definition", () => {
			const tableDef = {
				[Symbol.for("drizzle:Name")]: "test_table",
				[Symbol.for("drizzle:Columns")]: {
					id: {
						name: "id",
						columnType: "PgUUID",
						notNull: true,
						primary: true,
					},
					name: { name: "name", columnType: "PgText", notNull: true },
				},
				[Symbol.for("drizzle:Indexes")]: [
					{ columns: [{ name: "name" }], unique: true },
				],
			};
			const sql = utils.generateCreateTableSQL(tableDef, "plugin1");
			expect(sql).toContain("CREATE TABLE IF NOT EXISTS");
			expect(sql).toContain("test_table");
			const indexes = utils.generateCreateIndexSQL(tableDef, "plugin1");
			expect(indexes[0]).toContain("CREATE UNIQUE INDEX");
		});
	});

	describe("loadPluginManifest", () => {
		it("should load and validate a valid manifest", async () => {
			const mockManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};
			const readFileSpy = vi
				.spyOn(fs.promises, "readdir")
				.mockResolvedValue([]);
			const writeFileSpy = vi
				.spyOn(fs.promises, "writeFile")
				.mockResolvedValue();
			const accessSpy = vi.spyOn(fs.promises, "access").mockResolvedValue();
			// Create a temporary manifest file
			const tempDir = "/tmp/test_plugin";
			vi.spyOn(fs.promises, "readFile").mockResolvedValue(
				JSON.stringify(mockManifest),
			);
			const result = await utils.loadPluginManifest(tempDir);
			expect(result).toEqual(mockManifest);
			readFileSpy.mockRestore();
			writeFileSpy.mockRestore();
			accessSpy.mockRestore();
		});

		it("should throw error for invalid manifest", async () => {
			const invalidManifest = { name: "Test" }; // Missing required fields
			vi.spyOn(fs.promises, "readFile").mockResolvedValue(
				JSON.stringify(invalidManifest),
			);

			await expect(
				utils.loadPluginManifest("/tmp/test_plugin"),
			).rejects.toThrow("Invalid manifest format");
		});

		it("should throw error for invalid JSON", async () => {
			vi.spyOn(fs.promises, "readFile").mockResolvedValue("invalid json");

			await expect(
				utils.loadPluginManifest("/tmp/test_plugin"),
			).rejects.toThrow("Failed to load plugin manifest");
		});

		it("should throw error for file read failure", async () => {
			vi.spyOn(fs.promises, "readFile").mockRejectedValue(
				new Error("File not found"),
			);

			await expect(
				utils.loadPluginManifest("/tmp/test_plugin"),
			).rejects.toThrow("Failed to load plugin manifest");
		});
	});

	describe("createPluginTables", () => {
		it("should create tables successfully", async () => {
			const mockDb = {
				execute: vi.fn().mockResolvedValue({}),
			};
			const mockLogger = {
				info: vi.fn(),
			};
			const tableDefinitions = {
				test_table: {
					[Symbol.for("drizzle:Name")]: "test_table",
					[Symbol.for("drizzle:Columns")]: {
						id: {
							name: "id",
							columnType: "PgUUID",
							notNull: true,
							primary: true,
						},
					},
					[Symbol.for("drizzle:Indexes")]: [],
				},
			};

			await utils.createPluginTables(
				mockDb,
				"test_plugin",
				tableDefinitions,
				mockLogger,
			);

			expect(mockDb.execute).toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it("should handle table creation errors", async () => {
			const mockDb = {
				execute: vi.fn().mockRejectedValue(new Error("Database error")),
			};
			const tableDefinitions = {
				test_table: {
					[Symbol.for("drizzle:Name")]: "test_table",
					[Symbol.for("drizzle:Columns")]: {
						id: {
							name: "id",
							columnType: "PgUUID",
							notNull: true,
							primary: true,
						},
					},
					[Symbol.for("drizzle:Indexes")]: [],
				},
			};

			await expect(
				utils.createPluginTables(mockDb, "test_plugin", tableDefinitions),
			).rejects.toThrow("Database error");
		});
	});

	describe("dropPluginTables", () => {
		it("should drop tables successfully", async () => {
			const mockDb = {
				execute: vi.fn().mockResolvedValue({}),
			};
			const mockLogger = {
				info: vi.fn(),
			};
			const tableDefinitions = {
				test_table: {
					[Symbol.for("drizzle:Name")]: "test_table",
				},
			};

			await utils.dropPluginTables(
				mockDb,
				"test_plugin",
				tableDefinitions,
				mockLogger,
			);

			expect(mockDb.execute).toHaveBeenCalledWith(
				'DROP TABLE IF EXISTS "test_plugin_test_table" CASCADE;',
			);
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it("should handle drop table errors gracefully", async () => {
			const mockDb = {
				execute: vi.fn().mockRejectedValue(new Error("Drop error")),
			};
			const mockLogger = {
				info: vi.fn(),
			};
			const tableDefinitions = {
				test_table: {
					[Symbol.for("drizzle:Name")]: "test_table",
				},
			};

			// Should not throw, just log the error
			await utils.dropPluginTables(
				mockDb,
				"test_plugin",
				tableDefinitions,
				mockLogger,
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining("Error dropping table"),
			);
		});

		it("should handle overall drop process errors", async () => {
			const mockDb = {
				execute: vi.fn().mockRejectedValue(new Error("Process error")),
			};
			const mockLogger = {
				info: vi.fn(),
			};
			const tableDefinitions = {
				test_table: {
					[Symbol.for("drizzle:Name")]: "test_table",
				},
			};

			await utils.dropPluginTables(
				mockDb,
				"test_plugin",
				tableDefinitions,
				mockLogger,
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining("Error dropping table"),
			);
		});
	});
});
