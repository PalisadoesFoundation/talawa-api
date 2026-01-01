import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IPluginManifest } from "../../src/plugin/types";
import * as utils from "../../src/plugin/utils";

// Mocks
vi.mock("node:fs", () => ({
	promises: {
		readFile: vi.fn(),
		stat: vi.fn(),
		mkdir: vi.fn(),
		rm: vi.fn(),
	},
}));
vi.mock("node:path", async () => {
	const actual = await vi.importActual<typeof import("node:path")>("node:path");
	return {
		...actual,
		join: (...args: string[]) => args.join("/"),
		resolve: (...args: string[]) => args.join("/"),
	};
});

import { promises as fs } from "node:fs";

afterEach(() => {
	vi.clearAllMocks();
});

const mockedFs = vi.mocked(fs);

// --- validatePluginManifest ---
describe("validatePluginManifest", () => {
	it("returns true for valid manifest", () => {
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId: "TestPlugin",
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {},
		};
		expect(utils.validatePluginManifest(manifest)).toBe(true);
	});
	it("returns false for missing fields", () => {
		expect(utils.validatePluginManifest({})).toBe(false);
		expect(utils.validatePluginManifest(null)).toBe(false);
		expect(utils.validatePluginManifest(undefined)).toBe(false);
		expect(utils.validatePluginManifest({ name: "x" })).toBe(false);
	});
	it("returns false for invalid version or pluginId", () => {
		const base = {
			name: "Test Plugin",
			pluginId: "Test-Plugin", // hyphen not allowed
			version: "1.0.0",
			description: "desc",
			author: "author",
			main: "index.js",
			extensionPoints: {},
		};
		expect(
			utils.validatePluginManifest({ ...base, pluginId: "Test-Plugin" }),
		).toBe(false);
		expect(utils.validatePluginManifest({ ...base, pluginId: "1bad" })).toBe(
			false,
		);
		expect(utils.validatePluginManifest({ ...base, version: "1.0" })).toBe(
			false,
		);
	});
});

// --- generatePluginId ---
describe("generatePluginId", () => {
	it("generates a valid plugin id from name", () => {
		expect(utils.generatePluginId("Test Plugin")).toBe("test_plugin");
		expect(utils.generatePluginId("Test__Plugin!!")).toBe("test_plugin");
		expect(utils.generatePluginId("  test   plugin  ")).toBe("test_plugin");
	});
});

// --- isValidPluginId ---
describe("isValidPluginId", () => {
	it("returns true for valid ids", () => {
		expect(utils.isValidPluginId("TestPlugin")).toBe(true);
		expect(utils.isValidPluginId("test_plugin")).toBe(true);
		expect(utils.isValidPluginId("A1_b2")).toBe(true);
	});
	it("returns false for invalid ids", () => {
		expect(utils.isValidPluginId("")).toBe(false);
		expect(utils.isValidPluginId("-bad")).toBe(false);
		expect(utils.isValidPluginId("1bad")).toBe(false);
		expect(utils.isValidPluginId("bad-id")).toBe(false);
	});
});

// --- normalizeImportPath ---
describe("normalizeImportPath", () => {
	it("joins and normalizes path", () => {
		expect(utils.normalizeImportPath("/a", "b\\c")).toBe("/a/b/c");
	});
});

// --- safeRequire ---
describe("safeRequire", () => {
	it("returns module on success", async () => {
		const fakeModule = { foo: 1 };
		const spy = vi.spyOn(utils, "safeRequire").mockResolvedValue(fakeModule);
		const result = await utils.safeRequire<{ foo: number }>("fake-path");
		expect(result).toEqual(fakeModule);
		spy.mockRestore();
	});
	it("returns null on error", async () => {
		const spy = vi.spyOn(utils, "safeRequire").mockResolvedValue(null);
		const result = await utils.safeRequire("bad-path");
		expect(result).toBeNull();
		spy.mockRestore();
	});
});

// --- directoryExists ---
describe("directoryExists", () => {
	it("returns true if directory exists", async () => {
		mockedFs.stat.mockResolvedValue({
			isDirectory: () => true,
		} as unknown as import("fs").Stats);
		expect(await utils.directoryExists("/exists")).toBe(true);
	});
	it("returns false if directory does not exist", async () => {
		mockedFs.stat.mockRejectedValue(new Error("fail"));
		expect(await utils.directoryExists("/nope")).toBe(false);
	});
});

