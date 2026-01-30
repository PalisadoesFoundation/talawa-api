import { faker } from "@faker-js/faker";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import {
	actionItemExceptionsTable,
	actionItemExceptionsTableInsertSchema,
	actionItemExceptionsTableRelations,
} from "~/src/drizzle/tables/actionItemExceptions";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";

describe("src/drizzle/tables/actionItemExceptions.ts", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("actionItemExceptionsTable schema", () => {
		it("should be defined as a pgTable", () => {
			expect(actionItemExceptionsTable).toBeDefined();
			// Verify it's a drizzle table by checking for table-specific properties
			expect(actionItemExceptionsTable.id).toBeDefined();
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(actionItemExceptionsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("actionId");
			expect(columns).toContain("eventId");
			expect(columns).toContain("assigneeId");
			expect(columns).toContain("volunteerId");
			expect(columns).toContain("volunteerGroupId");
			expect(columns).toContain("categoryId");
			expect(columns).toContain("assignedAt");
			expect(columns).toContain("preCompletionNotes");
			expect(columns).toContain("postCompletionNotes");
			expect(columns).toContain("completed");
			expect(columns).toContain("deleted");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should have id as primary key", () => {
			expect(actionItemExceptionsTable.id.primary).toBe(true);
		});

		it("should have correct column configurations", () => {
			// Verify columns exist and have expected properties
			expect(actionItemExceptionsTable.id).toBeDefined();
			expect(actionItemExceptionsTable.actionId).toBeDefined();
			expect(actionItemExceptionsTable.eventId).toBeDefined();
			expect(actionItemExceptionsTable.assigneeId).toBeDefined();
			expect(actionItemExceptionsTable.volunteerId).toBeDefined();
			expect(actionItemExceptionsTable.volunteerGroupId).toBeDefined();
			expect(actionItemExceptionsTable.categoryId).toBeDefined();
			expect(actionItemExceptionsTable.assignedAt).toBeDefined();
			expect(actionItemExceptionsTable.preCompletionNotes).toBeDefined();
			expect(actionItemExceptionsTable.postCompletionNotes).toBeDefined();
			expect(actionItemExceptionsTable.completed).toBeDefined();
			expect(actionItemExceptionsTable.deleted).toBeDefined();
			expect(actionItemExceptionsTable.createdAt).toBeDefined();
			expect(actionItemExceptionsTable.updatedAt).toBeDefined();
		});

		it("should have correct not null constraints", () => {
			expect(actionItemExceptionsTable.id.notNull).toBe(true);
			expect(actionItemExceptionsTable.actionId.notNull).toBe(true);
			expect(actionItemExceptionsTable.eventId.notNull).toBe(true);
			expect(actionItemExceptionsTable.createdAt.notNull).toBe(true);
			expect(actionItemExceptionsTable.updatedAt.notNull).toBe(true);
			// Optional fields
			expect(actionItemExceptionsTable.assigneeId.notNull).toBe(false);
			expect(actionItemExceptionsTable.volunteerId.notNull).toBe(false);
			expect(actionItemExceptionsTable.volunteerGroupId.notNull).toBe(false);
			expect(actionItemExceptionsTable.categoryId.notNull).toBe(false);
			expect(actionItemExceptionsTable.assignedAt.notNull).toBe(false);
			expect(actionItemExceptionsTable.preCompletionNotes.notNull).toBe(false);
			expect(actionItemExceptionsTable.postCompletionNotes.notNull).toBe(false);
			expect(actionItemExceptionsTable.completed.notNull).toBe(false);
			expect(actionItemExceptionsTable.deleted.notNull).toBe(false);
		});

		it("should have default value for id", () => {
			expect(actionItemExceptionsTable.id.hasDefault).toBe(true);
		});

		it("should have default value for completed", () => {
			expect(actionItemExceptionsTable.completed.hasDefault).toBe(true);
		});

		it("should have default value for deleted", () => {
			expect(actionItemExceptionsTable.deleted.hasDefault).toBe(true);
		});

		it("should have default value for createdAt", () => {
			expect(actionItemExceptionsTable.createdAt.hasDefault).toBe(true);
		});

		it("should have default value for updatedAt", () => {
			expect(actionItemExceptionsTable.updatedAt.hasDefault).toBe(true);
		});

		it("should have six foreign keys defined", () => {
			const { foreignKeys } = getTableConfig(actionItemExceptionsTable);
			expect(foreignKeys).toHaveLength(6);
		});

		it("should have actionId referencing actionItemsTable.id", () => {
			const { foreignKeys } = getTableConfig(actionItemExceptionsTable);
			const actionFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "action_id");
			});

			expect(actionFk).toBeDefined();
			const ref = actionFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(actionItemsTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("action_id");
		});

		it("should have eventId referencing recurringEventInstancesTable.id", () => {
			const { foreignKeys } = getTableConfig(actionItemExceptionsTable);
			const eventFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "event_id");
			});

			expect(eventFk).toBeDefined();
			const ref = eventFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(recurringEventInstancesTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("event_id");
		});

		it("should have assigneeId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(actionItemExceptionsTable);
			const assigneeFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "assignee_id");
			});

			expect(assigneeFk).toBeDefined();
			const ref = assigneeFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("assignee_id");
			expect(assigneeFk?.onDelete).toBe("set null");
			expect(assigneeFk?.onUpdate).toBe("cascade");
		});

		it("should have volunteerId referencing eventVolunteersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(actionItemExceptionsTable);
			const volunteerFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "volunteer_id");
			});

			expect(volunteerFk).toBeDefined();
			const ref = volunteerFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(eventVolunteersTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("volunteer_id");
			expect(volunteerFk?.onDelete).toBe("set null");
			expect(volunteerFk?.onUpdate).toBe("cascade");
		});

		it("should have volunteerGroupId referencing eventVolunteerGroupsTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(actionItemExceptionsTable);
			const volunteerGroupFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "volunteer_group_id");
			});

			expect(volunteerGroupFk).toBeDefined();
			const ref = volunteerGroupFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(eventVolunteerGroupsTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("volunteer_group_id");
			expect(volunteerGroupFk?.onDelete).toBe("set null");
			expect(volunteerGroupFk?.onUpdate).toBe("cascade");
		});

		it("should have categoryId referencing actionItemCategoriesTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(actionItemExceptionsTable);
			const categoryFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "category_id");
			});

			expect(categoryFk).toBeDefined();
			const ref = categoryFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(actionItemCategoriesTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("category_id");
			expect(categoryFk?.onDelete).toBe("set null");
			expect(categoryFk?.onUpdate).toBe("cascade");
		});

		it("should have unique constraint on actionId and eventId", () => {
			const tableConfig = getTableConfig(actionItemExceptionsTable);
			expect(tableConfig.uniqueConstraints).toBeDefined();
			expect(tableConfig.uniqueConstraints.length).toBeGreaterThan(0);

			const uniqueConstraint = tableConfig.uniqueConstraints[0];
			expect(uniqueConstraint).toBeDefined();
			const constraintColumns = uniqueConstraint?.columns.map(
				(col) => col.name,
			);
			expect(constraintColumns).toEqual(["action_id", "event_id"]);
		});

		it("should have correct table name in config", () => {
			const tableConfig = getTableConfig(actionItemExceptionsTable);
			expect(tableConfig.name).toBe("actionitem_exceptions");
		});
	});

	describe("actionItemExceptionsTableRelations", () => {
		it("should be defined", () => {
			expect(actionItemExceptionsTableRelations).toBeDefined();
		});

		it("should have correct relation configuration", () => {
			const config = actionItemExceptionsTableRelations.config;
			expect(config).toBeDefined();
			expect(typeof config).toBe("function");
		});

		it("should reference the correct table", () => {
			expect(actionItemExceptionsTableRelations.table).toBe(
				actionItemExceptionsTable,
			);
		});

		it("should define all six relations", () => {
			// Create a mock that returns chainable objects like Drizzle expects
			const createMockRelation = () => ({
				withFieldName: vi.fn().mockReturnThis(),
			});

			const mockOne = vi.fn().mockImplementation(() => createMockRelation());
			const mockMany = vi.fn().mockImplementation(() => createMockRelation());

			// Invoke the config to exercise the relation definitions
			const result = actionItemExceptionsTableRelations.config({
				one: mockOne,
				many: mockMany,
			});

			// Verify all six relations are defined
			expect(result).toHaveProperty("action");
			expect(result).toHaveProperty("event");
			expect(result).toHaveProperty("assignee");
			expect(result).toHaveProperty("volunteer");
			expect(result).toHaveProperty("volunteerGroup");
			expect(result).toHaveProperty("category");

			// Verify one() was called 6 times (all relations are one-to-one)
			expect(mockOne).toHaveBeenCalledTimes(6);

			// Verify many() was not called
			expect(mockMany).not.toHaveBeenCalled();

			// Verify relations reference the correct target tables
			const oneCalls = mockOne.mock.calls;
			expect(oneCalls[0]?.[0]).toBe(actionItemsTable);
			expect(oneCalls[1]?.[0]).toBe(recurringEventInstancesTable);
			expect(oneCalls[2]?.[0]).toBe(usersTable);
			expect(oneCalls[3]?.[0]).toBe(eventVolunteersTable);
			expect(oneCalls[4]?.[0]).toBe(eventVolunteerGroupsTable);
			expect(oneCalls[5]?.[0]).toBe(actionItemCategoriesTable);
		});
	});

	describe("actionItemExceptionsTableInsertSchema", () => {
		const validInput = {
			actionId: faker.string.uuid(),
			eventId: faker.string.uuid(),
		};

		describe("required fields validation", () => {
			it("should accept valid input with only required fields", () => {
				const result =
					actionItemExceptionsTableInsertSchema.safeParse(validInput);
				expect(result.success).toBe(true);
			});

			it("should reject missing actionId", () => {
				const { actionId: _actionId, ...input } = validInput;
				const result = actionItemExceptionsTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing eventId", () => {
				const { eventId: _eventId, ...input } = validInput;
				const result = actionItemExceptionsTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject empty object", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});
		});

		describe("UUID validation", () => {
			it("should reject invalid actionId UUID", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					actionId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid eventId UUID", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					eventId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid assigneeId UUID", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assigneeId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid volunteerId UUID", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					volunteerId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid volunteerGroupId UUID", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					volunteerGroupId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid categoryId UUID", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					categoryId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should accept valid UUIDs for all UUID fields", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assigneeId: faker.string.uuid(),
					volunteerId: faker.string.uuid(),
					volunteerGroupId: faker.string.uuid(),
					categoryId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});
		});

		describe("optional fields validation", () => {
			it("should accept input with assigneeId", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assigneeId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with volunteerId", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					volunteerId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with volunteerGroupId", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					volunteerGroupId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with categoryId", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					categoryId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with assignedAt", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assignedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with preCompletionNotes", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					preCompletionNotes: faker.lorem.paragraph(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with postCompletionNotes", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					postCompletionNotes: faker.lorem.paragraph(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with completed flag", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					completed: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with deleted flag", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					deleted: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with all optional fields", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assigneeId: faker.string.uuid(),
					volunteerId: faker.string.uuid(),
					volunteerGroupId: faker.string.uuid(),
					categoryId: faker.string.uuid(),
					assignedAt: new Date(),
					preCompletionNotes: faker.lorem.paragraph(),
					postCompletionNotes: faker.lorem.paragraph(),
					completed: true,
					deleted: false,
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined for optional fields", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assigneeId: undefined,
					volunteerId: undefined,
					volunteerGroupId: undefined,
					categoryId: undefined,
					assignedAt: undefined,
					preCompletionNotes: undefined,
					postCompletionNotes: undefined,
					completed: undefined,
					deleted: undefined,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("boolean fields validation", () => {
			it("should accept true for completed", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					completed: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false for completed", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					completed: false,
				});
				expect(result.success).toBe(true);
			});

			it("should accept true for deleted", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					deleted: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false for deleted", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					deleted: false,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("text fields validation", () => {
			it("should accept empty string for preCompletionNotes", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					preCompletionNotes: "",
				});
				expect(result.success).toBe(true);
			});

			it("should accept empty string for postCompletionNotes", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					postCompletionNotes: "",
				});
				expect(result.success).toBe(true);
			});

			it("should accept long text for preCompletionNotes", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					preCompletionNotes: faker.lorem.paragraphs(10),
				});
				expect(result.success).toBe(true);
			});

			it("should accept long text for postCompletionNotes", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					postCompletionNotes: faker.lorem.paragraphs(10),
				});
				expect(result.success).toBe(true);
			});
		});

		describe("timestamp fields validation", () => {
			it("should accept valid Date object for assignedAt", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assignedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept Date object created from ISO string for assignedAt", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assignedAt: new Date("2024-01-01T00:00:00Z"),
				});
				expect(result.success).toBe(true);
			});

			it("should accept past date for assignedAt", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assignedAt: new Date("2020-01-01T00:00:00Z"),
				});
				expect(result.success).toBe(true);
			});

			it("should accept future date for assignedAt", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assignedAt: new Date("2030-01-01T00:00:00Z"),
				});
				expect(result.success).toBe(true);
			});
		});

		describe("rarely-provided fields validation", () => {
			it("should reject invalid id UUID when provided", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					id: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should accept valid id UUID when provided", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					id: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept valid Date object for createdAt when provided", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					createdAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept valid Date object for updatedAt when provided", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					updatedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept Date object created from ISO string for createdAt", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					createdAt: new Date("2024-01-01T00:00:00Z"),
				});
				expect(result.success).toBe(true);
			});

			it("should accept Date object created from ISO string for updatedAt", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					updatedAt: new Date("2024-01-01T00:00:00Z"),
				});
				expect(result.success).toBe(true);
			});
		});

		describe("edge cases", () => {
			it("should reject null values for required fields", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					actionId: null,
				});
				expect(result.success).toBe(false);
			});

			it("should accept complete valid action item exception record", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					actionId: faker.string.uuid(),
					eventId: faker.string.uuid(),
					assigneeId: faker.string.uuid(),
					volunteerId: faker.string.uuid(),
					volunteerGroupId: faker.string.uuid(),
					categoryId: faker.string.uuid(),
					assignedAt: new Date(),
					preCompletionNotes: faker.lorem.paragraph(),
					postCompletionNotes: faker.lorem.paragraph(),
					completed: true,
					deleted: false,
				});
				expect(result.success).toBe(true);
			});

			it("should accept action item exception with only assignee", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					assigneeId: faker.string.uuid(),
					assignedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept action item exception with only volunteer", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					volunteerId: faker.string.uuid(),
					assignedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept action item exception with only volunteer group", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					volunteerGroupId: faker.string.uuid(),
					assignedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept completed action item exception with notes", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					preCompletionNotes: faker.lorem.sentence(),
					postCompletionNotes: faker.lorem.sentence(),
					completed: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept deleted action item exception", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					...validInput,
					deleted: true,
				});
				expect(result.success).toBe(true);
			});

			it("should handle multiple validation errors", () => {
				const result = actionItemExceptionsTableInsertSchema.safeParse({
					actionId: "invalid-uuid",
					eventId: "invalid-uuid",
					assigneeId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues.length).toBeGreaterThan(1);
				}
			});
		});
	});
});
