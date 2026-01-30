import { faker } from "@faker-js/faker";
import { getTableName, SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
	agendaFoldersTable,
	agendaFoldersTableInsertSchema,
	agendaFoldersTableRelations,
} from "~/src/drizzle/tables/agendaFolders";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { eventsTable } from "~/src/drizzle/tables/events";
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
 * Tests for agendaFoldersTable - validates the table schema, relations, and indexes.
 */
describe("src/drizzle/tables/agendaFolders.ts", () => {
	describe("agendaFoldersTable schema", () => {
		it("should have the correct table name", () => {
			expect(getTableName(agendaFoldersTable)).toBe("agenda_folders");
		});

		describe("columns", () => {
			it("should have all required columns defined", () => {
				const columns = Object.keys(agendaFoldersTable);
				expect(columns).toContain("id");
				expect(columns).toContain("name");
				expect(columns).toContain("description");
				expect(columns).toContain("sequence");
				expect(columns).toContain("isDefaultFolder");
				expect(columns).toContain("eventId");
				expect(columns).toContain("organizationId");
				expect(columns).toContain("creatorId");
				expect(columns).toContain("updaterId");
				expect(columns).toContain("createdAt");
				expect(columns).toContain("updatedAt");
			});

			describe("id column", () => {
				it("should be a uuid primary key", () => {
					expect(agendaFoldersTable.id.dataType).toBe("string");
					expect(agendaFoldersTable.id.columnType).toBe("PgUUID");
					expect(agendaFoldersTable.id.primary).toBe(true);
				});

				it("should have a default value function", () => {
					expect(agendaFoldersTable.id.hasDefault).toBe(true);
				});

				it("should generate a valid UUIDv7 when defaultFn is called", () => {
					const idColumn = agendaFoldersTable.id as ColumnWithDefaultFn;
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
					expect(agendaFoldersTable.name.dataType).toBe("string");
					expect(agendaFoldersTable.name.columnType).toBe("PgText");
				});

				it("should be not null", () => {
					expect(agendaFoldersTable.name.notNull).toBe(true);
				});
			});

			describe("description column", () => {
				it("should be a text column", () => {
					expect(agendaFoldersTable.description.dataType).toBe("string");
					expect(agendaFoldersTable.description.columnType).toBe("PgText");
				});

				it("should be nullable", () => {
					expect(agendaFoldersTable.description.notNull).toBe(false);
				});
			});

			describe("sequence column", () => {
				it("should be an integer column", () => {
					expect(agendaFoldersTable.sequence.dataType).toBe("number");
					expect(agendaFoldersTable.sequence.columnType).toBe("PgInteger");
				});

				it("should be nullable", () => {
					expect(agendaFoldersTable.sequence.notNull).toBe(false);
				});
			});

			describe("isDefaultFolder column", () => {
				it("should be a boolean column", () => {
					expect(agendaFoldersTable.isDefaultFolder.dataType).toBe("boolean");
					expect(agendaFoldersTable.isDefaultFolder.columnType).toBe(
						"PgBoolean",
					);
				});

				it("should be not null", () => {
					expect(agendaFoldersTable.isDefaultFolder.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(agendaFoldersTable.isDefaultFolder.hasDefault).toBe(true);
				});
			});

			describe("creatorId column", () => {
				it("should be a uuid column", () => {
					expect(agendaFoldersTable.creatorId.dataType).toBe("string");
					expect(agendaFoldersTable.creatorId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(agendaFoldersTable.creatorId.notNull).toBe(false);
				});
			});

			describe("updaterId column", () => {
				it("should be a uuid column", () => {
					expect(agendaFoldersTable.updaterId.dataType).toBe("string");
					expect(agendaFoldersTable.updaterId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(agendaFoldersTable.updaterId.notNull).toBe(false);
				});
			});

			describe("createdAt column", () => {
				it("should be a timestamp column", () => {
					expect(agendaFoldersTable.createdAt.dataType).toBe("date");
					expect(agendaFoldersTable.createdAt.columnType).toBe("PgTimestamp");
				});

				it("should be not null", () => {
					expect(agendaFoldersTable.createdAt.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(agendaFoldersTable.createdAt.hasDefault).toBe(true);
				});
			});

			describe("updatedAt column", () => {
				it("should be a timestamp column", () => {
					expect(agendaFoldersTable.updatedAt.dataType).toBe("date");
					expect(agendaFoldersTable.updatedAt.columnType).toBe("PgTimestamp");
				});

				it("should be nullable", () => {
					expect(agendaFoldersTable.updatedAt.notNull).toBe(false);
				});

				it("should have a defaultFn that returns SQL null", () => {
					const updatedAtColumn =
						agendaFoldersTable.updatedAt as ColumnWithDefaultFn;
					expect(updatedAtColumn.defaultFn).toBeDefined();
					const defaultValue = updatedAtColumn.defaultFn?.();
					// The defaultFn returns sql`${null}` which is a SQL object
					expect(defaultValue).toBeInstanceOf(SQL);
				});

				it("should have an onUpdateFn that returns a Date", () => {
					const updatedAtColumn =
						agendaFoldersTable.updatedAt as ColumnWithOnUpdateFn;
					expect(updatedAtColumn.onUpdateFn).toBeDefined();
					const updateValue = updatedAtColumn.onUpdateFn?.();
					expect(updateValue).toBeInstanceOf(Date);
				});
			});
		});

		describe("foreign keys", () => {
			it("should have four foreign keys defined", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				expect(tableConfig.foreignKeys).toHaveLength(4);
			});

			it("should have creatorId referencing usersTable.id", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
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

			it("should have eventId referencing eventsTable.id", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				const eventFk = tableConfig.foreignKeys.find((fk) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "event_id");
				});
				expect(eventFk).toBeDefined();
				expect(eventFk?.onDelete).toBe("cascade");
				expect(eventFk?.onUpdate).toBe("cascade");
				// Execute the reference function to cover the callback
				const ref = eventFk?.reference();
				expect(ref?.foreignTable).toBe(eventsTable);
				expect(ref?.foreignColumns[0]?.name).toBe("id");
			});

			it("should have organizationId referencing organizationsTable.id", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
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
				const tableConfig = getTableConfig(agendaFoldersTable);
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
			it("should have five indexes defined", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				expect(tableConfig.indexes).toHaveLength(5);
			});

			it("should have an index on createdAt column", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				const createdAtIndex = tableConfig.indexes.find((idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "created_at",
					),
				);
				expect(createdAtIndex).toBeDefined();
			});

			it("should have an index on creatorId column", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				const creatorIdIndex = tableConfig.indexes.find((idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "creator_id",
					),
				);
				expect(creatorIdIndex).toBeDefined();
			});

			it("should have an index on eventId column", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				const eventIdIndex = tableConfig.indexes.find((idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "event_id",
					),
				);
				expect(eventIdIndex).toBeDefined();
			});

			it("should have an index on name column", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				const nameIndex = tableConfig.indexes.find((idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "name",
					),
				);
				expect(nameIndex).toBeDefined();
			});

			it("should have an index on organizationId column", () => {
				const tableConfig = getTableConfig(agendaFoldersTable);
				const orgIdIndex = tableConfig.indexes.find((idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "organization_id",
					),
				);
				expect(orgIdIndex).toBeDefined();
			});
		});
	});

	describe("agendaFoldersTableRelations", () => {
		it("should be defined", () => {
			expect(agendaFoldersTableRelations).toBeDefined();
		});

		it("should be associated with agendaFoldersTable", () => {
			expect(agendaFoldersTableRelations.table).toBe(agendaFoldersTable);
		});

		it("should have a config function", () => {
			expect(typeof agendaFoldersTableRelations.config).toBe("function");
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
						typeof agendaFoldersTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof agendaFoldersTableRelations.config
					>[0]["many"],
				};
			};

			it("should define five relations", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = agendaFoldersTableRelations.config({
					one,
					many,
				});

				// Verify all five relations are defined
				expect(relationsResult.agendaItemsWhereFolder).toBeDefined();
				expect(relationsResult.creator).toBeDefined();
				expect(relationsResult.event).toBeDefined();
				expect(relationsResult.organization).toBeDefined();
				expect(relationsResult.updater).toBeDefined();
			});

			it("should define agendaItemsWhereFolder as a one-to-many relation", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = agendaFoldersTableRelations.config({
					one,
					many,
				});

				const agendaItemsWhereFolder =
					relationsResult.agendaItemsWhereFolder as unknown as RelationCall;
				expect(agendaItemsWhereFolder.type).toBe("many");
				expect(agendaItemsWhereFolder.table).toBe(agendaItemsTable);
			});

			it("should define creator as a one-to-one relation with usersTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = agendaFoldersTableRelations.config({
					one,
					many,
				});

				const creator = relationsResult.creator as unknown as RelationCall;
				expect(creator.type).toBe("one");
				expect(creator.table).toBe(usersTable);
			});

			it("should define event as a one-to-one relation with eventsTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = agendaFoldersTableRelations.config({
					one,
					many,
				});

				const event = relationsResult.event as unknown as RelationCall;
				expect(event.type).toBe("one");
				expect(event.table).toBe(eventsTable);
			});

			it("should define organization as a one-to-one relation with organizationsTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = agendaFoldersTableRelations.config({
					one,
					many,
				});

				const organization =
					relationsResult.organization as unknown as RelationCall;
				expect(organization.type).toBe("one");
				expect(organization.table).toBe(organizationsTable);
			});

			it("should define updater as a one-to-one relation with usersTable", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = agendaFoldersTableRelations.config({
					one,
					many,
				});

				const updater = relationsResult.updater as unknown as RelationCall;
				expect(updater.type).toBe("one");
				expect(updater.table).toBe(usersTable);
			});
		});
	});

	describe("agendaFoldersTableInsertSchema", () => {
		const validInput = {
			name: "Test Agenda Folder",
			eventId: faker.string.uuid(),
			organizationId: faker.string.uuid(),
		};

		describe("name validation", () => {
			it("should accept valid name", () => {
				const result = agendaFoldersTableInsertSchema.safeParse(validInput);
				expect(result.success).toBe(true);
			});

			it("should reject empty name", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					name: "",
				});
				expect(result.success).toBe(false);
			});

			it("should accept name at min length (1)", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					name: "a",
				});
				expect(result.success).toBe(true);
			});

			it("should accept name at max length (256)", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					name: "a".repeat(256),
				});
				expect(result.success).toBe(true);
			});

			it("should reject name exceeding max length (256)", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					name: "a".repeat(257),
				});
				expect(result.success).toBe(false);
			});
		});

		describe("description validation", () => {
			it("should accept valid description", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					description: "This is a test description",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined description", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					description: undefined,
				});
				expect(result.success).toBe(true);
			});

			it("should reject empty description", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					description: "",
				});
				expect(result.success).toBe(false);
			});

			it("should accept description at min length (1)", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					description: "a",
				});
				expect(result.success).toBe(true);
			});

			it("should accept description at max length (2048)", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					description: "a".repeat(2048),
				});
				expect(result.success).toBe(true);
			});

			it("should reject description exceeding max length (2048)", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					description: "a".repeat(2049),
				});
				expect(result.success).toBe(false);
			});
		});

		describe("sequence validation", () => {
			it("should accept valid sequence", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					sequence: 5,
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined sequence", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					sequence: undefined,
				});
				expect(result.success).toBe(true);
			});

			it("should accept sequence at min value (1)", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					sequence: 1,
				});
				expect(result.success).toBe(true);
			});

			it("should reject sequence less than 1", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					sequence: 0,
				});
				expect(result.success).toBe(false);
			});

			it("should reject negative sequence", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					sequence: -1,
				});
				expect(result.success).toBe(false);
			});

			it("should reject non-integer sequence", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					sequence: 1.5,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("required fields validation", () => {
			it("should reject missing name", () => {
				const { name: _name, ...input } = validInput;
				const result = agendaFoldersTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing eventId", () => {
				const { eventId: _eventId, ...input } = validInput;
				const result = agendaFoldersTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing organizationId", () => {
				const { organizationId: _organizationId, ...input } = validInput;
				const result = agendaFoldersTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});
		});

		describe("optional fields validation", () => {
			it("should accept input with creatorId", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					creatorId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with updaterId", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with isDefaultFolder", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					isDefaultFolder: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept input without optional fields", () => {
				const result = agendaFoldersTableInsertSchema.safeParse(validInput);
				expect(result.success).toBe(true);
			});
		});

		describe("UUID validation", () => {
			it("should reject invalid eventId UUID", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					eventId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid organizationId UUID", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					organizationId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid creatorId UUID", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					creatorId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid updaterId UUID", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					updaterId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("edge cases", () => {
			it("should reject null values for required fields", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					name: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject empty object", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});

			it("should accept all optional fields together", () => {
				const result = agendaFoldersTableInsertSchema.safeParse({
					...validInput,
					description: "A test description",
					sequence: 10,
					isDefaultFolder: false,
					creatorId: faker.string.uuid(),
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});
		});
	});
});
