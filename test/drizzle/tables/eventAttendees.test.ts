import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Mock dependencies BEFORE imports to prevent import-time errors
vi.mock("uuidv7", () => ({ uuidv7: vi.fn() }));
vi.mock("./users", () => ({
	usersTable: {
		id: { name: "id" },
		[Symbol.for("drizzle:Name")]: "users",
	},
}));
vi.mock("./events", () => ({
	eventsTable: {
		id: { name: "id" },
		[Symbol.for("drizzle:Name")]: "events",
	},
}));
vi.mock("./recurringEventInstances", () => ({
	recurringEventInstancesTable: {
		id: { name: "id" },
		[Symbol.for("drizzle:Name")]: "recurring_event_instances",
	},
}));

// Import module after mocks are set up
import {
	type CreateEventAttendeeInput,
	eventAttendeesTable,
	eventAttendeesTableInsertSchema,
	eventAttendeesTableRelations,
	type UpdateEventAttendeeInput,
} from "src/drizzle/tables/eventAttendees";

/**
 * Helper function to extract column name from Drizzle column objects.
 * Used for safely accessing column names in table configuration tests.
 */
const getColumnName = (col: unknown): string | undefined => {
	if (col && typeof col === "object" && "name" in col) {
		return col.name as string;
	}
	return undefined;
};

/**
 * Comprehensive tests for eventAttendees table schema definition.
 * Validates table structure, constraints, relations, and type safety.
 */
