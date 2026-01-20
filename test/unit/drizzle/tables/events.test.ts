import { getTableName, SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import {
	eventsTable,
	eventsTableInsertSchema,
	eventsTableRelations,
} from "~/src/drizzle/tables/events";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { venueBookingsTable } from "~/src/drizzle/tables/venueBookings";

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
 * Tests for eventsTable - validates the table schema, relations, and indexes.
 */
describe("src/drizzle/tables/events.ts", () => {
	describe("eventsTable schema", () => {
		it("should have the correct table name", () => {
			expect(getTableName(eventsTable)).toBe("events");
		});

		describe("columns", () => {
			it("should have all required columns defined", () => {
				const columns = Object.keys(eventsTable);
				expect(columns).toContain("allDay");
				expect(columns).toContain("createdAt");
				expect(columns).toContain("creatorId");
				expect(columns).toContain("description");
				expect(columns).toContain("endAt");
				expect(columns).toContain("id");
				expect(columns).toContain("isInviteOnly");
				expect(columns).toContain("isPublic");
				expect(columns).toContain("isRegisterable");
				expect(columns).toContain("isRecurringEventTemplate");
				expect(columns).toContain("location");
				expect(columns).toContain("name");
				expect(columns).toContain("organizationId");
				expect(columns).toContain("startAt");
				expect(columns).toContain("updatedAt");
				expect(columns).toContain("updaterId");
			});

			describe("id column", () => {
				it("should be a uuid primary key", () => {
					expect(eventsTable.id.dataType).toBe("string");
					expect(eventsTable.id.columnType).toBe("PgUUID");
					expect(eventsTable.id.primary).toBe(true);
				});

				it("should have a default value function", () => {
					expect(eventsTable.id.hasDefault).toBe(true);
				});

				it("should generate a valid UUIDv7 when defaultFn is called", () => {
					const idColumn = eventsTable.id as ColumnWithDefaultFn;
					expect(idColumn.defaultFn).toBeDefined();
					const generatedId = idColumn.defaultFn?.();
					expect(typeof generatedId).toBe("string");
					// UUIDv7 format
					expect(generatedId).toMatch(
						/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
					);
				});
			});

			describe("organizationId column", () => {
				it("should be a uuid column", () => {
					expect(eventsTable.organizationId.dataType).toBe("string");
					expect(eventsTable.organizationId.columnType).toBe("PgUUID");
				});

				it("should be not null", () => {
					expect(eventsTable.organizationId.notNull).toBe(true);
				});
			});

			describe("creatorId column", () => {
				it("should be a uuid column", () => {
					expect(eventsTable.creatorId.dataType).toBe("string");
					expect(eventsTable.creatorId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(eventsTable.creatorId.notNull).toBe(false);
				});
			});

			describe("updaterId column", () => {
				it("should be a uuid column", () => {
					expect(eventsTable.updaterId.dataType).toBe("string");
					expect(eventsTable.updaterId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(eventsTable.updaterId.notNull).toBe(false);
				});
			});

			describe("createdAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventsTable.createdAt.dataType).toBe("date");
					expect(eventsTable.createdAt.columnType).toBe("PgTimestamp");
				});

				it("should be not null", () => {
					expect(eventsTable.createdAt.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventsTable.createdAt.hasDefault).toBe(true);
				});
			});

			describe("updatedAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventsTable.updatedAt.dataType).toBe("date");
					expect(eventsTable.updatedAt.columnType).toBe("PgTimestamp");
				});

				it("should be nullable", () => {
					expect(eventsTable.updatedAt.notNull).toBe(false);
				});

				it("should have a defaultFn that returns SQL null", () => {
					const updatedAtColumn = eventsTable.updatedAt as ColumnWithDefaultFn;
					expect(updatedAtColumn.defaultFn).toBeDefined();
					const defaultValue = updatedAtColumn.defaultFn?.();
					expect(defaultValue).toBeInstanceOf(SQL);
				});

				it("should have an onUpdateFn that returns a Date", () => {
					const updatedAtColumn = eventsTable.updatedAt as ColumnWithOnUpdateFn;
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

			describe("startAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventsTable.startAt.dataType).toBe("date");
					expect(eventsTable.startAt.columnType).toBe("PgTimestamp");
				});

				it("should be not null", () => {
					expect(eventsTable.startAt.notNull).toBe(true);
				});
			});

			describe("endAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventsTable.endAt.dataType).toBe("date");
					expect(eventsTable.endAt.columnType).toBe("PgTimestamp");
				});

				it("should be not null", () => {
					expect(eventsTable.endAt.notNull).toBe(true);
				});
			});

			describe("name column", () => {
				it("should be a text column", () => {
					expect(eventsTable.name.dataType).toBe("string");
					expect(eventsTable.name.columnType).toBe("PgText");
				});

				it("should be not null", () => {
					expect(eventsTable.name.notNull).toBe(true);
				});
			});

			describe("description column", () => {
				it("should be a text column", () => {
					expect(eventsTable.description.dataType).toBe("string");
					expect(eventsTable.description.columnType).toBe("PgText");
				});

				it("should be nullable", () => {
					expect(eventsTable.description.notNull).toBe(false);
				});
			});

			describe("location column", () => {
				it("should be a text column", () => {
					expect(eventsTable.location.dataType).toBe("string");
					expect(eventsTable.location.columnType).toBe("PgText");
				});

				it("should be nullable", () => {
					expect(eventsTable.location.notNull).toBe(false);
				});
			});

			describe("Boolean flags", () => {
				it("should define allDay correctly", () => {
					expect(eventsTable.allDay.dataType).toBe("boolean");
					expect(eventsTable.allDay.columnType).toBe("PgBoolean");
					expect(eventsTable.allDay.notNull).toBe(true);
					expect(eventsTable.allDay.default).toBe(false);
				});

				it("should define isInviteOnly correctly", () => {
					expect(eventsTable.isInviteOnly.dataType).toBe("boolean");
					expect(eventsTable.isInviteOnly.columnType).toBe("PgBoolean");
					expect(eventsTable.isInviteOnly.notNull).toBe(true);
					expect(eventsTable.isInviteOnly.default).toBe(false);
				});

				it("should define isPublic correctly", () => {
					expect(eventsTable.isPublic.dataType).toBe("boolean");
					expect(eventsTable.isPublic.columnType).toBe("PgBoolean");
					expect(eventsTable.isPublic.notNull).toBe(true);
					expect(eventsTable.isPublic.default).toBe(false);
				});

				it("should define isRegisterable correctly", () => {
					expect(eventsTable.isRegisterable.dataType).toBe("boolean");
					expect(eventsTable.isRegisterable.columnType).toBe("PgBoolean");
					expect(eventsTable.isRegisterable.notNull).toBe(true);
					expect(eventsTable.isRegisterable.default).toBe(false);
				});

				it("should define isRecurringEventTemplate correctly", () => {
					expect(eventsTable.isRecurringEventTemplate.dataType).toBe("boolean");
					expect(eventsTable.isRecurringEventTemplate.columnType).toBe(
						"PgBoolean",
					);
					expect(eventsTable.isRecurringEventTemplate.notNull).toBe(true);
					expect(eventsTable.isRecurringEventTemplate.default).toBe(false);
				});
			});
		});

		describe("foreign keys", () => {
			it("should have three foreign keys defined", () => {
				const tableConfig = getTableConfig(eventsTable);
				expect(tableConfig.foreignKeys).toHaveLength(3);
			});

			it("should have creatorId referencing usersTable.id", () => {
				const tableConfig = getTableConfig(eventsTable);
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
				const tableConfig = getTableConfig(eventsTable);
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

			it("should have organizationId referencing organizationsTable.id", () => {
				const tableConfig = getTableConfig(eventsTable);
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
		});

		describe("indexes", () => {
			it("should have appropriate indexes defined", () => {
				const tableConfig = getTableConfig(eventsTable);
				// Check for major indexes
				expect(tableConfig.indexes.length).toBeGreaterThan(0);
			});

			it("should have an index on organizationId", () => {
				const tableConfig = getTableConfig(eventsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) => "name" in col && col.name === "organization_id",
					),
				);
				expect(idx).toBeDefined();
			});

			it("should have an index on creatorId", () => {
				const tableConfig = getTableConfig(eventsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) => "name" in col && col.name === "creator_id",
					),
				);
				expect(idx).toBeDefined();
			});

			it("should have an index on startAt", () => {
				const tableConfig = getTableConfig(eventsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) => "name" in col && col.name === "start_at",
					),
				);
				expect(idx).toBeDefined();
			});

			it("should have an index on endAt", () => {
				const tableConfig = getTableConfig(eventsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) => "name" in col && col.name === "end_at",
					),
				);
				expect(idx).toBeDefined();
			});

			it("should have an index on isRecurringEventTemplate", () => {
				const tableConfig = getTableConfig(eventsTable);
				const idx = tableConfig.indexes.find((i) =>
					i.config.columns.some(
						(col) => "name" in col && col.name === "is_recurring_template",
					),
				);
				expect(idx).toBeDefined();
			});
		});
	});

	describe("eventsTableRelations", () => {
		it("should be defined", () => {
			expect(eventsTableRelations).toBeDefined();
		});

		it("should be associated with eventsTable", () => {
			expect(eventsTableRelations.table).toBe(eventsTable);
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
						typeof eventsTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof eventsTableRelations.config
					>[0]["many"],
				};
			};

			it("should define relations correctly", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventsTableRelations.config({ one, many });

				expect(relationsResult.agendaFoldersWhereEvent).toBeDefined();
				expect(relationsResult.creator).toBeDefined();
				expect(relationsResult.attachmentsWhereEvent).toBeDefined();
				expect(relationsResult.organization).toBeDefined();
				expect(relationsResult.updater).toBeDefined();
				expect(relationsResult.venueBookingsWhereEvent).toBeDefined();
			});

			it("should define organization as one-to-one", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventsTableRelations.config({ one, many });
				const rel = relationsResult.organization as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(organizationsTable);
			});

			it("should define creator as one-to-one", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventsTableRelations.config({ one, many });
				const rel = relationsResult.creator as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(usersTable);
			});

			it("should define updater as one-to-one", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventsTableRelations.config({ one, many });
				const rel = relationsResult.updater as unknown as RelationCall;
				expect(rel.type).toBe("one");
				expect(rel.table).toBe(usersTable);
			});

			it("should define agendaFoldersWhereEvent as one-to-many", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventsTableRelations.config({ one, many });
				const rel =
					relationsResult.agendaFoldersWhereEvent as unknown as RelationCall;
				expect(rel.type).toBe("many");
				expect(rel.table).toBe(agendaFoldersTable);
			});

			it("should define attachmentsWhereEvent as one-to-many", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventsTableRelations.config({ one, many });
				const rel =
					relationsResult.attachmentsWhereEvent as unknown as RelationCall;
				expect(rel.type).toBe("many");
				expect(rel.table).toBe(eventAttachmentsTable);
			});

			it("should define venueBookingsWhereEvent as one-to-many", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = eventsTableRelations.config({ one, many });
				const rel =
					relationsResult.venueBookingsWhereEvent as unknown as RelationCall;
				expect(rel.type).toBe("many");
				expect(rel.table).toBe(venueBookingsTable);
			});
		});
	});

	describe("eventsTableInsertSchema", () => {
		it("should validate a valid event object", () => {
			const validEvent = {
				name: "Test Event",
				startAt: new Date(),
				endAt: new Date(),
				organizationId: "00000000-0000-0000-0000-000000000000",
				allDay: false,
				isInviteOnly: false,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: false,
			};
			// We only check if it parses without throwing, or check success
			const result = eventsTableInsertSchema.safeParse(validEvent);
			expect(result.success).toBe(true);
		});

		it("should fail on missing required fields", () => {
			const invalidEvent = {
				name: "Test Event",
				// Missing startAt, endAt, organizationId
			};
			const result = eventsTableInsertSchema.safeParse(invalidEvent);
			expect(result.success).toBe(false);
		});

		it("should validate string lengths", () => {
			const longName = "a".repeat(300); // Max is 256
			const invalidEvent = {
				name: longName,
				startAt: new Date(),
				endAt: new Date(),
				organizationId: "00000000-0000-0000-0000-000000000000",
			};
			const result = eventsTableInsertSchema.safeParse(invalidEvent);
			expect(result.success).toBe(false);
		});
	});
});
