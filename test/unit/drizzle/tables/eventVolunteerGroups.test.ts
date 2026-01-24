import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it } from "vitest";

import { eventsTable } from "~/src/drizzle/tables/events";
import {
	eventVolunteerGroupsTable,
	eventVolunteerGroupsTableInsertSchema,
	eventVolunteerGroupsTableRelations,
} from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";

describe("src/drizzle/tables/eventVolunteerGroups.ts", () => {
	describe("eventVolunteerGroupsTable schema", () => {
		it("should have the correct table name", () => {
			expect(getTableName(eventVolunteerGroupsTable)).toBe(
				"event_volunteer_groups",
			);
		});

		describe("columns", () => {
			it("should define all expected columns", () => {
				const columns = Object.keys(getTableColumns(eventVolunteerGroupsTable));

				expect(columns).toEqual(
					expect.arrayContaining([
						"id",
						"eventId",
						"isTemplate",
						"recurringEventInstanceId",
						"leaderId",
						"creatorId",
						"name",
						"description",
						"volunteersRequired",
						"createdAt",
						"updatedAt",
						"updaterId",
					]),
				);
			});

			it("should mark required columns as not null", () => {
				expect(eventVolunteerGroupsTable.id.notNull).toBe(true);
				expect(eventVolunteerGroupsTable.eventId.notNull).toBe(true);
				expect(eventVolunteerGroupsTable.isTemplate.notNull).toBe(true);
				expect(eventVolunteerGroupsTable.leaderId.notNull).toBe(true);
				expect(eventVolunteerGroupsTable.name.notNull).toBe(true);
				expect(eventVolunteerGroupsTable.createdAt.notNull).toBe(true);
			});

			it("should configure default values correctly", () => {
				expect(eventVolunteerGroupsTable.id.hasDefault).toBe(true);
				expect(eventVolunteerGroupsTable.isTemplate.hasDefault).toBe(true);
				expect(eventVolunteerGroupsTable.createdAt.hasDefault).toBe(true);
				expect(eventVolunteerGroupsTable.updatedAt.hasDefault).toBe(true);
			});
		});

		describe("foreign keys", () => {
			it("should define five foreign keys", () => {
				const tableConfig = getTableConfig(eventVolunteerGroupsTable);
				expect(tableConfig.foreignKeys).toHaveLength(5);
			});

			it("should reference eventsTable from eventId", () => {
				const fk = getTableConfig(eventVolunteerGroupsTable).foreignKeys.find(
					(fk) => fk.reference().columns.some((c) => c.name === "event_id"),
				);

				expect(fk?.reference().foreignTable).toBe(eventsTable);
				expect(fk?.onDelete).toBe("cascade");
			});

			it("should reference recurringEventInstancesTable from recurringEventInstanceId", () => {
				const fk = getTableConfig(eventVolunteerGroupsTable).foreignKeys.find(
					(fk) =>
						fk
							.reference()
							.columns.some((c) => c.name === "recurring_event_instance_id"),
				);

				expect(fk?.reference().foreignTable).toBe(recurringEventInstancesTable);
				expect(fk?.onDelete).toBe("cascade");
			});

			it("should reference usersTable from leaderId", () => {
				const fk = getTableConfig(eventVolunteerGroupsTable).foreignKeys.find(
					(fk) => fk.reference().columns.some((c) => c.name === "leader_id"),
				);

				expect(fk?.reference().foreignTable).toBe(usersTable);
				expect(fk?.onDelete).toBe("cascade");
			});

			it("should reference usersTable from creatorId", () => {
				const fk = getTableConfig(eventVolunteerGroupsTable).foreignKeys.find(
					(fk) => fk.reference().columns.some((c) => c.name === "creator_id"),
				);

				expect(fk?.reference().foreignTable).toBe(usersTable);
				expect(fk?.onDelete).toBe("set null");
			});

			it("should reference usersTable from updaterId", () => {
				const fk = getTableConfig(eventVolunteerGroupsTable).foreignKeys.find(
					(fk) => fk.reference().columns.some((c) => c.name === "updater_id"),
				);

				expect(fk?.reference().foreignTable).toBe(usersTable);
				expect(fk?.onDelete).toBe("set null");
			});
		});

		describe("indexes", () => {
			it("should define expected indexes and unique constraint", () => {
				const tableConfig = getTableConfig(eventVolunteerGroupsTable);

				// 1 unique + 5 non-unique
				expect(tableConfig.indexes).toHaveLength(6);

				const uniqueIndex = tableConfig.indexes.find(
					(idx) => idx.config.unique === true,
				);

				expect(uniqueIndex).toBeDefined();
			});
		});
	});

	describe("eventVolunteerGroupsTableRelations", () => {
		it("should be defined", () => {
			expect(eventVolunteerGroupsTableRelations).toBeDefined();
		});

		it("should be associated with eventVolunteerGroupsTable", () => {
			expect(eventVolunteerGroupsTableRelations.table).toBe(
				eventVolunteerGroupsTable,
			);
		});

		describe("relation definitions", () => {
			let relationsResult: ReturnType<
				typeof eventVolunteerGroupsTableRelations.config
			>;

			const createMockBuilders = () => {
				const one = ((table: unknown, config: unknown) => {
					const result = {
						table,
						config,
						withFieldName: () => result,
					};
					return result;
				}) as unknown as Parameters<
					typeof eventVolunteerGroupsTableRelations.config
				>[0]["one"];

				const many = ((table: unknown, config: unknown) => {
					const result = {
						table,
						config,
						withFieldName: () => result,
					};
					return result;
				}) as unknown as Parameters<
					typeof eventVolunteerGroupsTableRelations.config
				>[0]["many"];

				return { one, many };
			};

			beforeEach(() => {
				const builders = createMockBuilders();
				relationsResult = eventVolunteerGroupsTableRelations.config({
					one: builders.one,
					many: builders.many,
				});
			});

			it("should define expected relations with correct targets", () => {
				expect(
					(relationsResult.event as unknown as { table: unknown }).table,
				).toBe(eventsTable);

				expect(
					(
						relationsResult.recurringEventInstance as unknown as {
							table: unknown;
						}
					).table,
				).toBe(recurringEventInstancesTable);

				expect(
					(relationsResult.leader as unknown as { table: unknown }).table,
				).toBe(usersTable);

				expect(
					(relationsResult.creator as unknown as { table: unknown }).table,
				).toBe(usersTable);

				expect(
					(relationsResult.updater as unknown as { table: unknown }).table,
				).toBe(usersTable);

				expect(
					(
						relationsResult.volunteerMemberships as unknown as {
							table: unknown;
						}
					).table,
				).toBe(eventVolunteerMembershipsTable);
			});
		});
	});

	describe("eventVolunteerGroupsTableInsertSchema", () => {
		it("should be a valid Zod schema", () => {
			expect(typeof eventVolunteerGroupsTableInsertSchema.safeParse).toBe(
				"function",
			);

			expect(typeof eventVolunteerGroupsTableInsertSchema.parse).toBe(
				"function",
			);
		});

		it("should accept a minimal valid payload", () => {
			const result = eventVolunteerGroupsTableInsertSchema.safeParse({
				eventId: crypto.randomUUID(),
				leaderId: crypto.randomUUID(),
				name: "Logistics Team",
			});

			expect(result.success).toBe(true);
		});

		it("should reject missing required fields", () => {
			const result = eventVolunteerGroupsTableInsertSchema.safeParse({
				name: "Invalid",
			});

			expect(result.success).toBe(false);
		});

		it("should allow nullable and optional fields", () => {
			const result = eventVolunteerGroupsTableInsertSchema.safeParse({
				eventId: crypto.randomUUID(),
				leaderId: crypto.randomUUID(),
				name: "Support",
				description: "Helps attendees",
				volunteersRequired: 5,
				recurringEventInstanceId: null,
				creatorId: null,
				updaterId: null,
			});

			expect(result.success).toBe(true);
		});
	});
});
