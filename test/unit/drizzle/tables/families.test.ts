import { getTableName, SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
	familiesTable,
	familiesTableRelations,
} from "~/src/drizzle/tables/families";
import { familyMembershipsTable } from "~/src/drizzle/tables/familyMemberships";
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
				expect(columns).toContain("updatedAt");
				expect(columns).toContain("updaterId");
			});

			it("should not have removed columns", () => {
				const columns = Object.keys(familiesTable);
				expect(columns).not.toContain("name");
				expect(columns).not.toContain("organizationId");
			});

			describe("id column", () => {
				it("should be a uuid primary key", () => {
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
			it("should have two foreign keys defined", () => {
				const tableConfig = getTableConfig(familiesTable);
				expect(tableConfig.foreignKeys).toHaveLength(2);
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
				const ref = creatorFk?.reference();
				expect(ref?.foreignTable).toBe(usersTable);
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
				const ref = updaterFk?.reference();
				expect(ref?.foreignTable).toBe(usersTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});
		});

		describe("indexes", () => {
			it("should have two indexes defined", () => {
				const tableConfig = getTableConfig(familiesTable);
				// createdAt and creatorId
				expect(tableConfig.indexes).toHaveLength(2);
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
		});
	});

	describe("familiesTableRelations", () => {
		it("should be defined", () => {
			expect(familiesTableRelations).toBeDefined();
		});

		it("should be associated with familiesTable", () => {
			expect(familiesTableRelations.table).toBe(familiesTable);
		});

		it("should have a config function", () => {
			expect(typeof familiesTableRelations.config).toBe("function");
		});

		describe("relation definitions", () => {
			type RelationCall = {
				type: "one" | "many";
				table: unknown;
				config: unknown;
				withFieldName: (fieldName: string) => RelationCall;
			};

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

			it("should define three relations", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				expect(relationsResult.creator).toBeDefined();
				expect(relationsResult.familyMembershipsWhereFamily).toBeDefined();
				expect(relationsResult.updater).toBeDefined();
			});

			it("should not define an organization relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				expect(
					(relationsResult as Record<string, unknown>).organization,
				).toBeUndefined();
			});

			it("should define creator as a one-to-one relation with usersTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const creator = relationsResult.creator as unknown as RelationCall;
				expect(creator.type).toBe("one");
				expect(creator.table).toBe(usersTable);
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

			it("should have correct relation names", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const creatorConfig = relationsResult.creator as unknown as {
					config: { relationName?: string };
				};
				expect(creatorConfig.config.relationName).toBe(
					"families.creator_id:users.id",
				);

				const updaterConfig = relationsResult.updater as unknown as {
					config: { relationName?: string };
				};
				expect(updaterConfig.config.relationName).toBe(
					"families.updater_id:users.id",
				);

				const membershipsConfig =
					relationsResult.familyMembershipsWhereFamily as unknown as {
						config: { relationName?: string };
					};
				expect(membershipsConfig.config.relationName).toBe(
					"families.id:family_memberships.family_id",
				);
			});

			it("should have correct fields and references for creator relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const creatorConfig = relationsResult.creator as unknown as {
					config: { fields?: unknown[]; references?: unknown[] };
				};
				expect(creatorConfig.config.fields?.[0]).toBe(familiesTable.creatorId);
				expect(creatorConfig.config.references?.[0]).toBe(usersTable.id);
			});

			it("should have correct fields and references for updater relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familiesTableRelations.config({ one, many });

				const updaterConfig = relationsResult.updater as unknown as {
					config: { fields?: unknown[]; references?: unknown[] };
				};
				expect(updaterConfig.config.fields?.[0]).toBe(familiesTable.updaterId);
				expect(updaterConfig.config.references?.[0]).toBe(usersTable.id);
			});
		});
	});
});
