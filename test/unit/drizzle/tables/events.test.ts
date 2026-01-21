import { getTableName } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it } from "vitest";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import {
	EVENT_DESCRIPTION_MAX_LENGTH,
	EVENT_LOCATION_MAX_LENGTH,
	EVENT_NAME_MAX_LENGTH,
	eventsTable,
	eventsTableInsertSchema,
	eventsTableRelations,
} from "~/src/drizzle/tables/events";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { venueBookingsTable } from "~/src/drizzle/tables/venueBookings";

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
				expect(columns).toContain("createdAt");
				expect(columns).toContain("creatorId");
				expect(columns).toContain("description");
				expect(columns).toContain("endAt");
				expect(columns).toContain("id");
				expect(columns).toContain("name");
				expect(columns).toContain("organizationId");
				expect(columns).toContain("startAt");
				expect(columns).toContain("allDay");
				expect(columns).toContain("isInviteOnly");
				expect(columns).toContain("isPublic");
				expect(columns).toContain("isRegisterable");
				expect(columns).toContain("location");
				expect(columns).toContain("updatedAt");
				expect(columns).toContain("updaterId");
				expect(columns).toContain("isRecurringEventTemplate");
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

			describe("creatorId column", () => {
				it("should be a uuid column", () => {
					expect(eventsTable.creatorId.dataType).toBe("string");
					expect(eventsTable.creatorId.columnType).toBe("PgUUID");
				});

				it("should be nullable", () => {
					expect(eventsTable.creatorId.notNull).toBe(false);
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

			describe("organizationId column", () => {
				it("should be a uuid column", () => {
					expect(eventsTable.organizationId.dataType).toBe("string");
					expect(eventsTable.organizationId.columnType).toBe("PgUUID");
				});

				it("should be not null", () => {
					expect(eventsTable.organizationId.notNull).toBe(true);
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

			describe("allDay column", () => {
				it("should be a boolean column", () => {
					expect(eventsTable.allDay.dataType).toBe("boolean");
					expect(eventsTable.allDay.columnType).toBe("PgBoolean");
				});

				it("should be not null", () => {
					expect(eventsTable.allDay.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventsTable.allDay.hasDefault).toBe(true);
				});
			});

			describe("isInviteOnly column", () => {
				it("should be a boolean column", () => {
					expect(eventsTable.isInviteOnly.dataType).toBe("boolean");
					expect(eventsTable.isInviteOnly.columnType).toBe("PgBoolean");
				});

				it("should be not null", () => {
					expect(eventsTable.isInviteOnly.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventsTable.isInviteOnly.hasDefault).toBe(true);
				});
			});

			describe("isPublic column", () => {
				it("should be a boolean column", () => {
					expect(eventsTable.isPublic.dataType).toBe("boolean");
					expect(eventsTable.isPublic.columnType).toBe("PgBoolean");
				});

				it("should be not null", () => {
					expect(eventsTable.isPublic.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventsTable.isPublic.hasDefault).toBe(true);
				});
			});

			describe("isRegisterable column", () => {
				it("should be a boolean column", () => {
					expect(eventsTable.isRegisterable.dataType).toBe("boolean");
					expect(eventsTable.isRegisterable.columnType).toBe("PgBoolean");
				});

				it("should be not null", () => {
					expect(eventsTable.isRegisterable.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventsTable.isRegisterable.hasDefault).toBe(true);
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

			describe("updatedAt column", () => {
				it("should be a timestamp column", () => {
					expect(eventsTable.updatedAt.dataType).toBe("date");
					expect(eventsTable.updatedAt.columnType).toBe("PgTimestamp");
				});

				it("should be nullable (conceptually, though handled by Drizzle default)", () => {
					// Drizzle default handling might make it appear as notNull false or true depending on setup
					// Based on `timestamp(...).$defaultFn(...)`, usually it's nullable in DB unless `.notNull()` is called
					// but here it is defined without .notNull(), so it should be nullable
					expect(eventsTable.updatedAt.notNull).toBe(false);
				});

				it("should have a default value", () => {
					expect(eventsTable.updatedAt.hasDefault).toBe(true);
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

			describe("isRecurringEventTemplate column", () => {
				it("should be a boolean column", () => {
					expect(eventsTable.isRecurringEventTemplate.dataType).toBe("boolean");
					expect(eventsTable.isRecurringEventTemplate.columnType).toBe(
						"PgBoolean",
					);
				});

				it("should be not null", () => {
					expect(eventsTable.isRecurringEventTemplate.notNull).toBe(true);
				});

				it("should have a default value", () => {
					expect(eventsTable.isRecurringEventTemplate.hasDefault).toBe(true);
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
		});

		describe("indexes", () => {
			it("should have appropriate indexes defined", () => {
				const tableConfig = getTableConfig(eventsTable);
				const indexNames = tableConfig.indexes.map((idx) => idx.config.name);
				expect(indexNames).toContain("events_created_at_idx");
				expect(indexNames).toContain("events_creator_id_idx");
				expect(indexNames).toContain("events_end_at_idx");
				expect(indexNames).toContain("events_name_idx");
				expect(indexNames).toContain("events_organization_id_idx");
				expect(indexNames).toContain("events_start_at_idx");
				expect(indexNames).toContain("events_all_day_idx");
				expect(indexNames).toContain("events_is_invite_only_idx");
				expect(indexNames).toContain("events_is_public_idx");
				expect(indexNames).toContain("events_is_registerable_idx");
				expect(indexNames).toContain("events_is_recurring_template_idx");
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
				config: {
					fields: PgColumn[];
					references: PgColumn[];
					relationName?: string;
				};
				withFieldName: (fieldName: string) => RelationCall;
			};

			let one: Parameters<typeof eventsTableRelations.config>[0]["one"];
			let many: Parameters<typeof eventsTableRelations.config>[0]["many"];
			let relationsResult: ReturnType<typeof eventsTableRelations.config>;

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
						typeof eventsTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof eventsTableRelations.config
					>[0]["many"],
				};
			};

			beforeEach(() => {
				const builders = createMockBuilders();
				one = builders.one;
				many = builders.many;
				relationsResult = eventsTableRelations.config({
					one,
					many,
				});
			});

			it("should define correct one-to-many relationships", () => {
				expect(relationsResult.agendaFoldersWhereEvent).toBeDefined();
				const agendaRel =
					relationsResult.agendaFoldersWhereEvent as unknown as RelationCall;
				expect(agendaRel.type).toBe("many");
				expect(agendaRel.table).toBe(agendaFoldersTable);
				expect(agendaRel.config.relationName).toBe(
					"agenda_folders.event_id:events.id",
				);

				expect(relationsResult.attachmentsWhereEvent).toBeDefined();
				const attachRel =
					relationsResult.attachmentsWhereEvent as unknown as RelationCall;
				expect(attachRel.type).toBe("many");
				expect(attachRel.table).toBe(eventAttachmentsTable);
				expect(attachRel.config.relationName).toBe(
					"event_attachments.event_id:events.id",
				);

				expect(relationsResult.venueBookingsWhereEvent).toBeDefined();
				const venueRel =
					relationsResult.venueBookingsWhereEvent as unknown as RelationCall;
				expect(venueRel.type).toBe("many");
				expect(venueRel.table).toBe(venueBookingsTable);
				expect(venueRel.config.relationName).toBe(
					"events.id:venue_bookings.event_id",
				);
			});

			it("should define correct many-to-one relationships", () => {
				expect(relationsResult.creator).toBeDefined();
				const creatorRel = relationsResult.creator as unknown as RelationCall;
				expect(creatorRel.type).toBe("one");
				expect(creatorRel.table).toBe(usersTable);
				expect(creatorRel.config.fields).toEqual([eventsTable.creatorId]);
				expect(creatorRel.config.references).toEqual([usersTable.id]);
				expect(creatorRel.config.relationName).toBe(
					"events.creator_id:users.id",
				);

				expect(relationsResult.organization).toBeDefined();
				const orgRel = relationsResult.organization as unknown as RelationCall;
				expect(orgRel.type).toBe("one");
				expect(orgRel.table).toBe(organizationsTable);
				expect(orgRel.config.fields).toEqual([eventsTable.organizationId]);
				expect(orgRel.config.references).toEqual([organizationsTable.id]);
				expect(orgRel.config.relationName).toBe(
					"events.organization_id:organizations.id",
				);

				expect(relationsResult.updater).toBeDefined();
				const updaterRel = relationsResult.updater as unknown as RelationCall;
				expect(updaterRel.type).toBe("one");
				expect(updaterRel.table).toBe(usersTable);
				expect(updaterRel.config.fields).toEqual([eventsTable.updaterId]);
				expect(updaterRel.config.references).toEqual([usersTable.id]);
				expect(updaterRel.config.relationName).toBe(
					"events.updater_id:users.id",
				);
			});
		});
	});

	describe("eventsTableInsertSchema", () => {
		it("should validate a correct event object", () => {
			const validEvent = {
				name: "Test Event",
				organizationId: "123e4567-e89b-12d3-a456-426614174000",
				startAt: new Date(),
				endAt: new Date(),
				description: "A description",
				location: "A location",
			};
			const result = eventsTableInsertSchema.safeParse(validEvent);
			expect(result.success).toBe(true);
		});

		it("should fail on missing required fields", () => {
			const invalidEvent = {
				description: "Missing name and orgId",
			};
			const result = eventsTableInsertSchema.safeParse(invalidEvent);
			expect(result.success).toBe(false);
		});

		it("should enforce max length on description", () => {
			const longDescription = "a".repeat(EVENT_DESCRIPTION_MAX_LENGTH + 1);
			const result = eventsTableInsertSchema.safeParse({
				name: "Test",
				organizationId: "uuid",
				startAt: new Date(),
				endAt: new Date(),
				description: longDescription,
			});
			expect(result.success).toBe(false);
		});

		it("should enforce max length on name", () => {
			const longName = "a".repeat(EVENT_NAME_MAX_LENGTH + 1);
			const result = eventsTableInsertSchema.safeParse({
				name: longName,
				organizationId: "uuid",
				startAt: new Date(),
				endAt: new Date(),
			});
			expect(result.success).toBe(false);
		});

		it("should enforce max length on location", () => {
			const longLocation = "a".repeat(EVENT_LOCATION_MAX_LENGTH + 1);
			const result = eventsTableInsertSchema.safeParse({
				name: "Test",
				organizationId: "uuid",
				startAt: new Date(),
				endAt: new Date(),
				location: longLocation,
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty name", () => {
			const result = eventsTableInsertSchema.safeParse({
				name: "",
				organizationId: "uuid",
				startAt: new Date(),
				endAt: new Date(),
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty description when provided", () => {
			const result = eventsTableInsertSchema.safeParse({
				name: "Test",
				organizationId: "uuid",
				startAt: new Date(),
				endAt: new Date(),
				description: "",
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty location when provided", () => {
			const result = eventsTableInsertSchema.safeParse({
				name: "Test",
				organizationId: "uuid",
				startAt: new Date(),
				endAt: new Date(),
				location: "",
			});
			expect(result.success).toBe(false);
		});
	});
});