describe("eventAttendeesTable", () => {
	describe("Table Structure", () => {
		it("should have correct table name", () => {
			expect(getTableName(eventAttendeesTable)).toBe("event_attendees");
		});

		it("should contain all required columns", () => {
			const columns = Object.keys(eventAttendeesTable);
			const expectedColumns = [
				"id",
				"userId",
				"eventId",
				"recurringEventInstanceId",
				"checkinTime",
				"checkoutTime",
				"feedbackSubmitted",
				"isInvited",
				"isRegistered",
				"isCheckedIn",
				"isCheckedOut",
				"createdAt",
				"updatedAt",
			];

			expectedColumns.forEach((column) => {
				expect(columns).toContain(column);
			});
		});

		describe("Primary Key Column", () => {
			it("should have UUID primary key", () => {
				expect(eventAttendeesTable.id.name).toBe("id");
				expect(eventAttendeesTable.id.columnType).toBe("PgUUID");
				expect(eventAttendeesTable.id.primary).toBe(true);
			});
		});

		describe("Foreign Key Columns", () => {
			it("should have userId as non-nullable foreign key", () => {
				expect(eventAttendeesTable.userId.name).toBe("user_id");
				expect(eventAttendeesTable.userId.notNull).toBe(true);
				expect(eventAttendeesTable.userId.columnType).toBe("PgUUID");
			});

			it("should have eventId as nullable foreign key", () => {
				expect(eventAttendeesTable.eventId.name).toBe("event_id");
				expect(eventAttendeesTable.eventId.notNull).toBe(false);
				expect(eventAttendeesTable.eventId.columnType).toBe("PgUUID");
			});

			it("should have recurringEventInstanceId as nullable foreign key", () => {
				expect(eventAttendeesTable.recurringEventInstanceId.name).toBe(
					"recurring_event_instance_id",
				);
				expect(eventAttendeesTable.recurringEventInstanceId.notNull).toBe(
					false,
				);
				expect(eventAttendeesTable.recurringEventInstanceId.columnType).toBe(
					"PgUUID",
				);
			});
		});

		describe("Timestamp Columns", () => {
			it("should have checkinTime as nullable timestamp", () => {
				expect(eventAttendeesTable.checkinTime.name).toBe("checkin_time");
				expect(eventAttendeesTable.checkinTime.notNull).toBe(false);
				expect(eventAttendeesTable.checkinTime.columnType).toBe("PgTimestamp");
			});

			it("should have checkoutTime as nullable timestamp", () => {
				expect(eventAttendeesTable.checkoutTime.name).toBe("checkout_time");
				expect(eventAttendeesTable.checkoutTime.notNull).toBe(false);
				expect(eventAttendeesTable.checkoutTime.columnType).toBe("PgTimestamp");
			});

			it("should have createdAt as non-nullable timestamp with default", () => {
				expect(eventAttendeesTable.createdAt.name).toBe("created_at");
				expect(eventAttendeesTable.createdAt.notNull).toBe(true);
				expect(eventAttendeesTable.createdAt.columnType).toBe("PgTimestamp");
			});

			it("should have updatedAt as nullable timestamp", () => {
				expect(eventAttendeesTable.updatedAt.name).toBe("updated_at");
				expect(eventAttendeesTable.updatedAt.notNull).toBe(false);
				expect(eventAttendeesTable.updatedAt.columnType).toBe("PgTimestamp");
			});
		});

		describe("Boolean Status Columns", () => {
			it("should have feedbackSubmitted column", () => {
				expect(eventAttendeesTable.feedbackSubmitted.name).toBe(
					"feedback_submitted",
				);
				expect(eventAttendeesTable.feedbackSubmitted.columnType).toBe(
					"PgBoolean",
				);
				expect(eventAttendeesTable.feedbackSubmitted.notNull).toBe(true);
			});

			it("should have isInvited column", () => {
				expect(eventAttendeesTable.isInvited.name).toBe("is_invited");
				expect(eventAttendeesTable.isInvited.columnType).toBe("PgBoolean");
				expect(eventAttendeesTable.isInvited.notNull).toBe(true);
			});

			it("should have isRegistered column", () => {
				expect(eventAttendeesTable.isRegistered.name).toBe("is_registered");
				expect(eventAttendeesTable.isRegistered.columnType).toBe("PgBoolean");
				expect(eventAttendeesTable.isRegistered.notNull).toBe(true);
			});

			it("should have isCheckedIn column", () => {
				expect(eventAttendeesTable.isCheckedIn.name).toBe("is_checked_in");
				expect(eventAttendeesTable.isCheckedIn.columnType).toBe("PgBoolean");
				expect(eventAttendeesTable.isCheckedIn.notNull).toBe(true);
			});

			it("should have isCheckedOut column", () => {
				expect(eventAttendeesTable.isCheckedOut.name).toBe("is_checked_out");
				expect(eventAttendeesTable.isCheckedOut.columnType).toBe("PgBoolean");
				expect(eventAttendeesTable.isCheckedOut.notNull).toBe(true);
			});
		});
	});

	describe("Table Configuration and Constraints", () => {
		const tableConfig = getTableConfig(eventAttendeesTable);

		it("should have correct table name in config", () => {
			expect(tableConfig.name).toBe("event_attendees");
		});

		describe("Foreign Key Constraints", () => {
			it("should have three foreign keys with cascade behavior", () => {
				expect(tableConfig.foreignKeys).toHaveLength(3);

				tableConfig.foreignKeys.forEach((fk) => {
					// Test cascade constraints
					expect(fk.onDelete).toBe("cascade");
					expect(fk.onUpdate).toBe("cascade");

					// Execute reference function for coverage
					if (typeof fk.reference === "function") {
						const ref = fk.reference();
						expect(ref).toBeDefined();
					}
				});
			});
		});

		describe("Database Indexes", () => {
			it("should have indexes defined for performance", () => {
				expect(tableConfig.indexes.length).toBeGreaterThan(0);
			});

			it("should have indexes on frequently queried columns", () => {
				const indexColumnNames = tableConfig.indexes.flatMap((idx) =>
					idx.config.columns.map((col) => getColumnName(col)),
				);

				// Verify essential indexes exist
				expect(indexColumnNames).toContain("user_id");
				expect(indexColumnNames).toContain("event_id");
				expect(indexColumnNames).toContain("recurring_event_instance_id");
			});
		});
	});

	describe("Database Relations", () => {
		it("should have relations object defined", () => {
			expect(eventAttendeesTableRelations).toBeDefined();
			expect(eventAttendeesTableRelations.table).toBe(eventAttendeesTable);
		});

		describe("Relation Configuration", () => {
			interface CapturedRelation {
				table: Table;
				config: {
					relationName?: string;
					fields?: unknown[];
					references?: unknown[];
				};
			}

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

			beforeAll(() => {
				// Execute the relations configuration function to capture relation definitions
				capturedRelations = {};
				(
					eventAttendeesTableRelations.config as unknown as (
						helpers: MockRelationHelpers,
					) => unknown
				)({
					one: (table: Table, config?: CapturedRelation["config"]) => {
						if (config?.fields?.[0] === eventAttendeesTable.userId) {
							capturedRelations.user = { table, config };
						}
						if (config?.fields?.[0] === eventAttendeesTable.eventId) {
							capturedRelations.event = { table, config };
						}
						if (
							config?.fields?.[0] ===
							eventAttendeesTable.recurringEventInstanceId
						) {
							capturedRelations.recurringEventInstance = { table, config };
						}
						return { withFieldName: () => ({}) };
					},
					many: () => ({ withFieldName: () => ({}) }),
				});
			});

			it("should define user relation to users table", () => {
				expect(capturedRelations.user).toBeDefined();
				if (capturedRelations.user) {
					expect(getTableName(capturedRelations.user.table)).toBe("users");
				}
			});

			it("should define event relation to events table", () => {
				expect(capturedRelations.event).toBeDefined();
				if (capturedRelations.event) {
					expect(getTableName(capturedRelations.event.table)).toBe("events");
				}
			});

			it("should define recurringEventInstance relation", () => {
				expect(capturedRelations.recurringEventInstance).toBeDefined();
				if (capturedRelations.recurringEventInstance) {
					expect(
						getTableName(capturedRelations.recurringEventInstance.table),
					).toBe("recurring_event_instances");
				}
			});

			it("should have exactly three relations defined", () => {
				expect(Object.keys(capturedRelations)).toHaveLength(3);
			});
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate minimal required input", () => {
			const validInput = {
				userId: "123e4567-e89b-12d3-a456-426614174000",
			};
			const result = eventAttendeesTableInsertSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should validate complete input with eventId", () => {
			const validInput = {
				userId: "123e4567-e89b-12d3-a456-426614174000",
				eventId: "123e4567-e89b-12d3-a456-426614174001",
				checkinTime: new Date(),
				checkoutTime: new Date(),
				feedbackSubmitted: true,
				isInvited: true,
				isRegistered: true,
				isCheckedIn: true,
				isCheckedOut: true,
			};
			const result = eventAttendeesTableInsertSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it("should validate complete input with recurringEventInstanceId", () => {
			const validInput = {
				userId: "123e4567-e89b-12d3-a456-426614174000",
				recurringEventInstanceId: "123e4567-e89b-12d3-a456-426614174002",
				checkinTime: new Date(),
				checkoutTime: new Date(),
				feedbackSubmitted: false,
				isInvited: false,
				isRegistered: true,
				isCheckedIn: false,
				isCheckedOut: false,
			};
			const result = eventAttendeesTableInsertSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		describe("Invalid Input Rejection", () => {
			it("should reject invalid UUID for userId", () => {
				const result = eventAttendeesTableInsertSchema.safeParse({
					userId: "not-a-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID for eventId", () => {
				const result = eventAttendeesTableInsertSchema.safeParse({
					userId: "123e4567-e89b-12d3-a456-426614174000",
					eventId: "not-a-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID for recurringEventInstanceId", () => {
				const result = eventAttendeesTableInsertSchema.safeParse({
					userId: "123e4567-e89b-12d3-a456-426614174000",
					recurringEventInstanceId: "not-a-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject non-Date value for checkinTime", () => {
				const result = eventAttendeesTableInsertSchema.safeParse({
					userId: "123e4567-e89b-12d3-a456-426614174000",
					checkinTime: "not-a-date",
				});
				expect(result.success).toBe(false);
			});

			it("should reject non-boolean value for isInvited", () => {
				const result = eventAttendeesTableInsertSchema.safeParse({
					userId: "123e4567-e89b-12d3-a456-426614174000",
					isInvited: "not-a-boolean",
				});
				expect(result.success).toBe(false);
			});
		});

		it("should have validators for all schema fields", () => {
			const schema = eventAttendeesTableInsertSchema;
			expect(schema.shape.userId).toBeDefined();
			expect(schema.shape.eventId).toBeDefined();
			expect(schema.shape.recurringEventInstanceId).toBeDefined();
			expect(schema.shape.checkinTime).toBeDefined();
			expect(schema.shape.checkoutTime).toBeDefined();
			expect(schema.shape.feedbackSubmitted).toBeDefined();
			expect(schema.shape.isInvited).toBeDefined();
			expect(schema.shape.isRegistered).toBeDefined();
			expect(schema.shape.isCheckedIn).toBeDefined();
			expect(schema.shape.isCheckedOut).toBeDefined();
		});
	});

	describe("TypeScript Type Definitions", () => {
		describe("CreateEventAttendeeInput", () => {
			it("should allow minimal creation with only userId", () => {
				const input: CreateEventAttendeeInput = {
					userId: "123e4567-e89b-12d3-a456-426614174000",
				};
				expect(input.userId).toBeDefined();
			});

			it("should allow creation with eventId and status flags", () => {
				const input: CreateEventAttendeeInput = {
					userId: "123e4567-e89b-12d3-a456-426614174000",
					eventId: "123e4567-e89b-12d3-a456-426614174001",
					isInvited: true,
					isRegistered: false,
				};
				expect(input.eventId).toBeDefined();
				expect(input.isInvited).toBe(true);
			});

			it("should allow creation with recurringEventInstanceId", () => {
				const input: CreateEventAttendeeInput = {
					userId: "123e4567-e89b-12d3-a456-426614174000",
					recurringEventInstanceId: "123e4567-e89b-12d3-a456-426614174002",
					isRegistered: true,
				};
				expect(input.recurringEventInstanceId).toBeDefined();
				expect(input.isRegistered).toBe(true);
			});
		});

		describe("UpdateEventAttendeeInput", () => {
			it("should allow updating check-in status", () => {
				const input: UpdateEventAttendeeInput = {
					checkinTime: new Date("2024-01-15T10:00:00Z"),
					isCheckedIn: true,
				};
				expect(input.checkinTime).toBeInstanceOf(Date);
				expect(input.isCheckedIn).toBe(true);
			});

			it("should allow updating multiple status fields", () => {
				const input: UpdateEventAttendeeInput = {
					feedbackSubmitted: true,
					isInvited: false,
					isRegistered: true,
					isCheckedOut: true,
				};
				expect(input.feedbackSubmitted).toBe(true);
				expect(input.isRegistered).toBe(true);
			});

			it("should allow partial updates", () => {
				const input: UpdateEventAttendeeInput = {
					isCheckedIn: true,
				};
				expect(input.isCheckedIn).toBe(true);
			});
		});
	});

	describe("Schema Design Constraints", () => {
		it("should allow either eventId or recurringEventInstanceId to be undefined", () => {
			expect(eventAttendeesTable.eventId.notNull).toBe(false);
			expect(eventAttendeesTable.recurringEventInstanceId.notNull).toBe(false);
		});

		it("should require createdAt timestamp", () => {
			expect(eventAttendeesTable.createdAt.notNull).toBe(true);
		});

		it("should have optional updatedAt timestamp", () => {
			expect(eventAttendeesTable.updatedAt.notNull).toBe(false);
		});
	});
});
