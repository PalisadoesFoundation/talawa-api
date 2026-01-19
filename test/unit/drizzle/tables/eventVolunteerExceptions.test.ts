import { getTableName } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
	eventVolunteerExceptionsTable,
	eventVolunteerExceptionsTableRelations,
} from "~/src/drizzle/tables/eventVolunteerExceptions";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";

/**
 * Tests for eventVolunteerExceptionsTable - validates the table schema, relations, and indexes.
 */
describe("src/drizzle/tables/eventVolunteerExceptions.ts", () => {
	describe("eventVolunteerExceptionsTable schema", () => {
		it("should have the correct table name", () => {
			expect(getTableName(eventVolunteerExceptionsTable)).toBe(
				"event_volunteer_exceptions",
			);
		});

		describe("columns", () => {
			it("should have all required columns defined", () => {
				const columns = Object.keys(eventVolunteerExceptionsTable);
				expect(columns).toContain("id");
				expect(columns).toContain("volunteerId");
				expect(columns).toContain("recurringEventInstanceId");
				expect(columns).toContain("createdAt");
				expect(columns).toContain("updatedAt");
				expect(columns).toContain("createdBy");
				expect(columns).toContain("updatedBy");
			});

			describe("id column", () => {
				it("should be a uuid primary key", () => {
					expect(eventVolunteerExceptionsTable.id.dataType).toBe("string");
					expect(eventVolunteerExceptionsTable.id.columnType).toBe("PgUUID");
					expect(eventVolunteerExceptionsTable.id.primary).toBe(true);
				});

				it("should have a default value function", () => {
					expect(eventVolunteerExceptionsTable.id.hasDefault).toBe(true);
				});
			});

			describe("volunteerId column", () => {
				it("should be a uuid column", () => {
					expect(eventVolunteerExceptionsTable.volunteerId.dataType).toBe(
						"string",
					);
					expect(eventVolunteerExceptionsTable.volunteerId.columnType).toBe(
						"PgUUID",
					);
				});

				it("should be not null", () => {
					expect(eventVolunteerExceptionsTable.volunteerId.notNull).toBe(true);
				});
			});

			describe("recurringEventInstanceId column", () => {
				it("should be a uuid column", () => {
					expect(
						eventVolunteerExceptionsTable.recurringEventInstanceId.dataType,
					).toBe("string");
					expect(
						eventVolunteerExceptionsTable.recurringEventInstanceId.columnType,
					).toBe("PgUUID");
				});

				it("should be not null", () => {
					expect(
						eventVolunteerExceptionsTable.recurringEventInstanceId.notNull,
					).toBe(true);
				});
			});

			describe("createdAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventVolunteerExceptionsTable.createdAt.dataType).toBe("date");
					expect(eventVolunteerExceptionsTable.createdAt.columnType).toBe(
						"PgTimestamp",
					);
				});

				it("should be not null", () => {
					expect(eventVolunteerExceptionsTable.createdAt.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventVolunteerExceptionsTable.createdAt.hasDefault).toBe(true);
				});
			});

			describe("updatedAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventVolunteerExceptionsTable.updatedAt.dataType).toBe("date");
					expect(eventVolunteerExceptionsTable.updatedAt.columnType).toBe(
						"PgTimestamp",
					);
				});

				it("should be not null", () => {
					expect(eventVolunteerExceptionsTable.updatedAt.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventVolunteerExceptionsTable.updatedAt.hasDefault).toBe(true);
				});
			});

			describe("createdBy column", () => {
				it("should be a uuid column", () => {
					expect(eventVolunteerExceptionsTable.createdBy.dataType).toBe(
						"string",
					);
					expect(eventVolunteerExceptionsTable.createdBy.columnType).toBe(
						"PgUUID",
					);
				});

				it("should be nullable", () => {
					expect(eventVolunteerExceptionsTable.createdBy.notNull).toBe(false);
				});
			});

			describe("updatedBy column", () => {
				it("should be a uuid column", () => {
					expect(eventVolunteerExceptionsTable.updatedBy.dataType).toBe(
						"string",
					);
					expect(eventVolunteerExceptionsTable.updatedBy.columnType).toBe(
						"PgUUID",
					);
				});

				it("should be nullable", () => {
					expect(eventVolunteerExceptionsTable.updatedBy.notNull).toBe(false);
				});
			});
		});

		describe("foreign keys", () => {
			it("should have four foreign keys defined", () => {
				const tableConfig = getTableConfig(eventVolunteerExceptionsTable);
				expect(tableConfig.foreignKeys).toHaveLength(4);
			});

			it("should have volunteerId referencing eventVolunteersTable.id", () => {
				const tableConfig = getTableConfig(eventVolunteerExceptionsTable);
				const volunteerFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "volunteer_id");
				});
				expect(volunteerFk).toBeDefined();
				expect(volunteerFk?.onDelete).toBe("cascade");
				expect(volunteerFk?.onUpdate).toBe("cascade");
				const ref = volunteerFk?.reference();
				expect(ref?.foreignTable).toBe(eventVolunteersTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});

			it("should have recurringEventInstanceId referencing recurringEventInstancesTable.id", () => {
				const tableConfig = getTableConfig(eventVolunteerExceptionsTable);
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

			it("should have createdBy referencing usersTable.id", () => {
				const tableConfig = getTableConfig(eventVolunteerExceptionsTable);
				const creatorFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "created_by");
				});
				expect(creatorFk).toBeDefined();
				expect(creatorFk?.onDelete).toBe("set null");
				expect(creatorFk?.onUpdate).toBe("cascade");
				const ref = creatorFk?.reference();
				expect(ref?.foreignTable).toBe(usersTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});

			it("should have updatedBy referencing usersTable.id", () => {
				const tableConfig = getTableConfig(eventVolunteerExceptionsTable);
				const updaterFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "updated_by");
				});
				expect(updaterFk).toBeDefined();
				expect(updaterFk?.onDelete).toBe("set null");
				expect(updaterFk?.onUpdate).toBe("cascade");
				const ref = updaterFk?.reference();
				expect(ref?.foreignTable).toBe(usersTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});
		});

		describe("unique constraints", () => {
			it("should have a unique constraint on volunteerId and recurringEventInstanceId", () => {
				const tableConfig = getTableConfig(eventVolunteerExceptionsTable);
				// NOTE: Drizzle stores unique constraints in the `uniqueConstraints` array, NOT `indexes` or `checks`
				// Depending on how it was defined. The current file uses:
				// (table) => { return { unq: unique().on(table.volunteerId, table.recurringEventInstanceId) }; }
				// This creates a unique constraint.
				expect(tableConfig.uniqueConstraints).toHaveLength(1);

				const uniqueConstraint = tableConfig.uniqueConstraints[0];
				expect(uniqueConstraint).toBeDefined();
				expect(uniqueConstraint?.columns.length).toBe(2);
				const colNames = uniqueConstraint?.columns.map((c) => c.name);
				expect(colNames).toContain("volunteer_id");
				expect(colNames).toContain("recurring_event_instance_id");
			});
		});
	});

	describe("eventVolunteerExceptionsTableRelations", () => {
		it("should be defined", () => {
			expect(eventVolunteerExceptionsTableRelations).toBeDefined();
		});

		it("should be associated with eventVolunteerExceptionsTable", () => {
			expect(eventVolunteerExceptionsTableRelations.table).toBe(
				eventVolunteerExceptionsTable,
			);
		});

		describe("relation definitions", () => {
			type RelationCall = {
				type: "one" | "many";
				table: unknown;
				config: {
					fields: PgColumn[];
					references: PgColumn[];
					relationName?: string;
				};
				withFieldName: (fieldName: string) => RelationCall;
			};

			const createMockBuilders = () => {
				const one = (table: unknown, config: unknown): RelationCall => {
					const result: RelationCall = {
						type: "one" as const,
						table,
						config: config as RelationCall["config"],
						withFieldName: () => result,
					};
					return result;
				};

				const many = (table: unknown, config: unknown): RelationCall => {
					const result: RelationCall = {
						type: "many" as const,
						table,
						config: config as RelationCall["config"],
						withFieldName: () => result,
					};
					return result;
				};

				return {
					one: one as unknown as Parameters<
						typeof eventVolunteerExceptionsTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof eventVolunteerExceptionsTableRelations.config
					>[0]["many"],
				};
			};

			it("should define four relations", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventVolunteerExceptionsTableRelations.config({
					one,
					many,
				});

				expect(relationsResult.volunteer).toBeDefined();
				expect(relationsResult.recurringEventInstance).toBeDefined();
				expect(relationsResult.createdByUser).toBeDefined();
				expect(relationsResult.updatedByUser).toBeDefined();
			});

			it("should define volunteer as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventVolunteerExceptionsTableRelations.config({
					one,
					many,
				});
				const rel = relationsResult.volunteer as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(eventVolunteersTable);
				expect(rel.config.fields).toEqual([
					eventVolunteerExceptionsTable.volunteerId,
				]);
				expect(rel.config.references).toEqual([eventVolunteersTable.id]);
			});

			it("should define recurringEventInstance as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventVolunteerExceptionsTableRelations.config({
					one,
					many,
				});
				const rel =
					relationsResult.recurringEventInstance as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(recurringEventInstancesTable);
				expect(rel.config.fields).toEqual([
					eventVolunteerExceptionsTable.recurringEventInstanceId,
				]);
				expect(rel.config.references).toEqual([
					recurringEventInstancesTable.id,
				]);
			});

			it("should define createdByUser as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventVolunteerExceptionsTableRelations.config({
					one,
					many,
				});
				const rel = relationsResult.createdByUser as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(usersTable);
				expect(rel.config.fields).toEqual([
					eventVolunteerExceptionsTable.createdBy,
				]);
				expect(rel.config.references).toEqual([usersTable.id]);
			});

			it("should define updatedByUser as a one-to-one relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventVolunteerExceptionsTableRelations.config({
					one,
					many,
				});
				const rel = relationsResult.updatedByUser as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(usersTable);
				expect(rel.config.fields).toEqual([
					eventVolunteerExceptionsTable.updatedBy,
				]);
				expect(rel.config.references).toEqual([usersTable.id]);
			});
		});
	});
});
