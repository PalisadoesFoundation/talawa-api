import { getTableName, SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import {
	eventExceptionsTable,
	eventExceptionsTableRelations,
} from "~/src/drizzle/tables/recurringEventExceptions";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
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
 * Tests for eventExceptionsTable - validates the table schema, relations, and indexes.
 */
describe("src/drizzle/tables/recurringEventExceptions.ts", () => {
	describe("eventExceptionsTable schema", () => {
		it("should have the correct table name", () => {
			expect(getTableName(eventExceptionsTable)).toBe("event_exceptions");
		});

		describe("columns", () => {
			it("should have all required columns defined", () => {
				const columns = Object.keys(eventExceptionsTable);
				expect(columns).toContain("createdAt");
				expect(columns).toContain("creatorId");
				expect(columns).toContain("exceptionData");
				expect(columns).toContain("id");
				expect(columns).toContain("organizationId");
				expect(columns).toContain("recurringEventInstanceId");
				expect(columns).toContain("updatedAt");
				expect(columns).toContain("updaterId");
			});

			describe("id column", () => {
				it("should be a uuid primary key", () => {
					expect(eventExceptionsTable.id.dataType).toBe("string");
					expect(eventExceptionsTable.id.columnType).toBe("PgUUID");
					expect(eventExceptionsTable.id.primary).toBe(true);
				});

				it("should have a default value function", () => {
					expect(eventExceptionsTable.id.hasDefault).toBe(true);
				});

				it("should generate a valid UUIDv7 when defaultFn is called", () => {
					const idColumn = eventExceptionsTable.id as ColumnWithDefaultFn;
					expect(idColumn.defaultFn).toBeDefined();
					const generatedId = idColumn.defaultFn?.();
					expect(typeof generatedId).toBe("string");
					// UUIDv7 format
					expect(generatedId).toMatch(
						/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
					);
				});
			});

			describe("recurringEventInstanceId column", () => {
				it("should be a uuid column", () => {
					expect(eventExceptionsTable.recurringEventInstanceId.dataType).toBe(
						"string",
					);
					expect(eventExceptionsTable.recurringEventInstanceId.columnType).toBe(
						"PgUUID",
					);
				});

				it("should be not null", () => {
					expect(eventExceptionsTable.recurringEventInstanceId.notNull).toBe(
						true,
					);
				});
			});

			describe("exceptionData column", () => {
				it("should be a jsonb column", () => {
					expect(eventExceptionsTable.exceptionData.dataType).toBe("json");
					expect(eventExceptionsTable.exceptionData.columnType).toBe("PgJsonb");
				});

				it("should be not null", () => {
					expect(eventExceptionsTable.exceptionData.notNull).toBe(true);
				});
			});

			describe("organizationId column", () => {
				it("should be a uuid column", () => {
					expect(eventExceptionsTable.organizationId.dataType).toBe("string");
					expect(eventExceptionsTable.organizationId.columnType).toBe("PgUUID");
				});

				it("should be not null", () => {
					expect(eventExceptionsTable.organizationId.notNull).toBe(true);
				});
			});

			describe("creatorId column", () => {
				it("should be a uuid column", () => {
					expect(eventExceptionsTable.creatorId.dataType).toBe("string");
					expect(eventExceptionsTable.creatorId.columnType).toBe("PgUUID");
				});

				it("should be not null", () => {
					expect(eventExceptionsTable.creatorId.notNull).toBe(true);
				});
			});

			describe("updaterId column", () => {
				it("should be a uuid column", () => {
					expect(eventExceptionsTable.updaterId.dataType).toBe("string");
					expect(eventExceptionsTable.updaterId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(eventExceptionsTable.updaterId.notNull).toBe(false);
				});
			});

			describe("createdAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventExceptionsTable.createdAt.dataType).toBe("date");
					expect(eventExceptionsTable.createdAt.columnType).toBe("PgTimestamp");
				});

				it("should be not null", () => {
					expect(eventExceptionsTable.createdAt.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventExceptionsTable.createdAt.hasDefault).toBe(true);
				});
			});

			describe("updatedAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventExceptionsTable.updatedAt.dataType).toBe("date");
					expect(eventExceptionsTable.updatedAt.columnType).toBe("PgTimestamp");
				});

				it("should be nullable", () => {
					expect(eventExceptionsTable.updatedAt.notNull).toBe(false);
				});

				it("should have a defaultFn that returns SQL null", () => {
					const updatedAtColumn =
						eventExceptionsTable.updatedAt as ColumnWithDefaultFn;
					expect(updatedAtColumn.defaultFn).toBeDefined();
					const defaultValue = updatedAtColumn.defaultFn?.();
					expect(defaultValue).toBeInstanceOf(SQL);
				});

				it("should have an onUpdateFn that returns a Date", () => {
					const updatedAtColumn =
						eventExceptionsTable.updatedAt as ColumnWithOnUpdateFn;
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
			it("should have four foreign keys defined", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
				expect(tableConfig.foreignKeys).toHaveLength(4);
			});

			it("should have recurringEventInstanceId referencing recurringEventInstancesTable.id", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
				const instanceFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col) => col.name === "recurring_event_instance_id",
					);
				});
				expect(instanceFk).toBeDefined();
				expect(instanceFk?.onDelete).toBe("cascade");
				expect(instanceFk?.onUpdate).toBe("cascade");
				const ref = instanceFk?.reference();
				expect(ref?.foreignTable).toBe(recurringEventInstancesTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});

			it("should have organizationId referencing organizationsTable.id", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
				const orgFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "organization_id");
				});
				expect(orgFk).toBeDefined();
				expect(orgFk?.onDelete).toBe("cascade");
				expect(orgFk?.onUpdate).toBe("cascade");
				const ref = orgFk?.reference();
				expect(ref?.foreignTable).toBe(organizationsTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});

			it("should have creatorId referencing usersTable.id", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
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
				const tableConfig = getTableConfig(eventExceptionsTable);
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
			it("should have appropriate indexes defined", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
				// recurringEventInstanceIdIdx, organizationIdIdx, creatorIdIdx
				expect(tableConfig.indexes).toHaveLength(3);
			});

			it("should have an index on recurringEventInstanceId column", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) =>
							"name" in col && col.name === "recurring_event_instance_id",
					),
				);
				expect(idx).toBeDefined();
			});

			it("should have an index on organizationId column", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) => "name" in col && col.name === "organization_id",
					),
				);
				expect(idx).toBeDefined();
			});

			it("should have an index on creatorId column", () => {
				const tableConfig = getTableConfig(eventExceptionsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) => "name" in col && col.name === "creator_id",
					),
				);
				expect(idx).toBeDefined();
			});
		});
	});

	describe("eventExceptionsTableRelations", () => {
		it("should be defined", () => {
			expect(eventExceptionsTableRelations).toBeDefined();
		});

		it("should be associated with eventExceptionsTable", () => {
			expect(eventExceptionsTableRelations.table).toBe(eventExceptionsTable);
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
						typeof eventExceptionsTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof eventExceptionsTableRelations.config
					>[0]["many"],
				};
			};

			it("should define four relations", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventExceptionsTableRelations.config({
					one,
					many,
				});

				expect(relationsResult.recurringEventInstance).toBeDefined();
				expect(relationsResult.organization).toBeDefined();
				expect(relationsResult.creator).toBeDefined();
				expect(relationsResult.updater).toBeDefined();
			});

			it("should define recurringEventInstance as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventExceptionsTableRelations.config({
					one,
					many,
				});
				const rel =
					relationsResult.recurringEventInstance as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(recurringEventInstancesTable);
			});

			it("should define organization as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventExceptionsTableRelations.config({
					one,
					many,
				});
				const rel = relationsResult.organization as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(organizationsTable);
			});

			it("should define creator as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventExceptionsTableRelations.config({
					one,
					many,
				});
				const rel = relationsResult.creator as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(usersTable);
			});

			it("should define updater as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventExceptionsTableRelations.config({
					one,
					many,
				});
				const rel = relationsResult.updater as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(usersTable);
			});
		});
	});
});
