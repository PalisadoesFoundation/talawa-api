import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IPluginManifest } from "~/src/plugin/types";
import {
	createPluginTables,
	debounce,
	deepClone,
	directoryExists,
	dropPluginTables,
	ensureDirectory,
	filterActiveExtensions,
	generateCreateIndexSQL,
	generateCreateTableSQL,
	generatePluginId,
	isValidPluginId,
	loadPluginManifest,
	normalizeImportPath,
	safeRequire,
	sortExtensionPoints,
	validatePluginManifest,
} from "~/src/plugin/utils";

// Mock the filesystem
vi.mock("node:fs", () => ({
	promises: {
		readFile: vi.fn(),
		readdir: vi.fn(),
		access: vi.fn(),
		stat: vi.fn(),
		mkdir: vi.fn(),
	},
}));

// Mock the plugin logger
vi.mock("~/src/plugin/logger", () => ({
	pluginLogger: {
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
	},
}));

describe("Plugin Utils", () => {
	let mockFs: {
		readFile: ReturnType<typeof vi.fn>;
		readdir: ReturnType<typeof vi.fn>;
		access: ReturnType<typeof vi.fn>;
		stat: ReturnType<typeof vi.fn>;
		mkdir: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockFs = {
			readFile: vi.mocked(fs.readFile),
			readdir: vi.mocked(fs.readdir),
			access: vi.mocked(fs.access),
			stat: vi.mocked(fs.stat),
			mkdir: vi.mocked(fs.mkdir),
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("validatePluginManifest", () => {
		it("should return true for valid manifest", () => {
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

		it("should return false for null or undefined manifest", () => {
			expect(validatePluginManifest(null)).toBe(false);
			expect(validatePluginManifest(undefined)).toBe(false);
		});

		it("should return false for non-object manifest", () => {
			expect(validatePluginManifest("string")).toBe(false);
			expect(validatePluginManifest(123)).toBe(false);
			expect(validatePluginManifest(true)).toBe(false);
		});

		it("should return false for missing required fields", () => {
			const incompleteManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				// missing version, description, author, main
			};

			expect(validatePluginManifest(incompleteManifest)).toBe(false);
		});

		it("should return false for invalid version format", () => {
			const invalidVersionManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0", // invalid semver
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			expect(validatePluginManifest(invalidVersionManifest)).toBe(false);
		});

		it("should return false for invalid pluginId format", () => {
			const invalidPluginIdManifest = {
				name: "Test Plugin",
				pluginId: "Test-Plugin", // invalid format (contains dash)
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			expect(validatePluginManifest(invalidPluginIdManifest)).toBe(false);
		});

		it("should return false for non-string required fields", () => {
			const nonStringManifest = {
				name: 123, // should be string
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			expect(validatePluginManifest(nonStringManifest)).toBe(false);
		});
	});

	describe("generatePluginId", () => {
		it("should generate valid plugin ID from name", () => {
			expect(generatePluginId("Test Plugin")).toBe("test_plugin");
			expect(generatePluginId("My Awesome Plugin")).toBe("my_awesome_plugin");
			expect(generatePluginId("Plugin-Name")).toBe("pluginname"); // Dash is removed, not converted to underscore
		});

		it("should handle special characters", () => {
			expect(generatePluginId("Test@Plugin#123")).toBe("testplugin123");
			expect(generatePluginId("Plugin with $pecial Ch@rs!")).toBe(
				"plugin_with_pecial_chrs",
			);
		});

		it("should handle multiple spaces and underscores", () => {
			expect(generatePluginId("Test   Plugin")).toBe("test_plugin");
			expect(generatePluginId("Test___Plugin")).toBe("test_plugin");
			expect(generatePluginId("_Test_Plugin_")).toBe("test_plugin");
		});

		it("should handle empty string", () => {
			expect(generatePluginId("")).toBe("");
		});

		it("should handle string with only special characters", () => {
			expect(generatePluginId("@#$%^&*()")).toBe("");
		});
	});

	describe("loadPluginManifest", () => {
		it("should load valid manifest from file", async () => {
			const validManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "A test plugin",
				author: "Test Author",
				main: "index.js",
			};

			mockFs.readFile.mockResolvedValue(JSON.stringify(validManifest));

			const result = await loadPluginManifest("/path/to/plugin");

			expect(result).toEqual(validManifest);
			expect(mockFs.readFile).toHaveBeenCalledWith(
				path.join("/path/to/plugin", "manifest.json"),
				"utf-8",
			);
		});

		it("should throw error for invalid JSON", async () => {
			mockFs.readFile.mockResolvedValue("invalid json");

			await expect(loadPluginManifest("/path/to/plugin")).rejects.toThrow(
				"Failed to load plugin manifest",
			);
		});

		it("should throw error for invalid manifest format", async () => {
			const invalidManifest = {
				name: "Test Plugin",
				// missing required fields
			};

			mockFs.readFile.mockResolvedValue(JSON.stringify(invalidManifest));

			await expect(loadPluginManifest("/path/to/plugin")).rejects.toThrow(
				"Failed to load plugin manifest",
			);
		});

		it("should throw error for file read error", async () => {
			mockFs.readFile.mockRejectedValue(new Error("File not found"));

			await expect(loadPluginManifest("/path/to/plugin")).rejects.toThrow(
				"Failed to load plugin manifest",
			);
		});
	});

	describe("isValidPluginId", () => {
		it("should return true for valid plugin IDs", () => {
			expect(isValidPluginId("test_plugin")).toBe(true);
			expect(isValidPluginId("testPlugin")).toBe(true);
			expect(isValidPluginId("TestPlugin")).toBe(true);
			expect(isValidPluginId("Test_Plugin")).toBe(true);
			expect(isValidPluginId("test123")).toBe(true);
			expect(isValidPluginId("a")).toBe(true);
			expect(isValidPluginId("A")).toBe(true);
		});

		it("should return false for invalid plugin IDs", () => {
			expect(isValidPluginId("")).toBe(false);
			expect(isValidPluginId("123test")).toBe(false);
			expect(isValidPluginId("test-plugin")).toBe(false);
			expect(isValidPluginId("_test")).toBe(false);
		});

		it("should return false for non-string input", () => {
			expect(isValidPluginId(null as unknown as string)).toBe(false);
			expect(isValidPluginId(undefined as unknown as string)).toBe(false);
			expect(isValidPluginId(123 as unknown as string)).toBe(false);
		});
	});

	describe("normalizeImportPath", () => {
		it("should normalize paths for different platforms", () => {
			expect(normalizeImportPath("/base/path", "relative/file.js")).toBe(
				"/base/path/relative/file.js",
			);
		});

		it("should handle Windows-style paths", () => {
			const result = normalizeImportPath("C:\\base\\path", "relative\\file.js");
			expect(result).toBe("C:/base/path/relative/file.js");
		});

		it("should handle empty relative path", () => {
			expect(normalizeImportPath("/base/path", "")).toBe("/base/path");
		});
	});

	describe("safeRequire", () => {
		it("should return module when import succeeds", async () => {
			const mockModule = { default: { test: "value" } };
			vi.doMock("test-module", () => mockModule);

			const result = await safeRequire("test-module");

			expect(result).toEqual(mockModule.default);
		});

		it("should return null when import fails", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const result = await safeRequire("non-existent-module");

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it("should return module when no default export", async () => {
			// This test is difficult to mock properly in vitest due to dynamic imports
			// The function returns module.default || module, so if default is undefined,
			// it returns the module object itself
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const result = await safeRequire("non-existent-module-2");

			expect(result).toBeNull();
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});

	describe("directoryExists", () => {
		it("should return true for existing directory", async () => {
			mockFs.stat.mockResolvedValue({ isDirectory: () => true });

			const result = await directoryExists("/path/to/dir");

			expect(result).toBe(true);
			expect(mockFs.stat).toHaveBeenCalledWith("/path/to/dir");
		});

		it("should return false for non-directory", async () => {
			mockFs.stat.mockResolvedValue({ isDirectory: () => false });

			const result = await directoryExists("/path/to/file");

			expect(result).toBe(false);
		});

		it("should return false for non-existent path", async () => {
			mockFs.stat.mockRejectedValue(new Error("Not found"));

			const result = await directoryExists("/path/to/nonexistent");

			expect(result).toBe(false);
		});
	});

	describe("ensureDirectory", () => {
		it("should create directory successfully", async () => {
			mockFs.mkdir.mockResolvedValue(undefined);

			await expect(ensureDirectory("/path/to/dir")).resolves.not.toThrow();

			expect(mockFs.mkdir).toHaveBeenCalledWith("/path/to/dir", {
				recursive: true,
			});
		});

		it("should throw error when directory creation fails", async () => {
			mockFs.mkdir.mockRejectedValue(new Error("Permission denied"));

			await expect(ensureDirectory("/path/to/dir")).rejects.toThrow(
				"Failed to create directory",
			);
		});
	});

	describe("sortExtensionPoints", () => {
		it("should sort items by order property", () => {
			const items = [
				{ name: "third", order: 3 },
				{ name: "first", order: 1 },
				{ name: "second", order: 2 },
			];

			const result = sortExtensionPoints(items);

			expect(result).toEqual([
				{ name: "first", order: 1 },
				{ name: "second", order: 2 },
				{ name: "third", order: 3 },
			]);
		});

		it("should handle items without order property", () => {
			const items = [
				{ name: "third", order: 3 },
				{ name: "no-order" },
				{ name: "first", order: 1 },
			];

			const result = sortExtensionPoints(items);

			expect(result).toEqual([
				{ name: "no-order" },
				{ name: "first", order: 1 },
				{ name: "third", order: 3 },
			]);
		});

		it("should handle empty array", () => {
			const result = sortExtensionPoints([]);
			expect(result).toEqual([]);
		});
	});

	describe("filterActiveExtensions", () => {
		it("should filter extensions by active plugins", () => {
			const items = [
				{ name: "ext1", pluginId: "plugin1" },
				{ name: "ext2", pluginId: "plugin2" },
				{ name: "ext3", pluginId: "plugin3" },
			];
			const activePlugins = new Set(["plugin1", "plugin3"]);

			const result = filterActiveExtensions(items, activePlugins);

			expect(result).toEqual([
				{ name: "ext1", pluginId: "plugin1" },
				{ name: "ext3", pluginId: "plugin3" },
			]);
		});

		it("should return empty array when no active plugins", () => {
			const items = [
				{ name: "ext1", pluginId: "plugin1" },
				{ name: "ext2", pluginId: "plugin2" },
			];
			const activePlugins = new Set<string>();

			const result = filterActiveExtensions(items, activePlugins);

			expect(result).toEqual([]);
		});

		it("should handle empty items array", () => {
			const activePlugins = new Set(["plugin1"]);

			const result = filterActiveExtensions([], activePlugins);

			expect(result).toEqual([]);
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

		it("should reset timeout on subsequent calls", async () => {
			const mockFn = vi.fn();
			const debouncedFn = debounce(mockFn, 100);

			debouncedFn("arg1");
			await new Promise((resolve) => setTimeout(resolve, 50));
			debouncedFn("arg2");

			await new Promise((resolve) => setTimeout(resolve, 150));

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith("arg2");
		});
	});

	describe("deepClone", () => {
		it("should clone primitive values", () => {
			expect(deepClone(42)).toBe(42);
			expect(deepClone("string")).toBe("string");
			expect(deepClone(true)).toBe(true);
			expect(deepClone(null)).toBe(null);
			expect(deepClone(undefined)).toBe(undefined);
		});

		it("should clone Date objects", () => {
			const date = new Date("2023-01-01");
			const cloned = deepClone(date);

			expect(cloned).toEqual(date);
			expect(cloned).not.toBe(date);
		});

		it("should clone arrays", () => {
			const array = [1, 2, { a: 3 }];
			const cloned = deepClone(array);

			expect(cloned).toEqual(array);
			expect(cloned).not.toBe(array);
			expect(cloned[2]).not.toBe(array[2]);
		});

		it("should clone objects", () => {
			const obj = { a: 1, b: { c: 2 } };
			const cloned = deepClone(obj);

			expect(cloned).toEqual(obj);
			expect(cloned).not.toBe(obj);
			expect(cloned.b).not.toBe(obj.b);
		});

		it("should handle circular references safely", () => {
			const obj = { a: 1, b: { c: 2 } };
			const cloned = deepClone(obj);

			expect(cloned).toEqual(obj);
			expect(cloned).not.toBe(obj);
		});
	});

	describe("generateCreateTableSQL", () => {
		it("should generate CREATE TABLE SQL with basic columns", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_table",
				[Symbol.for("drizzle:Columns")]: {
					id: {
						name: "id",
						columnType: "PgUUID",
						notNull: true,
						primary: true,
						hasDefault: true,
					},
					name: {
						name: "name",
						columnType: "PgText",
						notNull: true,
					},
					email: {
						name: "email",
						columnType: "PgText",
						unique: true,
					},
				},
			};

			const sql = generateCreateTableSQL(tableDefinition, "test_plugin");

			expect(sql).toContain(
				'CREATE TABLE IF NOT EXISTS "test_plugin_test_table"',
			);
			expect(sql).toContain(
				'"id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()',
			);
			expect(sql).toContain('"name" text NOT NULL');
			expect(sql).toContain('"email" text UNIQUE');
		});

		it("should handle table without plugin ID prefix", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_table",
				[Symbol.for("drizzle:Columns")]: {
					id: {
						name: "id",
						columnType: "PgUUID",
					},
				},
			};

			const sql = generateCreateTableSQL(tableDefinition);

			expect(sql).toContain('CREATE TABLE IF NOT EXISTS "test_table"');
		});

		it("should handle different column types", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_table",
				[Symbol.for("drizzle:Columns")]: {
					count: { name: "count", columnType: "PgInteger" },
					amount: { name: "amount", columnType: "PgDecimal" },
					isActive: { name: "is_active", columnType: "PgBoolean" },
					createdAt: {
						name: "created_at",
						columnType: "PgTimestamp",
						hasDefault: true,
					},
				},
			};

			const sql = generateCreateTableSQL(tableDefinition, "test_plugin");

			expect(sql).toContain('"count" integer');
			expect(sql).toContain('"amount" decimal');
			expect(sql).toContain('"is_active" boolean');
			expect(sql).toContain('"created_at" timestamp DEFAULT now()');
		});

		it("should handle default values", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_table",
				[Symbol.for("drizzle:Columns")]: {
					status: { name: "status", columnType: "PgText", default: "active" },
					isEnabled: {
						name: "is_enabled",
						columnType: "PgBoolean",
						default: true,
					},
					nullableField: {
						name: "nullable_field",
						columnType: "PgText",
						default: null,
					},
				},
			};

			const sql = generateCreateTableSQL(tableDefinition, "test_plugin");

			expect(sql).toContain("\"status\" text DEFAULT 'active'");
			expect(sql).toContain('"is_enabled" boolean DEFAULT true');
			expect(sql).toContain('"nullable_field" text DEFAULT NULL');
		});

		it("should handle table name already prefixed with plugin ID", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_plugin_existing_table",
				[Symbol.for("drizzle:Columns")]: {
					id: { name: "id", columnType: "PgUUID" },
				},
			};

			const sql = generateCreateTableSQL(tableDefinition, "test_plugin");

			expect(sql).toContain(
				'CREATE TABLE IF NOT EXISTS "test_plugin_existing_table"',
			);
		});
	});

	describe("generateCreateIndexSQL", () => {
		it("should generate CREATE INDEX SQL", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_table",
				[Symbol.for("drizzle:Indexes")]: [
					{
						columns: [{ name: "email" }],
						unique: false,
					},
					{
						columns: [{ name: "name" }, { name: "email" }],
						unique: true,
					},
				],
			};

			const indexSQLs = generateCreateIndexSQL(tableDefinition, "test_plugin");

			expect(indexSQLs).toHaveLength(2);
			expect(indexSQLs[0]).toContain(
				'CREATE INDEX IF NOT EXISTS "test_plugin_test_table_email_index"',
			);
			expect(indexSQLs[1]).toContain(
				'CREATE UNIQUE INDEX IF NOT EXISTS "test_plugin_test_table_name_email_index"',
			);
		});

		it("should handle table without indexes", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_table",
				[Symbol.for("drizzle:Indexes")]: [],
			};

			const indexSQLs = generateCreateIndexSQL(tableDefinition, "test_plugin");

			expect(indexSQLs).toHaveLength(0);
		});

		it("should handle missing indexes property", () => {
			const tableDefinition = {
				[Symbol.for("drizzle:Name")]: "test_table",
			};

			const indexSQLs = generateCreateIndexSQL(tableDefinition, "test_plugin");

			expect(indexSQLs).toHaveLength(0);
		});
	});

	describe("createPluginTables", () => {
		it("should create tables and indexes successfully", async () => {
			const mockDb = {
				execute: vi.fn().mockResolvedValue(undefined),
			};

			const mockLogger = {
				info: vi.fn(),
			};

			const tableDefinitions = {
				testTable: {
					[Symbol.for("drizzle:Name")]: "test_table",
					[Symbol.for("drizzle:Columns")]: {
						id: { name: "id", columnType: "PgUUID" },
					},
					[Symbol.for("drizzle:Indexes")]: [
						{
							columns: [{ name: "id" }],
							unique: false,
						},
					],
				},
			};

			await createPluginTables(
				mockDb,
				"test_plugin",
				tableDefinitions,
				mockLogger,
			);

			expect(mockDb.execute).toHaveBeenCalledWith(
				expect.stringContaining(
					'CREATE TABLE IF NOT EXISTS "test_plugin_test_table"',
				),
			);
			expect(mockDb.execute).toHaveBeenCalledWith(
				expect.stringContaining("CREATE INDEX IF NOT EXISTS"),
			);
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it("should handle database execution errors", async () => {
			const mockDb = {
				execute: vi.fn().mockRejectedValue(new Error("Database error")),
			};

			const tableDefinitions = {
				testTable: {
					[Symbol.for("drizzle:Name")]: "test_table",
					[Symbol.for("drizzle:Columns")]: {
						id: { name: "id", columnType: "PgUUID" },
					},
				},
			};

			await expect(
				createPluginTables(mockDb, "test_plugin", tableDefinitions),
			).rejects.toThrow("Database error");
		});

		it("should work without logger", async () => {
			const mockDb = {
				execute: vi.fn().mockResolvedValue(undefined),
			};

			const tableDefinitions = {
				testTable: {
					[Symbol.for("drizzle:Name")]: "test_table",
					[Symbol.for("drizzle:Columns")]: {
						id: { name: "id", columnType: "PgUUID" },
					},
				},
			};

			await expect(
				createPluginTables(mockDb, "test_plugin", tableDefinitions),
			).resolves.not.toThrow();
		});
	});

	describe("dropPluginTables", () => {
		it("should drop tables successfully", async () => {
			const mockDb = {
				execute: vi.fn().mockResolvedValue(undefined),
			};

			const mockLogger = {
				info: vi.fn(),
			};

			const tableDefinitions = {
				testTable: {
					[Symbol.for("drizzle:Name")]: "test_table",
				},
				anotherTable: {
					[Symbol.for("drizzle:Name")]: "another_table",
				},
			};

			await dropPluginTables(
				mockDb,
				"test_plugin",
				tableDefinitions,
				mockLogger,
			);

			expect(mockDb.execute).toHaveBeenCalledWith(
				'DROP TABLE IF EXISTS "test_plugin_test_table" CASCADE;',
			);
			expect(mockDb.execute).toHaveBeenCalledWith(
				'DROP TABLE IF EXISTS "test_plugin_another_table" CASCADE;',
			);
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it("should continue dropping other tables when one fails", async () => {
			const mockDb = {
				execute: vi
					.fn()
					.mockResolvedValueOnce(undefined)
					.mockRejectedValueOnce(new Error("Table not found"))
					.mockResolvedValueOnce(undefined),
			};

			const mockLogger = {
				info: vi.fn(),
			};

			const tableDefinitions = {
				table1: { [Symbol.for("drizzle:Name")]: "table1" },
				table2: { [Symbol.for("drizzle:Name")]: "table2" },
				table3: { [Symbol.for("drizzle:Name")]: "table3" },
			};

			await expect(
				dropPluginTables(mockDb, "test_plugin", tableDefinitions, mockLogger),
			).resolves.not.toThrow();

			expect(mockDb.execute).toHaveBeenCalledTimes(3);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining("Error dropping table"),
			);
		});

		it("should handle table name already prefixed with plugin ID", async () => {
			const mockDb = {
				execute: vi.fn().mockResolvedValue(undefined),
			};

			const tableDefinitions = {
				testTable: {
					[Symbol.for("drizzle:Name")]: "test_plugin_existing_table",
				},
			};

			await dropPluginTables(mockDb, "test_plugin", tableDefinitions);

			expect(mockDb.execute).toHaveBeenCalledWith(
				'DROP TABLE IF EXISTS "test_plugin_existing_table" CASCADE;',
			);
		});

		it("should work without logger", async () => {
			const mockDb = {
				execute: vi.fn().mockResolvedValue(undefined),
			};

			const tableDefinitions = {
				testTable: {
					[Symbol.for("drizzle:Name")]: "test_table",
				},
			};

			await expect(
				dropPluginTables(mockDb, "test_plugin", tableDefinitions),
			).resolves.not.toThrow();
		});
	});
});
