import { getTableName, Many, One } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
	familiesTable,
	familiesTableRelations,
} from "~/src/drizzle/tables/families";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";

/**
 * Tests for familiesTable - validates the table schema, relations, and indexes.
 */
describe("src/drizzle/tables/families.ts", () => {
	describe("familiesTable schema", () => {
		it("should have the correct table name", () => {
			expect(getTableName(familiesTable)).toBe("families");
		});

		describe("columns", () => {
			it("should have all required columns defined", () => {
				const columns = Object.keys(familiesTable);
				expect(columns).toContain("createdAt");
				expect(columns).toContain("creatorId");
				expect(columns).toContain("id");
				expect(columns).toContain("name");
				expect(columns).toContain("organizationId");
				expect(columns).toContain("updatedAt");
				expect(columns).toContain("updaterId");
			});

			describe("id column", () => {
				it("should be a uuid primary key", () => {
					// In drizzle-orm, uuid columns have dataType as "string"
					expect(familiesTable.id.dataType).toBe("string");
					expect(familiesTable.id.columnType).toBe("PgUUID");
					expect(familiesTable.id.primary).toBe(true);
				});

				it("should have a default value function", () => {
					expect(familiesTable.id.hasDefault).toBe(true);
				});
			});

			describe("name column", () => {
				it("should be a text column", () => {
					expect(familiesTable.name.dataType).toBe("string");
					expect(familiesTable.name.columnType).toBe("PgText");
				});

				it("should be not null", () => {
					expect(familiesTable.name.notNull).toBe(true);
				});
			});

			describe("organizationId column", () => {
				it("should be a uuid column", () => {
					expect(familiesTable.organizationId.dataType).toBe("string");
					expect(familiesTable.organizationId.columnType).toBe("PgUUID");
				});

				it("should be not null", () => {
					expect(familiesTable.organizationId.notNull).toBe(true);
				});
			});

			describe("creatorId column", () => {
				it("should be a uuid column", () => {
					expect(familiesTable.creatorId.dataType).toBe("string");
					expect(familiesTable.creatorId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(familiesTable.creatorId.notNull).toBe(false);
				});
			});

			describe("updaterId column", () => {
				it("should be a uuid column", () => {
					expect(familiesTable.updaterId.dataType).toBe("string");
					expect(familiesTable.updaterId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(familiesTable.updaterId.notNull).toBe(false);
				});
			});

			describe("createdAt column", () => {
				it("should be a timestamp column", () => {
					expect(familiesTable.createdAt.dataType).toBe("date");
					expect(familiesTable.createdAt.columnType).toBe("PgTimestamp");
				});

				it("should be not null", () => {
					expect(familiesTable.createdAt.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(familiesTable.createdAt.hasDefault).toBe(true);
				});
			});

			describe("updatedAt column", () => {
				it("should be a timestamp column", () => {
					expect(familiesTable.updatedAt.dataType).toBe("date");
					expect(familiesTable.updatedAt.columnType).toBe("PgTimestamp");
				});

				it("should be nullable", () => {
					expect(familiesTable.updatedAt.notNull).toBe(false);
				});
			});
		});

		describe("indexes", () => {
			it("should have appropriate indexes defined", () => {
				const tableConfig = getTableConfig(familiesTable);
				// Should have 5 indexes: createdAt, creatorId, name, organizationId, and unique(name, organizationId)
				expect(tableConfig.indexes).toHaveLength(5);
			});

			it("should have an index on createdAt column", () => {
				const tableConfig = getTableConfig(familiesTable);
				const createdAtIndex = tableConfig.indexes.find((idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "created_at",
					),
				);
				expect(createdAtIndex).toBeDefined();
			});

			it("should have an index on creatorId column", () => {
				const tableConfig = getTableConfig(familiesTable);
				const creatorIdIndex = tableConfig.indexes.find((idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "creator_id",
					),
				);
				expect(creatorIdIndex).toBeDefined();
			});

			it("should have an index on name column", () => {
				const tableConfig = getTableConfig(familiesTable);
				const nameIndex = tableConfig.indexes.find(
					(idx) =>
						idx.config.columns.length === 1 &&
						idx.config.columns.some(
							(col) => "name" in col && col.name === "name",
						),
				);
				expect(nameIndex).toBeDefined();
			});

			it("should have an index on organizationId column", () => {
				const tableConfig = getTableConfig(familiesTable);
				const orgIdIndex = tableConfig.indexes.find(
					(idx) =>
						idx.config.columns.length === 1 &&
						idx.config.columns.some(
							(col) => "name" in col && col.name === "organization_id",
						),
				);
				expect(orgIdIndex).toBeDefined();
			});

			it("should have a unique index on name and organizationId", () => {
				const tableConfig = getTableConfig(familiesTable);
				const uniqueIndex = tableConfig.indexes.find(
					(idx) =>
						idx.config.unique === true && idx.config.columns.length === 2,
				);
				expect(uniqueIndex).toBeDefined();
				expect(uniqueIndex?.config.columns).toHaveLength(2);
			});
		});
	});

	describe("familiesTableRelations", () => {
		it("should be defined", () => {
			expect(familiesTableRelations).toBeDefined();
		});

		it("should be associated with familiesTable", () => {
			// The relation should reference the familiesTable
			expect(familiesTableRelations.table).toBe(familiesTable);
		});

		it("should have a config function", () => {
			// Verify the relations have a config function
			expect(typeof familiesTableRelations.config).toBe("function");
		});

		describe("relation definitions", () => {
			// Helper to create one relation builder
			const createOne = (
				sourceTable: unknown,
				table: unknown,
				config: unknown,
			) => {
				return new One(
					sourceTable as Parameters<typeof One>[0],
					table as Parameters<typeof One>[1],
					config as Parameters<typeof One>[2],
					false,
				);
			};

			// Helper to create many relation builder
			const createMany = (sourceTable: unknown, config: unknown) => {
				return new Many(
					sourceTable as Parameters<typeof Many>[0],
					config as Parameters<typeof Many>[1],
				);
			};

			it("should define four relations", () => {
				// Call the config function with proper builders to exercise the callback
				const relationsResult = familiesTableRelations.config({
					one: (table, config) => createOne(familiesTable, table, config),
					many: (config) => createMany(familiesTable, config),
				});

				// Verify all four relations are defined
				expect(relationsResult.creator).toBeDefined();
				expect(relationsResult.organization).toBeDefined();
				expect(relationsResult.updater).toBeDefined();
				expect(relationsResult.familyMembershipsWhereFamily).toBeDefined();
			});

			it("should define creator as a one-to-one relation with usersTable", () => {
				const relationsResult = familiesTableRelations.config({
					one: (table, config) => createOne(familiesTable, table, config),
					many: (config) => createMany(familiesTable, config),
				});

				expect(relationsResult.creator).toBeInstanceOf(One);
				expect(relationsResult.creator.referencedTable).toBe(usersTable);
			});

			it("should define organization as a one-to-one relation with organizationsTable", () => {
				const relationsResult = familiesTableRelations.config({
					one: (table, config) => createOne(familiesTable, table, config),
					many: (config) => createMany(familiesTable, config),
				});

				expect(relationsResult.organization).toBeInstanceOf(One);
				expect(relationsResult.organization.referencedTable).toBe(
					organizationsTable,
				);
			});

			it("should define updater as a one-to-one relation with usersTable", () => {
				const relationsResult = familiesTableRelations.config({
					one: (table, config) => createOne(familiesTable, table, config),
					many: (config) => createMany(familiesTable, config),
				});

				expect(relationsResult.updater).toBeInstanceOf(One);
				expect(relationsResult.updater.referencedTable).toBe(usersTable);
			});

			it("should define familyMembershipsWhereFamily as a one-to-many relation", () => {
				const relationsResult = familiesTableRelations.config({
					one: (table, config) => createOne(familiesTable, table, config),
					many: (config) => createMany(familiesTable, config),
				});

				expect(relationsResult.familyMembershipsWhereFamily).toBeInstanceOf(
					Many,
				);
			});
		});
	});
});