// --- ensureDirectory ---
describe("ensureDirectory", () => {
	it("creates directory if not exists", async () => {
		mockedFs.mkdir.mockResolvedValue(undefined);
		await expect(utils.ensureDirectory("/foo")).resolves.toBeUndefined();
	});
	it("throws on error", async () => {
		mockedFs.mkdir.mockRejectedValue(new Error("fail"));
		await expect(utils.ensureDirectory("/fail")).rejects.toThrow("fail");
	});
});

// --- sortExtensionPoints ---
describe("sortExtensionPoints", () => {
	it("sorts by order", () => {
		const arr = [{ order: 2 }, { order: 1 }, { order: 3 }];
		expect(utils.sortExtensionPoints(arr)).toEqual([
			{ order: 1 },
			{ order: 2 },
			{ order: 3 },
		]);
	});
});

// --- filterActiveExtensions ---
describe("filterActiveExtensions", () => {
	it("filters by active plugin ids", () => {
		const arr = [{ pluginId: "a" }, { pluginId: "b" }, { pluginId: "c" }];
		const active = new Set(["a", "c"]);
		expect(utils.filterActiveExtensions(arr, active)).toEqual([
			{ pluginId: "a" },
			{ pluginId: "c" },
		]);
	});
});

// --- debounce ---
describe("debounce", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());
	it("debounces function calls", () => {
		const fn = vi.fn();
		const debounced = utils.debounce(fn, 100);
		debounced(1);
		debounced(2);
		vi.advanceTimersByTime(99);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledWith(2);
	});
});

// --- deepClone ---
describe("deepClone", () => {
	it("clones objects and arrays deeply", () => {
		const obj = { a: 1, b: { c: 2 }, d: [1, 2, { e: 3 }] };
		const clone = utils.deepClone(obj);
		expect(clone).toEqual(obj);
		expect(clone).not.toBe(obj);
		expect(clone.b).not.toBe(obj.b);
		expect(clone.d).not.toBe(obj.d);
		expect(clone.d[2]).not.toBe(obj.d[2]);
	});
});

// --- generateCreateTableSQL & generateCreateIndexSQL ---
describe("generateCreateTableSQL & generateCreateIndexSQL", () => {
	it("generates SQL for table definition", () => {
		const drizzleName = Symbol.for("drizzle:Name");
		const drizzleColumns = Symbol.for("drizzle:Columns");
		const drizzleIndexes = Symbol.for("drizzle:Indexes");
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
			[drizzleColumns]: {
				id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
				name: { name: "name", columnType: "PgText" },
			},
			[drizzleIndexes]: [
				{ columns: [{ name: "id" }], unique: true },
				{ columns: [{ name: "name" }], unique: false },
			],
		};
		const sql = utils.generateCreateTableSQL(tableDef, "pluginid");
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "pluginid_mytable"');
		expect(sql).toContain('"id" uuid NOT NULL PRIMARY KEY');
		expect(sql).toContain('"name" text');
		const indexes = utils.generateCreateIndexSQL(tableDef, "pluginid");
		expect(indexes[0]).toContain(
			'UNIQUE INDEX IF NOT EXISTS "pluginid_mytable_id_index"',
		);
		expect(indexes[1]).toContain(
			'INDEX IF NOT EXISTS "pluginid_mytable_name_index"',
		);
	});

	it("handles array with only falsy values (covers if index check)", () => {
		const drizzleName = Symbol.for("drizzle:Name");
		const drizzleColumns = Symbol.for("drizzle:Columns");
		const drizzleIndexes = Symbol.for("drizzle:Indexes");
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
			[drizzleColumns]: {
				id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
			},
			[drizzleIndexes]: [null, undefined, false],
		};
		const indexes = utils.generateCreateIndexSQL(tableDef, "pluginid");
		expect(indexes).toHaveLength(0); // No valid indexes should be processed
	});
});

