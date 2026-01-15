import { getTableName, SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
	familiesTable,
	familiesTableRelations,
} from "~/src/drizzle/tables/families";
import { familyMembershipsTable } from "~/src/drizzle/tables/familyMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";

/**
 * Type for columns with defaultFn
 */
type ColumnWithDefaultFn = PgColumn & {
	defaultFn?: () => unknown;
};

/**
 * Type for columns with onUpdateFn
 */
type ColumnWithOnUpdateFn = PgColumn & {
	onUpdateFn?: () => unknown;
};

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

				it("should generate a valid UUIDv7 when defaultFn is called", () => {
					const idColumn = familiesTable.id as ColumnWithDefaultFn;
					expect(idColumn.defaultFn).toBeDefined();
					const generatedId = idColumn.defaultFn?.();
					expect(typeof generatedId).toBe("string");
					// UUIDv7 format: 8-4-4-4-12 hex characters
					expect(generatedId).toMatch(
						/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
					);
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

				it("should have a defaultFn that returns SQL null", () => {
					const updatedAtColumn =
						familiesTable.updatedAt as ColumnWithDefaultFn;
					expect(updatedAtColumn.defaultFn).toBeDefined();
					const defaultValue = updatedAtColumn.defaultFn?.();
					// The defaultFn returns sql`${null}` which is a SQL object
					expect(defaultValue).toBeInstanceOf(SQL);
				});

				it("should have an onUpdateFn that returns a Date", () => {
					const updatedAtColumn =
						familiesTable.updatedAt as ColumnWithOnUpdateFn;
					expect(updatedAtColumn.onUpdateFn).toBeDefined();
					const beforeCall = new Date();
					const updateValue = updatedAtColumn.onUpdateFn?.();
					const afterCall = new Date();
					expect(updateValue).toBeInstanceOf(Date);
					// Verify the date is within the expected range
					expect((updateValue as Date).getTime()).toBeGreaterThanOrEqual(
						beforeCall.getTime(),
					);
					expect((updateValue as Date).getTime()).toBeLessThanOrEqual(
						afterCall.getTime(),
					);
				});
			});
		});

		describe("foreign keys", () => {
			it("should have three foreign keys defined", () => {
				const tableConfig = getTableConfig(familiesTable);
				expect(tableConfig.foreignKeys).toHaveLength(3);
			});

			it("should have creatorId referencing usersTable.id", () => {
				const tableConfig = getTableConfig(familiesTable);
				const creatorFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "creator_id");
				});
				expect(creatorFk).toBeDefined();
				expect(creatorFk?.onDelete).toBe("set null");
				expect(creatorFk?.onUpdate).toBe("cascade");
				// Execute the reference function to cover the callback
				const ref = creatorFk?.reference();
				expect(ref?.foreignTable).toBe(usersTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});

			it("should have organizationId referencing organizationsTable.id", () => {
				const tableConfig = getTableConfig(familiesTable);
				const orgFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "organization_id");
				});
				expect(orgFk).toBeDefined();
				expect(orgFk?.onDelete).toBe("cascade");
				expect(orgFk?.onUpdate).toBe("cascade");
				// Execute the reference function to cover the callback
				const ref = orgFk?.reference();
				expect(ref?.foreignTable).toBe(organizationsTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});

			it("should have updaterId referencing usersTable.id", () => {
				const tableConfig = getTableConfig(familiesTable);
				const updaterFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "updater_id");
				});
				expect(updaterFk).toBeDefined();
				expect(updaterFk?.onDelete).toBe("set null");
				expect(updaterFk?.onUpdate).toBe("cascade");
				// Execute the reference function to cover the callback
				const ref = updaterFk?.reference();
				expect(ref?.foreignTable).toBe(usersTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
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
				const columnNames = uniqueIndex?.config.columns.map((col) =>
					"name" in col ? col.name : undefined,
				);
				expect(columnNames).toContain("name");
				expect(columnNames).toContain("organization_id");
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
			// Type for tracking relation calls
			type RelationCall = {
				type: "one" | "many";
				table: unknown;
				config: unknown;
				withFieldName: (fieldName: string) => RelationCall;
			};

			// Helper to create mock builders that track calls
			const createMockBuilders = () => {
				const one = (table: unknown, config: unknown): RelationCall => {
					const result: RelationCall = {
						type: "one" as const,
						table,
						config,
						withFieldName: () => result,
					};
					return result;
				};

				const many = (table: unknown, config: unknown): RelationCall => {
					const result: RelationCall = {
						type: "many" as const,
						table,
						config,
						withFieldName: () => result,
					};
					return result;
				};

				return {
					one: one as unknown as Parameters<
						typeof familiesTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof familiesTableRelations.config
					>[0]["many"],
				};
			};

			it("should define four relations", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				// Verify all four relations are defined
				expect(relationsResult.creator).toBeDefined();
				expect(relationsResult.organization).toBeDefined();
				expect(relationsResult.updater).toBeDefined();
				expect(relationsResult.familyMembershipsWhereFamily).toBeDefined();
			});

			it("should define creator as a one-to-one relation with usersTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const creator = relationsResult.creator as unknown as RelationCall;
				expect(creator.type).toBe("one");
				expect(creator.table).toBe(usersTable);
			});

			it("should define organization as a one-to-one relation with organizationsTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const organization =
					relationsResult.organization as unknown as RelationCall;
				expect(organization.type).toBe("one");
				expect(organization.table).toBe(organizationsTable);
			});

			it("should define updater as a one-to-one relation with usersTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const updater = relationsResult.updater as unknown as RelationCall;
				expect(updater.type).toBe("one");
				expect(updater.table).toBe(usersTable);
			});

			it("should define familyMembershipsWhereFamily as a one-to-many relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const familyMembershipsWhereFamily =
					relationsResult.familyMembershipsWhereFamily as unknown as RelationCall;
				expect(familyMembershipsWhereFamily.type).toBe("many");
				expect(familyMembershipsWhereFamily.table).toBe(familyMembershipsTable);
			});
		});
	});
});
