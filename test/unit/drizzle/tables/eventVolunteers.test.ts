import { faker } from "@faker-js/faker";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import {
	eventVolunteersTable,
	eventVolunteersTableInsertSchema,
	eventVolunteersTableRelations,
} from "~/src/drizzle/tables/eventVolunteers";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";

describe("src/drizzle/tables/eventVolunteers.ts", () => {
	describe("eventVolunteersTable schema", () => {
		it("should be defined as a pgTable", () => {
			expect(eventVolunteersTable).toBeDefined();
			// Verify it's a drizzle table by checking for table-specific properties
			expect(eventVolunteersTable.id).toBeDefined();
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(eventVolunteersTable);
			expect(columns).toContain("id");
			expect(columns).toContain("userId");
			expect(columns).toContain("eventId");
			expect(columns).toContain("isTemplate");
			expect(columns).toContain("recurringEventInstanceId");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("hasAccepted");
			expect(columns).toContain("isPublic");
			expect(columns).toContain("hoursVolunteered");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have id as primary key", () => {
			expect(eventVolunteersTable.id.primary).toBe(true);
		});

		it("should have correct column configurations", () => {
			// Verify columns exist and have expected properties
			expect(eventVolunteersTable.id).toBeDefined();
			expect(eventVolunteersTable.userId).toBeDefined();
			expect(eventVolunteersTable.eventId).toBeDefined();
			expect(eventVolunteersTable.isTemplate).toBeDefined();
			expect(eventVolunteersTable.recurringEventInstanceId).toBeDefined();
			expect(eventVolunteersTable.creatorId).toBeDefined();
			expect(eventVolunteersTable.hasAccepted).toBeDefined();
			expect(eventVolunteersTable.isPublic).toBeDefined();
			expect(eventVolunteersTable.hoursVolunteered).toBeDefined();
			expect(eventVolunteersTable.createdAt).toBeDefined();
			expect(eventVolunteersTable.updatedAt).toBeDefined();
			expect(eventVolunteersTable.updaterId).toBeDefined();
		});

		it("should have correct not null constraints", () => {
			expect(eventVolunteersTable.id.notNull).toBe(true);
			expect(eventVolunteersTable.userId.notNull).toBe(true);
			expect(eventVolunteersTable.eventId.notNull).toBe(true);
			expect(eventVolunteersTable.isTemplate.notNull).toBe(true);
			expect(eventVolunteersTable.hasAccepted.notNull).toBe(true);
			expect(eventVolunteersTable.isPublic.notNull).toBe(true);
			expect(eventVolunteersTable.hoursVolunteered.notNull).toBe(true);
			expect(eventVolunteersTable.createdAt.notNull).toBe(true);
			// Optional fields
			expect(eventVolunteersTable.recurringEventInstanceId.notNull).toBe(false);
			expect(eventVolunteersTable.creatorId.notNull).toBe(false);
			expect(eventVolunteersTable.updatedAt.notNull).toBe(false);
			expect(eventVolunteersTable.updaterId.notNull).toBe(false);
		});

		it("should have default value for isTemplate", () => {
			expect(eventVolunteersTable.isTemplate.hasDefault).toBe(true);
		});

		it("should have default value for hasAccepted", () => {
			expect(eventVolunteersTable.hasAccepted.hasDefault).toBe(true);
		});

		it("should have default value for isPublic", () => {
			expect(eventVolunteersTable.isPublic.hasDefault).toBe(true);
		});

		it("should have default value for hoursVolunteered", () => {
			expect(eventVolunteersTable.hoursVolunteered.hasDefault).toBe(true);
		});

		it("should have default value for createdAt", () => {
			expect(eventVolunteersTable.createdAt.hasDefault).toBe(true);
		});

		it("should have five foreign keys defined", () => {
			const { foreignKeys } = getTableConfig(eventVolunteersTable);
			expect(foreignKeys).toHaveLength(5);
		});

		it("should have userId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(eventVolunteersTable);
			const userFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "user_id");
			});

			expect(userFk).toBeDefined();
			const ref = userFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("user_id");
			expect(userFk?.onDelete).toBe("cascade");
			expect(userFk?.onUpdate).toBe("cascade");
		});

		it("should have eventId referencing eventsTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(eventVolunteersTable);
			const eventFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "event_id");
			});

			expect(eventFk).toBeDefined();
			const ref = eventFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(eventsTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("event_id");
			expect(eventFk?.onDelete).toBe("cascade");
			expect(eventFk?.onUpdate).toBe("cascade");
		});

		it("should have recurringEventInstanceId referencing recurringEventInstancesTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(eventVolunteersTable);
			const instanceFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some(
					(col) => col.name === "recurring_event_instance_id",
				);
			});

			expect(instanceFk).toBeDefined();
			const ref = instanceFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(recurringEventInstancesTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("recurring_event_instance_id");
			expect(instanceFk?.onDelete).toBe("cascade");
			expect(instanceFk?.onUpdate).toBe("cascade");
		});

		it("should have creatorId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(eventVolunteersTable);
			const creatorFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "creator_id");
			});

			expect(creatorFk).toBeDefined();
			const ref = creatorFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("creator_id");
			expect(creatorFk?.onDelete).toBe("set null");
			expect(creatorFk?.onUpdate).toBe("cascade");
		});

		it("should have updaterId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(eventVolunteersTable);
			const updaterFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "updater_id");
			});

			expect(updaterFk).toBeDefined();
			const ref = updaterFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("updater_id");
			expect(updaterFk?.onDelete).toBe("set null");
			expect(updaterFk?.onUpdate).toBe("cascade");
		});

		it("should have all required indexes defined", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);

			// Verify indexes are defined
			expect(tableConfig.indexes).toBeDefined();
			expect(tableConfig.indexes.length).toBeGreaterThan(0);

			// Verify we have the expected number of indexes (5 regular + 2 unique)
			expect(tableConfig.indexes.length).toBe(7);
		});

		it("should enforce unique instance-specific volunteer using userId, eventId and recurringEventInstanceId", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);
			const uniqueIndex = tableConfig.indexes.find((idx) => idx.config.unique);

			expect(uniqueIndex).toBeDefined();
			expect(uniqueIndex?.config.unique).toBe(true);
			const uniqueColumns = uniqueIndex?.config.columns.map((col) =>
				"name" in col ? col.name : col,
			);
			expect(uniqueColumns).toEqual([
				"user_id",
				"event_id",
				"recurring_event_instance_id",
			]);
		});

		it("should have partial unique index on userId and eventId where isTemplate is true", () => {
			const { indexes } = getTableConfig(eventVolunteersTable);

			const uniqueIndex = indexes.find((idx) => {
				if (!idx.config.unique || !idx.config.where) return false;

				const columnNames = idx.config.columns.map((col) =>
					"name" in col ? col.name : col,
				);

				return (
					columnNames.length === 2 &&
					columnNames.includes("user_id") &&
					columnNames.includes("event_id")
				);
			});

			expect(uniqueIndex).toBeDefined();
		});

		it("should have index on createdAt", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);
			const createdAtIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) =>
						"name" in col && col.name === "created_at" && !idx.config.unique,
				),
			);
			expect(createdAtIndex).toBeDefined();
		});

		it("should have index on eventId", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);
			const eventIdIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) =>
						"name" in col && col.name === "event_id" && !idx.config.unique,
				),
			);
			expect(eventIdIndex).toBeDefined();
		});

		it("should have index on userId", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);
			const userIdIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) =>
						"name" in col && col.name === "user_id" && !idx.config.unique,
				),
			);
			expect(userIdIndex).toBeDefined();
		});

		it("should have index on hasAccepted", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);
			const hasAcceptedIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) =>
						"name" in col && col.name === "has_accepted" && !idx.config.unique,
				),
			);
			expect(hasAcceptedIndex).toBeDefined();
		});

		it("should have index on isTemplate", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);
			const isTemplateIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) =>
						"name" in col && col.name === "is_template" && !idx.config.unique,
				),
			);
			expect(isTemplateIndex).toBeDefined();
		});

		it("should have correct table name in config", () => {
			const tableConfig = getTableConfig(eventVolunteersTable);
			expect(tableConfig.name).toBe("event_volunteers");
		});
	});

	describe("eventVolunteersTableRelations", () => {
		it("should be defined", () => {
			expect(eventVolunteersTableRelations).toBeDefined();
		});

		it("should have correct relation configuration", () => {
			const config = eventVolunteersTableRelations.config;
			expect(config).toBeDefined();
			expect(typeof config).toBe("function");
		});

		it("should reference the correct table", () => {
			expect(eventVolunteersTableRelations.table).toBe(eventVolunteersTable);
		});

		it("should define all five relations", () => {
			// Create a mock that returns chainable objects like Drizzle expects
			const createMockRelation = () => ({
				withFieldName: vi.fn().mockReturnThis(),
			});

			const mockOne = vi.fn().mockImplementation(() => createMockRelation());
			const mockMany = vi.fn().mockImplementation(() => createMockRelation());

			// Invoke the config to exercise the relation definitions
			const result = eventVolunteersTableRelations.config({
				one: mockOne,
				many: mockMany,
			});

			// Verify all five relations are defined
			expect(result).toHaveProperty("user");
			expect(result).toHaveProperty("event");
			expect(result).toHaveProperty("recurringEventInstance");
			expect(result).toHaveProperty("creator");
			expect(result).toHaveProperty("updater");

			// Verify one() was called 5 times (once for each relation)
			expect(mockOne).toHaveBeenCalledTimes(5);

			// Verify relations reference the correct target tables
			const calls = mockOne.mock.calls;
			expect(calls[0]?.[0]).toBe(usersTable); // user -> usersTable
			expect(calls[1]?.[0]).toBe(eventsTable); // event -> eventsTable
			expect(calls[2]?.[0]).toBe(recurringEventInstancesTable); // recurringEventInstance -> recurringEventInstancesTable
			expect(calls[3]?.[0]).toBe(usersTable); // creator -> usersTable
			expect(calls[4]?.[0]).toBe(usersTable); // updater -> usersTable
		});
	});

	describe("eventVolunteersTableInsertSchema", () => {
		const validInput = {
			userId: faker.string.uuid(),
			eventId: faker.string.uuid(),
		};

		describe("required fields validation", () => {
			it("should accept valid input with only required fields", () => {
				const result = eventVolunteersTableInsertSchema.safeParse(validInput);
				expect(result.success).toBe(true);
			});

			it("should reject missing userId", () => {
				const { userId, ...input } = validInput;
				const result = eventVolunteersTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing eventId", () => {
				const { eventId, ...input } = validInput;
				const result = eventVolunteersTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject empty object", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});
		});

		describe("UUID validation", () => {
			it("should reject invalid userId UUID", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					userId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid eventId UUID", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					eventId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid recurringEventInstanceId UUID", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					recurringEventInstanceId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid creatorId UUID", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					creatorId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid updaterId UUID", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					updaterId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should accept valid UUIDs for all UUID fields", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					recurringEventInstanceId: faker.string.uuid(),
					creatorId: faker.string.uuid(),
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});
		});

		describe("boolean fields validation", () => {
			it("should accept true for isTemplate", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					isTemplate: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false for isTemplate", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					isTemplate: false,
				});
				expect(result.success).toBe(true);
			});

			it("should accept true for hasAccepted", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hasAccepted: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false for hasAccepted", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hasAccepted: false,
				});
				expect(result.success).toBe(true);
			});

			it("should accept true for isPublic", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					isPublic: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false for isPublic", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					isPublic: false,
				});
				expect(result.success).toBe(true);
			});

			it("should reject non-boolean for isTemplate", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					isTemplate: "true" as unknown as boolean,
				});
				expect(result.success).toBe(false);
			});

			it("should reject non-boolean for hasAccepted", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hasAccepted: 1 as unknown as boolean,
				});
				expect(result.success).toBe(false);
			});

			it("should reject non-boolean for isPublic", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					isPublic: "false" as unknown as boolean,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("hoursVolunteered validation", () => {
			it("should accept valid decimal string for hoursVolunteered", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hoursVolunteered: "10.50",
				});
				expect(result.success).toBe(true);
			});

			it("should accept zero hours", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hoursVolunteered: "0",
				});
				expect(result.success).toBe(true);
			});

			it("should accept integer hours", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hoursVolunteered: "100",
				});
				expect(result.success).toBe(true);
			});

			it("should accept hours with two decimal places", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hoursVolunteered: "25.75",
				});
				expect(result.success).toBe(true);
			});

			it("should accept large hour values within precision", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hoursVolunteered: "99999999.99",
				});
				expect(result.success).toBe(true);
			});

			it("should accept negative hours (schema allows it)", () => {
				// Note: The schema doesn't enforce non-negative constraint at the Zod level
				// Business logic validation should be handled at the application level
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					hoursVolunteered: "-10.50",
				});
				expect(result.success).toBe(true);
			});
		});

		describe("optional fields validation", () => {
			it("should accept input with recurringEventInstanceId", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					recurringEventInstanceId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with creatorId", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					creatorId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with updaterId", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with all optional fields", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					isTemplate: false,
					recurringEventInstanceId: faker.string.uuid(),
					creatorId: faker.string.uuid(),
					hasAccepted: true,
					isPublic: false,
					hoursVolunteered: "15.25",
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined for optional fields", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					recurringEventInstanceId: undefined,
					creatorId: undefined,
					updaterId: undefined,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("edge cases", () => {
			it("should reject null values for required fields", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					...validInput,
					userId: null,
				});
				expect(result.success).toBe(false);
			});

			it("should accept complete valid volunteer record", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					userId: faker.string.uuid(),
					eventId: faker.string.uuid(),
					isTemplate: true,
					recurringEventInstanceId: faker.string.uuid(),
					creatorId: faker.string.uuid(),
					hasAccepted: false,
					isPublic: true,
					hoursVolunteered: "8.50",
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept template volunteer without instance", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					userId: faker.string.uuid(),
					eventId: faker.string.uuid(),
					isTemplate: true,
					recurringEventInstanceId: undefined,
				});
				expect(result.success).toBe(true);
			});

			it("should accept instance volunteer with instance ID", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					userId: faker.string.uuid(),
					eventId: faker.string.uuid(),
					isTemplate: false,
					recurringEventInstanceId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should handle multiple validation errors", () => {
				const result = eventVolunteersTableInsertSchema.safeParse({
					userId: "invalid-uuid",
					eventId: "invalid-uuid",
					hoursVolunteered: "-5",
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues.length).toBeGreaterThan(1);
				}
			});
		});
	});
});
