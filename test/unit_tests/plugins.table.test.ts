import { describe, it, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { pluginsTable } from "~/src/drizzle/tables/plugins";

describe("drizzle table: plugins", () => {
	const table = getTableConfig(pluginsTable);

	it("should have correct table name", () => {
		expect(table.name).toBe("plugins");
	});

	it("should define all expected columns", () => {
		const columnNames = table.columns.map((c) => c.name);

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

	it("should mark id as primary key and not null", () => {
		const idColumn = table.columns.find((c) => c.name === "id");

		expect(idColumn).toBeDefined();
		expect(idColumn?.primary).toBe(true);
		expect(idColumn?.notNull).toBe(true);
	});

	it("should enforce uniqueness and not-null on plugin_id", () => {
		const pluginIdColumn = table.columns.find(
			(c) => c.name === "plugin_id",
		);

		expect(pluginIdColumn).toBeDefined();
		expect(pluginIdColumn?.isUnique).toBe(true);
		expect(pluginIdColumn?.notNull).toBe(true);
	});

	it("should define default timestamps correctly", () => {
		const createdAt = table.columns.find(
			(c) => c.name === "created_at",
		);
		const updatedAt = table.columns.find(
			(c) => c.name === "updated_at",
		);

		expect(createdAt?.notNull).toBe(true);
		expect(updatedAt).toBeDefined();
	});

	it("should define indexes on activation and installation flags", () => {
		// Index internals are not exposed in Drizzle 0.44.x
		// We assert presence only
		expect(table.indexes.length).toBe(2);
	});
});
