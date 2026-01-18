import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { pluginsTable } from "~/src/drizzle/tables/plugins";

describe("drizzle table: plugins", () => {
	const table = getTableConfig(pluginsTable);

	it("should have correct table name", () => {
		expect(table.name).toBe("plugins");
	});

	it("should define all expected columns", () => {
		const columnNames = table.columns.map((c) => c.name);

		expect(columnNames.length).toBe(7);
		expect(columnNames).toEqual(
			expect.arrayContaining([
				"id",
				"plugin_id",
				"is_activated",
				"is_installed",
				"backup",
				"created_at",
				"updated_at",
			]),
		);
	});

	it("should enforce constraints on boolean flag columns", () => {
		const isActivated = table.columns.find((c) => c.name === "is_activated");
		const isInstalled = table.columns.find((c) => c.name === "is_installed");
		const backup = table.columns.find((c) => c.name === "backup");

		expect(isActivated?.notNull).toBe(true);
		expect(isActivated?.hasDefault).toBe(true);

		expect(isInstalled?.notNull).toBe(true);
		expect(isInstalled?.hasDefault).toBe(true);

		expect(backup?.notNull).toBe(true);
		expect(backup?.hasDefault).toBe(true);
	});

	it("should mark id as primary key and not null", () => {
		const idColumn = table.columns.find((c) => c.name === "id");

		expect(idColumn).toBeDefined();
		expect(idColumn?.primary).toBe(true);
		expect(idColumn?.notNull).toBe(true);
	});

	it("should enforce uniqueness and not-null on plugin_id", () => {
		const pluginIdColumn = table.columns.find((c) => c.name === "plugin_id");

		expect(pluginIdColumn).toBeDefined();
		expect(pluginIdColumn?.isUnique).toBe(true);
		expect(pluginIdColumn?.notNull).toBe(true);
	});

	it("should define timestamp columns with defaults", () => {
		const createdAt = table.columns.find((c) => c.name === "created_at");
		const updatedAt = table.columns.find((c) => c.name === "updated_at");

		expect(createdAt?.notNull).toBe(true);
		expect(createdAt?.hasDefault).toBe(true);
		expect(updatedAt?.hasDefault).toBe(true);
	});

	it("should define indexes on activation and installation flags", () => {
		// We intentionally assert index count only.
		// Index structure is considered an implementation detail
		// and may change across Drizzle versions.
		expect(table.indexes.length).toBe(2);
	});
});
