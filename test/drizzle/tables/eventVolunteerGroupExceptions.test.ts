import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	eventVolunteerGroupExceptionsTable,
	eventVolunteerGroupExceptionsTableInsertSchema,
	eventVolunteerGroupExceptionsTableRelations,
} from "~/src/drizzle/tables/eventVolunteerGroupExceptions";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";

interface CapturedRelation {
	table: Table;
	type: "one" | "many";
	config: {
		relationName: string;
		fields?: unknown[];
		references?: unknown[];
	};
}

// Type for the mock relation helpers
interface MockRelationHelpers {
	one: (
		table: Table,
		config?: CapturedRelation["config"],
	) => {
		withFieldName: () => object;
	};
	many: (
		table: Table,
		config?: CapturedRelation["config"],
	) => {
		withFieldName: () => object;
	};
}

let capturedRelations: Record<string, CapturedRelation> = {};

describe("eventVolunteerGroupExceptionsTable", () => {
	describe("eventVolunteerGroupExceptionsTableInsertSchema", () => {
		const validData = {
			volunteerGroupId: "550e8400-e29b-41d4-a716-446655440000",
			recurringEventInstanceId: "550e8400-e29b-41d4-a716-446655440001",
		};
		it("should validate correct data", () => {
			const result =
				eventVolunteerGroupExceptionsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
		it("should invalidate missing volunteerGroupId", () => {
			const result = eventVolunteerGroupExceptionsTableInsertSchema.safeParse({
				recurringEventInstanceId: "550e8400-e29b-41d4-a716-446655440001",
			});
			expect(result.success).toBe(false);
		});
		it("should invalidate missing recurringEventInstanceId", () => {
			const result = eventVolunteerGroupExceptionsTableInsertSchema.safeParse({
				volunteerGroupId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});
		it("should accept optional createdBy and updatedBy", () => {
			const result = eventVolunteerGroupExceptionsTableInsertSchema.safeParse({
				...validData,
				createdBy: "550e8400-e29b-41d4-a716-446655440002",
				updatedBy: "550e8400-e29b-41d4-a716-446655440003",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("eventVolunteerGroupExceptionsTable structure", () => {
		it("should have a volunteerGroupId field", () => {
			expect(eventVolunteerGroupExceptionsTable).toHaveProperty(
				"volunteerGroupId",
			);
		});
		it("should have a recurringEventInstanceId field", () => {
			expect(eventVolunteerGroupExceptionsTable).toHaveProperty(
				"recurringEventInstanceId",
			);
		});
		it("should have a createdAt field", () => {
			expect(eventVolunteerGroupExceptionsTable).toHaveProperty("createdAt");
		});
		it("should have a createdBy field", () => {
			expect(eventVolunteerGroupExceptionsTable).toHaveProperty("createdBy");
		});
		it("should have an id field", () => {
			expect(eventVolunteerGroupExceptionsTable).toHaveProperty("id");
		});
		it("should have an updatedAt field", () => {
			expect(eventVolunteerGroupExceptionsTable).toHaveProperty("updatedAt");
		});
		it("should have an updatedBy field", () => {
			expect(eventVolunteerGroupExceptionsTable).toHaveProperty("updatedBy");
		});
	});

	describe("eventVolunteerGroupExceptionsTable Relations", () => {
		beforeAll(() => {
			capturedRelations = {};

			(
				eventVolunteerGroupExceptionsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (!config) {
						return { withFieldName: () => ({}) };
					}

					const name = config.relationName;

					if (
						name?.includes(
							"volunteer_groups.id:event_volunteer_group_exceptions.volunteer_group_id",
						)
					) {
						capturedRelations.volunteerGroup = { table, config, type: "one" };
					}
					if (
						name?.includes(
							"recurring_event_instances.id:event_volunteer_group_exceptions.recurring_event_instance_id",
						)
					) {
						capturedRelations.recurringEventInstance = {
							table,
							config,
							type: "one",
						};
					}
					if (
						name?.includes(
							"event_volunteer_group_exceptions.created_by:users.id",
						)
					) {
						capturedRelations.createdByUser = { table, config, type: "one" };
					}
					if (
						name?.includes(
							"event_volunteer_group_exceptions.updated_by:users.id",
						)
					) {
						capturedRelations.updatedByUser = { table, config, type: "one" };
					}

					return { withFieldName: () => ({}) };
				},

				many: () => ({ withFieldName: () => ({}) }),
			});
		});

		describe("volunteerGroup relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.volunteerGroup).toBeDefined();
			});
			it("should reference eventVolunteerGroupsTable", () => {
				const table = capturedRelations?.volunteerGroup?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("event_volunteer_groups");
				}
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.volunteerGroup?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.volunteerGroup?.config.fields;
				const references = capturedRelations?.volunteerGroup?.config.references;
				expect(fields).toEqual([
					eventVolunteerGroupExceptionsTable.volunteerGroupId,
				]);
				expect(references).toEqual([eventVolunteerGroupsTable.id]);
			});
		});

		describe("recurringEventInstance relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.recurringEventInstance).toBeDefined();
			});
			it("should reference recurringEventInstancesTable", () => {
				const table = capturedRelations?.recurringEventInstance?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("recurring_event_instances");
				}
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.recurringEventInstance?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.recurringEventInstance?.config.fields;
				const references =
					capturedRelations?.recurringEventInstance?.config.references;
				expect(fields).toEqual([
					eventVolunteerGroupExceptionsTable.recurringEventInstanceId,
				]);
				expect(references).toEqual([recurringEventInstancesTable.id]);
			});
		});

		describe("createdByUser relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.createdByUser).toBeDefined();
			});
			it("should reference usersTable", () => {
				const table = capturedRelations?.createdByUser?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("users");
				}
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.createdByUser?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.createdByUser?.config.fields;
				const references = capturedRelations?.createdByUser?.config.references;
				expect(fields).toEqual([eventVolunteerGroupExceptionsTable.createdBy]);
				expect(references).toEqual([usersTable.id]);
			});
		});

		describe("updatedByUser relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.updatedByUser).toBeDefined();
			});
			it("should reference usersTable", () => {
				const table = capturedRelations?.updatedByUser?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("users");
				}
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.updatedByUser?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.updatedByUser?.config.fields;
				const references = capturedRelations?.updatedByUser?.config.references;
				expect(fields).toEqual([eventVolunteerGroupExceptionsTable.updatedBy]);
				expect(references).toEqual([usersTable.id]);
			});
		});
	});

	describe("eventVolunteerGroupExceptionsTable additional tests", () => {
		const tableConfig = getTableConfig(eventVolunteerGroupExceptionsTable);

		it("should enforce notNull constraints on volunteerGroupId and recurringEventInstanceId", () => {
			const volunteerGroupIdColumn = tableConfig.columns.find(
				(col) => col.name === "volunteer_group_id",
			);
			const recurringEventInstanceIdColumn = tableConfig.columns.find(
				(col) => col.name === "recurring_event_instance_id",
			);

			expect(volunteerGroupIdColumn?.notNull).toBe(true);
			expect(recurringEventInstanceIdColumn?.notNull).toBe(true);
		});

		it("should have id as primary key", () => {
			const idColumn = tableConfig.columns.find((col) => col.name === "id");
			expect(idColumn?.primary).toBe(true);
		});

		it("should have default for createdAt and updatedAt", () => {
			const createdAtColumn = tableConfig.columns.find(
				(col) => col.name === "created_at",
			);
			const updatedAtColumn = tableConfig.columns.find(
				(col) => col.name === "updated_at",
			);

			expect(createdAtColumn?.hasDefault).toBe(true);
			expect(updatedAtColumn?.hasDefault).toBe(true);
		});

		it("should have a unique constraint on volunteerGroupId and recurringEventInstanceId", () => {
			const uniqueConstraints = tableConfig.uniqueConstraints;
			const hasUnique = uniqueConstraints.some((constraint) => {
				const columns = constraint.columns.map((col) => col.name);
				return (
					columns.includes("volunteer_group_id") &&
					columns.includes("recurring_event_instance_id") &&
					columns.length === 2
				);
			});
			expect(hasUnique).toBe(true);
		});
	});

	describe("eventVolunteerGroupExceptionsTableInsertSchema boundary tests", () => {
		it("should invalidate an invalid UUID for volunteerGroupId", () => {
			const result = eventVolunteerGroupExceptionsTableInsertSchema.safeParse({
				volunteerGroupId: "invalid-uuid",
				recurringEventInstanceId: "550e8400-e29b-41d4-a716-446655440001",
			});
			expect(result.success).toBe(false);
		});

		it("should invalidate an invalid UUID for recurringEventInstanceId", () => {
			const result = eventVolunteerGroupExceptionsTableInsertSchema.safeParse({
				volunteerGroupId: "550e8400-e29b-41d4-a716-446655440000",
				recurringEventInstanceId: "invalid-uuid",
			});
			expect(result.success).toBe(false);
		});
	});
});