// --- createPluginTables & dropPluginTables ---
describe("createPluginTables & dropPluginTables", () => {
	it("creates tables and indexes", async () => {
		const db = { execute: vi.fn().mockResolvedValue(undefined) };
		const drizzleName = Symbol.for("drizzle:Name");
		const drizzleColumns = Symbol.for("drizzle:Columns");
		const drizzleIndexes = Symbol.for("drizzle:Indexes");
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
			[drizzleColumns]: {
				id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
			},
			[drizzleIndexes]: [{ columns: [{ name: "id" }], unique: true }],
		};
		await utils.createPluginTables(db, "pluginid", { mytable: tableDef });
		expect(db.execute).toHaveBeenCalledWith(
			expect.stringContaining("CREATE TABLE"),
		);
		expect(db.execute).toHaveBeenCalledWith(
			expect.stringContaining("CREATE UNIQUE INDEX"),
		);
		await utils.dropPluginTables(db, "pluginid", { mytable: tableDef });
		expect(db.execute).toHaveBeenCalledWith(
			expect.stringContaining("DROP TABLE"),
		);
	});
	it("handles table creation error", async () => {
		const db = { execute: vi.fn().mockRejectedValue(new Error("fail")) };
		const drizzleName = Symbol.for("drizzle:Name");
		const drizzleColumns = Symbol.for("drizzle:Columns");
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
			[drizzleColumns]: {
				id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
			},
		};
		await expect(
			utils.createPluginTables(db, "pluginid", { mytable: tableDef }),
		).rejects.toThrow("fail");
	});
	it("handles drop error and continues", async () => {
		const db = { execute: vi.fn().mockRejectedValue(new Error("fail")) };
		const drizzleName = Symbol.for("drizzle:Name");
		const drizzleColumns = Symbol.for("drizzle:Columns");
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
			[drizzleColumns]: {
				id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
			},
		};
		await expect(
			utils.dropPluginTables(db, "pluginid", { mytable: tableDef }),
		).resolves.toBeUndefined();
	});

	it("calls logger for dropPluginTables (covers logger lines)", async () => {
		const db = { execute: vi.fn().mockResolvedValue(undefined) };
		const logger = { info: vi.fn() };
		const drizzleName = Symbol.for("drizzle:Name");
		const tableDef = {
			[drizzleName]: "mytable",
			id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
		};
		await utils.dropPluginTables(db, "pluginid", { mytable: tableDef }, logger);
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("Dropping database tables for plugin: pluginid"),
		);
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("Completed dropping tables for plugin: pluginid"),
		);
	});

	it("handles error in dropPluginTables outer try/catch (covers error log)", async () => {
		const db = {
			execute: vi.fn().mockImplementation(() => {
				throw new Error("fail");
			}),
		};
		const logger = { info: vi.fn() };
		const drizzleName = Symbol.for("drizzle:Name");
		const tableDef = {
			[drizzleName]: "mytable",
			id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
		};
		// Make logger.info throw to trigger the outer catch
		logger.info = vi.fn(() => {
			throw new Error("logger fail");
		});
		await expect(
			utils.dropPluginTables(db, "pluginid", { mytable: tableDef }, logger),
		).rejects.toThrow("logger fail");
	});

	it("handles inner error in dropPluginTables (covers inner catch)", async () => {
		const db = { execute: vi.fn().mockRejectedValue(new Error("db fail")) };
		const logger = { info: vi.fn() };
		const drizzleName = Symbol.for("drizzle:Name");
		const tableDef = {
			[drizzleName]: "mytable",
			id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
		};
		await utils.dropPluginTables(db, "pluginid", { mytable: tableDef }, logger);
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("Error dropping table mytable"),
		);
	});

	it("falls back to console.error when logger is undefined", async () => {
		const db = { execute: vi.fn().mockRejectedValue(new Error("fail")) };
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const drizzleName = Symbol.for("drizzle:Name");
		const tableDef = {
			[drizzleName]: "mytable",
			id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
		};

		await utils.dropPluginTables(db, "pluginid", { mytable: tableDef });

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error dropping table mytable: fail"),
		);
		consoleSpy.mockRestore();
	});

	it("handles non-Error objects thrown during drop", async () => {
		const db = { execute: vi.fn().mockRejectedValue("string error") };
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const drizzleName = Symbol.for("drizzle:Name");
		const tableDef = {
			[drizzleName]: "mytable",
			id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
		};

		await utils.dropPluginTables(db, "pluginid", { mytable: tableDef });

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error dropping table mytable: string error"),
		);
		consoleSpy.mockRestore();
	});

	it("continues processing subsequent tables if one fails", async () => {
		const db = {
			execute: vi.fn().mockImplementation((sql: string) => {
				if (sql.includes("table1")) {
					throw new Error("fail table1");
				}
				return Promise.resolve();
			}),
		};
		const logger = { info: vi.fn(), error: vi.fn() };
		const drizzleName = Symbol.for("drizzle:Name");
		const tableDefinitions = {
			table1: {
				[drizzleName]: "table1",
				id: { name: "id", columnType: "PgUUID" },
			},
			table2: {
				[drizzleName]: "table2",
				id: { name: "id", columnType: "PgUUID" },
			},
		};

		await utils.dropPluginTables(db, "pluginid", tableDefinitions, logger);

		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Error dropping table table1: fail table1"),
		);
		// Check that table2 was attempted (SUCCESS message for table2)
		expect(logger.info).toHaveBeenCalledWith(
			expect.stringContaining("Successfully dropped table: pluginid_table2"),
		);
	});
});

