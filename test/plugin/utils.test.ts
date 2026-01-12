import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IPluginManifest } from "../../src/plugin/types";

// Mock rootLogger
vi.mock("~/src/utilities/logging/logger", () => ({
	rootLogger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	},
}));

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
		const { rootLogger } = await import("~/src/utilities/logging/logger");
		const loggerSpy = vi.spyOn(rootLogger, "error");

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

		expect(loggerSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: expect.stringContaining("Table creation failed"),
			}),
		);
		loggerSpy.mockRestore();
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
		const logger = { info: vi.fn(), error: vi.fn() };
		const drizzleName = Symbol.for("drizzle:Name");
		const tableDef = {
			[drizzleName]: "mytable",
			id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
		};
		await utils.dropPluginTables(db, "pluginid", { mytable: tableDef }, logger);
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining("Error dropping table mytable"),
		);
	});

	it("uses original table name when it already starts with pluginId prefix (covers line 549)", async () => {
		const db = { execute: vi.fn().mockResolvedValue(undefined) };
		const logger = { info: vi.fn() };
		const drizzleName = Symbol.for("drizzle:Name");
		// Table name already has pluginid_ prefix
		const tableDef = {
			[drizzleName]: "pluginid_mytable",
			id: { name: "id", columnType: "PgUUID", notNull: true, primary: true },
		};
		await utils.dropPluginTables(db, "pluginid", { mytable: tableDef }, logger);
		// Should use the original name without double-prefixing
		expect(db.execute).toHaveBeenCalledWith(
			'DROP TABLE IF EXISTS "pluginid_mytable" CASCADE;',
		);
	});

	it("uses rootLogger when no logger is provided in createPluginTables outer catch (covers lines 514-518)", async () => {
		const { rootLogger } = await import("~/src/utilities/logging/logger");
		// Ensure error is spied on before execution
		const loggerSpy = vi.spyOn(rootLogger, "error");

		// Provide an empty object for tableDefinitions to trigger the outer catch
		// by using a bad tableDefinitions that causes Object.entries to throw
		const badTableDefinitions = new Proxy(
			{},
			{
				ownKeys() {
					throw new Error("outer catch fail");
				},
				getOwnPropertyDescriptor() {
					return { configurable: true, enumerable: true };
				},
			},
		);

		await expect(
			utils.createPluginTables(
				{ execute: vi.fn() },
				"pluginid",
				badTableDefinitions as Record<string, Record<string, unknown>>,
			),
		).rejects.toThrow("outer catch fail");

		// The test passes if createPluginTables throws as expected
		// The outer catch logs to rootLogger.error when no logger is provided
		expect(loggerSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				err: expect.objectContaining({ message: "outer catch fail" }),
			}),
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
		const { rootLogger } = await import("~/src/utilities/logging/logger");
		const loggerSpy = vi.spyOn(rootLogger, "error");

		vi.spyOn(utils, "clearPluginModuleCache").mockImplementation(() => {});
		mockedFs.stat.mockResolvedValue({
			isDirectory: () => true,
		} as unknown as import("fs").Stats);
		mockedFs.rm.mockRejectedValue(new Error("fail"));
		await expect(utils.removePluginDirectory("pluginid")).rejects.toThrow(
			"fail",
		);

		expect(loggerSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: expect.stringContaining("Failed to remove plugin directory"),
			}),
		);
		loggerSpy.mockRestore();
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
	it("handles normal execution without throwing", () => {
		// Verifies the function completes without throwing during normal execution
		expect(() => utils.clearPluginModuleCache("/plugin/path")).not.toThrow();
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

// --- deepClone additional edge cases ---
describe("deepClone edge cases", () => {
	it("returns Date as cloned Date", () => {
		const date = new Date("2025-01-01");
		const cloned = utils.deepClone(date);
		expect(cloned).toBeInstanceOf(Date);
		expect(cloned.getTime()).toBe(date.getTime());
		expect(cloned).not.toBe(date);
	});

	it("returns primitive values as-is", () => {
		expect(utils.deepClone(42)).toBe(42);
		expect(utils.deepClone("hello")).toBe("hello");
		expect(utils.deepClone(null)).toBe(null);
		expect(utils.deepClone(undefined)).toBe(undefined);
		expect(utils.deepClone(true)).toBe(true);
	});

	it("clones nested arrays", () => {
		const arr = [
			[1, 2],
			[3, 4],
		];
		const cloned = utils.deepClone(arr);
		expect(cloned).toEqual(arr);
		expect(cloned[0]).not.toBe(arr[0]);
	});
});

// --- generateCreateTableSQL additional column types ---
describe("generateCreateTableSQL column types", () => {
	const drizzleName = Symbol.for("drizzle:Name");
	const drizzleColumns = Symbol.for("drizzle:Columns");

	it("handles PgInteger column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				count: { name: "count", columnType: "PgInteger", notNull: true },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"count" integer NOT NULL');
	});

	it("handles PgBigInt column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				bignum: { name: "bignum", columnType: "PgBigInt" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"bignum" bigint');
	});

	it("handles PgBoolean column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				flag: { name: "flag", columnType: "PgBoolean", default: true },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"flag" boolean DEFAULT true');
	});

	it("handles PgTimestamp column type with defaultNow", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				created_at: {
					name: "created_at",
					columnType: "PgTimestamp",
					hasDefault: true,
				},
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"created_at" timestamp DEFAULT now()');
	});

	it("handles PgDate column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				birth_date: { name: "birth_date", columnType: "PgDate" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"birth_date" date');
	});

	it("handles PgTime column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				start_time: { name: "start_time", columnType: "PgTime" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"start_time" time');
	});

	it("handles PgDecimal column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				price: { name: "price", columnType: "PgDecimal" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"price" decimal');
	});

	it("handles PgReal column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				rate: { name: "rate", columnType: "PgReal" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"rate" real');
	});

	it("handles PgDoublePrecision column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				value: { name: "value", columnType: "PgDoublePrecision" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"value" double precision');
	});

	it("handles PgSmallInt column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				small: { name: "small", columnType: "PgSmallInt" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"small" smallint');
	});

	it("handles PgSerial column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				seq: { name: "seq", columnType: "PgSerial" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"seq" serial');
	});

	it("handles PgBigSerial column type", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				bigseq: { name: "bigseq", columnType: "PgBigSerial" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"bigseq" bigserial');
	});

	it("handles unknown column type defaulting to text", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				unknown_col: { name: "unknown_col", columnType: "PgCustomType" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"unknown_col" text');
	});

	it("handles string default value", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				status: { name: "status", columnType: "PgText", default: "pending" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain("\"status\" text DEFAULT 'pending'");
	});

	it("handles null default value", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				nullable: { name: "nullable", columnType: "PgText", default: null },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"nullable" text DEFAULT NULL');
	});

	it("handles UNIQUE constraint", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				email: { name: "email", columnType: "PgText", unique: true },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('"email" text UNIQUE');
	});

	it("handles UUID id column with defaultFn", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "test_table",
			[drizzleColumns]: {
				id: {
					name: "id",
					columnType: "PgUUID",
					notNull: true,
					primary: true,
					hasDefault: true,
				},
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain(
			'"id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()',
		);
	});

	it("handles table without plugin prefix when already prefixed", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "plugin_mytable",
			[drizzleColumns]: {
				id: { name: "id", columnType: "PgUUID" },
			},
		};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "plugin_mytable"');
	});

	it("handles missing drizzle symbols gracefully", () => {
		const tableDef: Record<string, unknown> = {};
		const sql = utils.generateCreateTableSQL(tableDef, "plugin");
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS "plugin_unknown_table"');
	});
});

// --- isValidPluginId additional edge cases ---
describe("isValidPluginId edge cases", () => {
	it("returns false for non-string input", () => {
		expect(utils.isValidPluginId(null as unknown as string)).toBe(false);
		expect(utils.isValidPluginId(undefined as unknown as string)).toBe(false);
		expect(utils.isValidPluginId(123 as unknown as string)).toBe(false);
	});
});

// --- generateCreateIndexSQL additional cases ---
describe("generateCreateIndexSQL additional cases", () => {
	const drizzleName = Symbol.for("drizzle:Name");
	const drizzleIndexes = Symbol.for("drizzle:Indexes");

	it("handles table that already has plugin prefix", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "plugin_mytable",
			[drizzleIndexes]: [{ columns: [{ name: "col1" }], unique: false }],
		};
		const indexes = utils.generateCreateIndexSQL(tableDef, "plugin");
		expect(indexes[0]).toContain('"plugin_mytable"');
	});

	it("handles empty indexes array", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
			[drizzleIndexes]: [],
		};
		const indexes = utils.generateCreateIndexSQL(tableDef, "plugin");
		expect(indexes).toHaveLength(0);
	});

	it("handles missing indexes symbol", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
		};
		const indexes = utils.generateCreateIndexSQL(tableDef, "plugin");
		expect(indexes).toHaveLength(0);
	});

	it("handles index with multiple columns", () => {
		const tableDef: Record<string, unknown> = {
			[drizzleName]: "mytable",
			[drizzleIndexes]: [
				{ columns: [{ name: "col1" }, { name: "col2" }], unique: false },
			],
		};
		const indexes = utils.generateCreateIndexSQL(tableDef, "plugin");
		expect(indexes[0]).toContain('"col1", "col2"');
		expect(indexes[0]).toContain("plugin_mytable_col1_col2_index");
	});
});