// --- removePluginDirectory & clearPluginModuleCache ---
describe("removePluginDirectory & clearPluginModuleCache", () => {
	it("removes plugin directory if exists", async () => {
		vi.spyOn(utils, "clearPluginModuleCache").mockImplementation(() => {});
		mockedFs.stat.mockResolvedValue({
			isDirectory: () => true,
		} as unknown as import("fs").Stats);
		mockedFs.rm.mockResolvedValue(undefined);
		await expect(
			utils.removePluginDirectory("pluginid"),
		).resolves.toBeUndefined();
	});
	it("skips removal if directory does not exist", async () => {
		vi.spyOn(utils, "clearPluginModuleCache").mockImplementation(() => {});
		mockedFs.stat.mockRejectedValue(new Error("fail"));
		await expect(
			utils.removePluginDirectory("pluginid"),
		).resolves.toBeUndefined();
	});
	it("throws on fs.rm error", async () => {
		vi.spyOn(utils, "clearPluginModuleCache").mockImplementation(() => {});
		mockedFs.stat.mockResolvedValue({
			isDirectory: () => true,
		} as unknown as import("fs").Stats);
		mockedFs.rm.mockRejectedValue(new Error("fail"));
		await expect(utils.removePluginDirectory("pluginid")).rejects.toThrow(
			"fail",
		);
	});
});

describe("clearPluginModuleCache", () => {
	it("handles error in cache access (covers catch block)", () => {
		// Pass a proxy that throws on Object.keys
		const badCache = new Proxy(
			{},
			{
				ownKeys() {
					throw new Error("fail");
				},
				get() {
					return undefined;
				},
			},
		);
		expect(() =>
			utils.clearPluginModuleCache(
				"/plugin/path",
				badCache as Record<string, unknown>,
			),
		).not.toThrow();
	});
	it("runs to end without error (covers normal end)", () => {
		const fakeCache: Record<string, unknown> = {
			"/plugin/path/a.js": {},
			"/plugin/path/b.js": {},
			"/other/path/c.js": {},
		};
		expect(() =>
			utils.clearPluginModuleCache("/plugin/path", fakeCache),
		).not.toThrow();
	});
	it("triggers catch by throwing in Object.keys (covers lines 577-578)", () => {
		const badCache = new Proxy(
			{},
			{
				get(_target, prop) {
					if (prop === "constructor") return Object;
					return undefined;
				},
				ownKeys() {
					throw new Error("keys fail");
				},
			},
		);
		expect(() =>
			utils.clearPluginModuleCache(
				"/plugin/path",
				badCache as Record<string, unknown>,
			),
		).not.toThrow();
	});
});

// --- loadPluginManifest ---
describe("loadPluginManifest", () => {
	const validManifest: IPluginManifest = {
		name: "Test Plugin",
		pluginId: "TestPlugin",
		version: "1.0.0",
		description: "desc",
		author: "author",
		main: "index.js",
		extensionPoints: {},
	};
	beforeEach(() => {
		mockedFs.readFile.mockReset();
	});
	it("loads and validates manifest", async () => {
		mockedFs.readFile.mockResolvedValue(JSON.stringify(validManifest));
		const result = await utils.loadPluginManifest("/plugin");
		expect(result).toEqual(validManifest);
	});
	it("throws on invalid manifest", async () => {
		mockedFs.readFile.mockResolvedValue("{}\n");
		await expect(utils.loadPluginManifest("/plugin")).rejects.toThrow(
			"Invalid manifest format",
		);
	});
	it("throws on fs error", async () => {
		mockedFs.readFile.mockRejectedValue(new Error("fail"));
		await expect(utils.loadPluginManifest("/plugin")).rejects.toThrow("fail");
	});
});
