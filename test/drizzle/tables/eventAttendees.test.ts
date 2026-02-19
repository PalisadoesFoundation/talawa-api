import { faker } from "@faker-js/faker";
import { and, eq, getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
	eventAttendeesTable,
	eventAttendeesTableInsertSchema,
	eventAttendeesTableRelations,
} from "src/drizzle/tables/eventAttendees";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import { Mutation_createOrganization } from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { beforeAll, describe, expect, it } from "vitest";
import { recurrenceRulesTable, usersTable } from "~/src/drizzle/schema";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { server } from "../../server";

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

async function createTestOrganization(): Promise<string> {
	mercuriusClient.setHeaders({});
	const { accessToken: token } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(
		token,
		"Authentication token is missing from sign-in response",
	);
	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Org-${Date.now()}`,
				countryCode: "us",
				isUserRegistrationRequired: true,
			},
		},
	});
	if (org.errors) {
		throw new Error(
			`Create organization failed: ${JSON.stringify(org.errors)}`,
		);
	}
	const orgId = org.data?.createOrganization?.id;
	assertToBeNonNullish(
		orgId,
		"Organization ID is missing from creation response",
	);
	return orgId;
}

async function createTestEvent(): Promise<string> {
	const { userId } = await createRegularUserUsingAdmin();
	const orgId = await createTestOrganization();

	const eventResult = await server.drizzleClient
		.insert(eventsTable)
		.values({
			creatorId: userId,
			organizationId: orgId,
			name: faker.lorem.word(),
			startAt: faker.date.recent(),
			endAt: faker.date.future(),
		})
		.returning({ id: eventsTable.id });

	const id = eventResult[0]?.id;
	assertToBeNonNullish(id, "Event ID is missing from creation response");

	return id;
}

async function createTestRecurringEventInstance(): Promise<string> {
	const { userId } = await createRegularUserUsingAdmin();
	const orgId = await createTestOrganization();

	// First create a base recurring event template
	const baseEventResult = await server.drizzleClient
		.insert(eventsTable)
		.values({
			creatorId: userId,
			organizationId: orgId,
			name: faker.lorem.word(),
			startAt: faker.date.recent(),
			endAt: faker.date.future(),
			isRecurringEventTemplate: true,
		})
		.returning({ id: eventsTable.id });

	const baseEventId = baseEventResult[0]?.id;
	assertToBeNonNullish(
		baseEventId,
		"Base event ID is missing from creation response",
	);

	// Create a recurrence rule with all required fields
	const recurrenceRuleResult = await server.drizzleClient
		.insert(recurrenceRulesTable)
		.values({
			creatorId: userId,
			organizationId: orgId,
			recurrenceRuleString: "FREQ=WEEKLY;INTERVAL=1",
			frequency: "WEEKLY",
			interval: 1,
			recurrenceStartDate: new Date(),
			latestInstanceDate: new Date(), // Required field!
			baseRecurringEventId: baseEventId,
			originalSeriesId: faker.string.uuid(),
			createdAt: new Date(),
			updatedAt: null,
		})
		.returning({ id: recurrenceRulesTable.id });

	const recurrenceRuleId = recurrenceRuleResult[0]?.id;
	assertToBeNonNullish(recurrenceRuleId, "Recurrence rule ID is missing");

	// Now create a recurring event instance
	const instanceResult = await server.drizzleClient
		.insert(recurringEventInstancesTable)
		.values({
			baseRecurringEventId: baseEventId,
			recurrenceRuleId: recurrenceRuleId,
			originalSeriesId: faker.string.uuid(),
			originalInstanceStartTime: new Date(),
			actualStartTime: new Date(),
			actualEndTime: faker.date.future(),
			organizationId: orgId,
			sequenceNumber: 1,
		})
		.returning({ id: recurringEventInstancesTable.id });

	const id = instanceResult[0]?.id;
	assertToBeNonNullish(
		id,
		"Recurring instance ID is missing from creation response",
	);

	return id;
}

/**
 * Comprehensive tests for eventAttendees table schema definition.
 * Validates table structure, constraints, relations, and type safety.
 */
describe("eventAttendeesTable", () => {
	describe("EventAttendees Table Schema", () => {
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
			it("should reject input when userId is missing", () => {
				const result = eventAttendeesTableInsertSchema.safeParse({
					eventId: "123e4567-e89b-12d3-a456-426614174001",
				});
				expect(result.success).toBe(false);
			});

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
			expect(schema.shape.id).toBeDefined();
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
			expect(schema.shape.createdAt).toBeDefined();
			expect(schema.shape.updatedAt).toBeDefined();
		});
	});

	describe("Database Operations", () => {
		describe("CRUD Operations", () => {
			it("should successfully insert a record with only userId (minimal required)", async () => {
				const { userId } = await createRegularUserUsingAdmin();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				expect(result.userId).toBe(userId);
				expect(result.eventId).toBeNull();
				expect(result.recurringEventInstanceId).toBeNull();
				expect(result.isInvited).toBe(false);
				expect(result.isRegistered).toBe(false);
				expect(result.isCheckedIn).toBe(false);
				expect(result.isCheckedOut).toBe(false);
				expect(result.feedbackSubmitted).toBe(false);
				expect(result.createdAt).toBeInstanceOf(Date);
				expect(result.updatedAt).toBeNull();
			});

			it("should successfully insert a record with eventId", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isInvited: true,
						isRegistered: true,
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				expect(result.userId).toBe(userId);
				expect(result.eventId).toBe(eventId);
				expect(result.recurringEventInstanceId).toBeNull();
				expect(result.isInvited).toBe(true);
				expect(result.isRegistered).toBe(true);
				expect(result.isCheckedIn).toBe(false);
				expect(result.isCheckedOut).toBe(false);
			});

			it("should successfully insert a record with recurringEventInstanceId", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const recurringInstanceId = await createTestRecurringEventInstance();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						recurringEventInstanceId: recurringInstanceId,
						isRegistered: true,
						isCheckedIn: true,
						checkinTime: new Date(),
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				expect(result.userId).toBe(userId);
				expect(result.eventId).toBeNull();
				expect(result.recurringEventInstanceId).toBe(recurringInstanceId);
				expect(result.isRegistered).toBe(true);
				expect(result.isCheckedIn).toBe(true);
				expect(result.checkinTime).toBeInstanceOf(Date);
			});

			it("should successfully query records by userId", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isInvited: true,
					})
					.returning();

				const results = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(eq(eventAttendeesTable.userId, userId));

				expect(Array.isArray(results)).toBe(true);
				expect(results.length).toBeGreaterThan(0);
				expect(results[0]?.userId).toBe(userId);
				expect(results[0]?.eventId).toBe(eventId);
			});

			it("should successfully update a record", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isInvited: true,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}

				const checkinTime = new Date();
				const checkoutTime = new Date(Date.now() + 3600000); // 1 hour later

				const [updated] = await server.drizzleClient
					.update(eventAttendeesTable)
					.set({
						isCheckedIn: true,
						isCheckedOut: true,
						checkinTime: checkinTime,
						checkoutTime: checkoutTime,
						feedbackSubmitted: true,
					})
					.where(eq(eventAttendeesTable.id, inserted.id))
					.returning();

				expect(updated).toBeDefined();
				expect(updated?.isCheckedIn).toBe(true);
				expect(updated?.isCheckedOut).toBe(true);
				expect(updated?.feedbackSubmitted).toBe(true);
				expect(updated?.checkinTime).toEqual(checkinTime);
				expect(updated?.checkoutTime).toEqual(checkoutTime);
				expect(updated?.updatedAt).not.toBeNull();
			});

			it("should successfully delete a record", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}

				const eventAttendeeId = inserted.id;

				const [deleted] = await server.drizzleClient
					.delete(eventAttendeesTable)
					.where(eq(eventAttendeesTable.id, eventAttendeeId))
					.returning();

				expect(deleted).toBeDefined();
				expect(deleted?.id).toBe(eventAttendeeId);

				const [verifyDeleted] = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(eq(eventAttendeesTable.id, eventAttendeeId))
					.limit(1);

				expect(verifyDeleted).toBeUndefined();
			});
		});

		describe("Foreign Key Constraint Enforcement", () => {
			it("should reject insert with invalid userId foreign key", async () => {
				const invalidUserId = faker.string.uuid();
				const eventId = await createTestEvent();

				await expect(
					server.drizzleClient.insert(eventAttendeesTable).values({
						userId: invalidUserId,
						eventId: eventId,
					}),
				).rejects.toThrow();
			});

			it("should reject insert with invalid eventId foreign key", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const invalidEventId = faker.string.uuid();

				await expect(
					server.drizzleClient.insert(eventAttendeesTable).values({
						userId: userId,
						eventId: invalidEventId,
					}),
				).rejects.toThrow();
			});

			it("should reject insert with invalid recurringEventInstanceId foreign key", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const invalidRecurringInstanceId = faker.string.uuid();

				await expect(
					server.drizzleClient.insert(eventAttendeesTable).values({
						userId: userId,
						recurringEventInstanceId: invalidRecurringInstanceId,
					}),
				).rejects.toThrow();
			});
		});

		describe("Cascade Delete and Set Null Behavior", () => {
			it("should cascade delete event attendees when user is deleted (userId foreign key)", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isRegistered: true,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}
				expect(inserted.userId).toBe(userId);

				// Delete the user - should cascade delete the event attendee
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, userId));

				// Verify event attendee was cascade deleted
				const [verifyDeleted] = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(eq(eventAttendeesTable.userId, userId))
					.limit(1);

				expect(verifyDeleted).toBeUndefined();
			});

			it("should cascade delete event attendees when event is deleted (eventId foreign key)", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isInvited: true,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}
				expect(inserted.eventId).toBe(eventId);

				// Delete the event - should cascade delete the event attendee
				await server.drizzleClient
					.delete(eventsTable)
					.where(eq(eventsTable.id, eventId));

				// Verify event attendee was cascade deleted
				const [verifyDeleted] = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(eq(eventAttendeesTable.eventId, eventId))
					.limit(1);

				expect(verifyDeleted).toBeUndefined();
			});

			it("should cascade delete event attendees when recurring event instance is deleted (recurringEventInstanceId foreign key)", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const recurringInstanceId = await createTestRecurringEventInstance();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						recurringEventInstanceId: recurringInstanceId,
						isRegistered: true,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}
				expect(inserted.recurringEventInstanceId).toBe(recurringInstanceId);

				// Delete the recurring event instance - should cascade delete the event attendee
				await server.drizzleClient
					.delete(recurringEventInstancesTable)
					.where(eq(recurringEventInstancesTable.id, recurringInstanceId));

				// Verify event attendee was cascade deleted
				const [verifyDeleted] = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(
						eq(
							eventAttendeesTable.recurringEventInstanceId,
							recurringInstanceId,
						),
					)
					.limit(1);

				expect(verifyDeleted).toBeUndefined();
			});

			it("should handle scenario with both eventId and recurringEventInstanceId set to null (edge case)", async () => {
				const { userId } = await createRegularUserUsingAdmin();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						// Both eventId and recurringEventInstanceId are null
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				expect(result.userId).toBe(userId);
				expect(result.eventId).toBeNull();
				expect(result.recurringEventInstanceId).toBeNull();

				// Verify we can query it
				const [queried] = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(eq(eventAttendeesTable.id, result.id))
					.limit(1);

				expect(queried).toBeDefined();
				expect(queried?.userId).toBe(userId);
			});
		});
	});
	describe("Index Usage and Default Value Verification", () => {
		describe("Default Value Generation", () => {
			it("should generate UUIDv7 for id field automatically", async () => {
				const { userId } = await createRegularUserUsingAdmin();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				// Verify id is a valid UUID (v7 has specific pattern)
				expect(result.id).toMatch(
					/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
				);
				expect(typeof result.id).toBe("string");
				expect(result.id.length).toBe(36);
			});

			it("should set createdAt timestamp automatically with defaultNow()", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const beforeInsert = new Date();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				const afterInsert = new Date();

				// Verify createdAt is set automatically
				expect(result.createdAt).toBeInstanceOf(Date);
				expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
					beforeInsert.getTime(),
				);
				expect(result.createdAt.getTime()).toBeLessThanOrEqual(
					afterInsert.getTime(),
				);
			});

			it("should set all boolean status fields to false by default", async () => {
				const { userId } = await createRegularUserUsingAdmin();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				// Verify all boolean fields default to false
				expect(result.feedbackSubmitted).toBe(false);
				expect(result.isInvited).toBe(false);
				expect(result.isRegistered).toBe(false);
				expect(result.isCheckedIn).toBe(false);
				expect(result.isCheckedOut).toBe(false);
			});

			it("should initialize updatedAt as null and update it on record update", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}

				// Verify updatedAt is null on initial insert
				expect(inserted.updatedAt).toBeNull();

				// Update the record
				await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

				const [updated] = await server.drizzleClient
					.update(eventAttendeesTable)
					.set({
						isCheckedIn: true,
					})
					.where(eq(eventAttendeesTable.id, inserted.id))
					.returning();

				expect(updated).toBeDefined();
				expect(updated?.updatedAt).not.toBeNull();
				expect(updated?.updatedAt).toBeInstanceOf(Date);

				// Verify updatedAt is different from createdAt (or at least not null)
				expect(updated?.updatedAt).not.toEqual(inserted.createdAt);
				// Or simply verify it's not null anymore
				expect(updated?.updatedAt).not.toBeNull();
			});

			it("should maintain checkinTime and checkoutTime as null by default", async () => {
				const { userId } = await createRegularUserUsingAdmin();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}

				// Verify timestamp fields are null by default
				expect(result.checkinTime).toBeNull();
				expect(result.checkoutTime).toBeNull();
			});
		});
	});
	describe("Edge Cases and Runtime Behavior", () => {
		describe("Event ID and Recurring Instance ID Constraints", () => {
			it("should allow either eventId or recurringEventInstanceId to be set, but not required to set either", async () => {
				const { userId } = await createRegularUserUsingAdmin();

				// Test with only userId (both eventId and recurringEventInstanceId null)
				const [result1] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
					})
					.returning();

				expect(result1).toBeDefined();
				expect(result1?.eventId).toBeNull();
				expect(result1?.recurringEventInstanceId).toBeNull();

				// Test with eventId only
				const eventId = await createTestEvent();
				const [result2] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
					})
					.returning();

				expect(result2).toBeDefined();
				expect(result2?.eventId).toBe(eventId);
				expect(result2?.recurringEventInstanceId).toBeNull();

				// Test with recurringEventInstanceId only
				const recurringInstanceId = await createTestRecurringEventInstance();
				const [result3] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						recurringEventInstanceId: recurringInstanceId,
					})
					.returning();

				expect(result3).toBeDefined();
				expect(result3?.eventId).toBeNull();
				expect(result3?.recurringEventInstanceId).toBe(recurringInstanceId);
			});

			it("should document database behavior when both eventId and recurringEventInstanceId are set", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();
				const recurringInstanceId = await createTestRecurringEventInstance();

				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						recurringEventInstanceId: recurringInstanceId,
					})
					.returning();

				expect(result).toBeDefined();
				if (!result) {
					throw new Error("Insert did not return a result");
				}
				// Database allows both to be set
				expect(result.eventId).toBe(eventId);
				expect(result.recurringEventInstanceId).toBe(recurringInstanceId);
			});
		});

		describe("Timestamp Timezone and Precision Handling", () => {
			it("should store and retrieve timestamps with timezone information correctly", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				// Create timestamps in different timezones
				const checkinTimeUTC = new Date("2024-01-15T10:30:00.123Z");
				const checkoutTimeEST = new Date("2024-01-15T15:30:00.456-05:00");

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						checkinTime: checkinTimeUTC,
						checkoutTime: checkoutTimeEST,
						isCheckedIn: true,
						isCheckedOut: true,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}

				// Query the record back
				const [queried] = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(eq(eventAttendeesTable.id, inserted.id))
					.limit(1);

				expect(queried).toBeDefined();

				// Verify timestamps are stored and retrieved correctly
				// Note: The database may normalize timezones to UTC
				expect(queried?.checkinTime).toBeInstanceOf(Date);
				expect(queried?.checkoutTime).toBeInstanceOf(Date);

				// Check that milliseconds precision is maintained (precision: 3 in schema)
				if (queried?.checkinTime && inserted.checkinTime) {
					// Allow for minor rounding differences
					const timeDiff = Math.abs(
						queried.checkinTime.getTime() - checkinTimeUTC.getTime(),
					);
					expect(timeDiff).toBeLessThan(1); // Should be exact or very close
				}
			});

			it("should handle null timestamps for checkinTime and checkoutTime", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						// checkinTime and checkoutTime intentionally omitted (should be null)
					})
					.returning();

				expect(inserted).toBeDefined();
				expect(inserted?.checkinTime).toBeNull();
				expect(inserted?.checkoutTime).toBeNull();
				expect(inserted?.isCheckedIn).toBe(false);
				expect(inserted?.isCheckedOut).toBe(false);
			});
		});

		describe("Boolean Field State Transitions", () => {
			it("should correctly track check-in/check-out state transitions", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				// Initial state - registered but not checked in
				const [registered] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isRegistered: true,
					})
					.returning();

				expect(registered).toBeDefined();
				if (!registered) {
					throw new Error("Failed to insert eventAttendees record");
				}
				expect(registered.isRegistered).toBe(true);
				expect(registered.isCheckedIn).toBe(false);
				expect(registered.isCheckedOut).toBe(false);
				expect(registered.checkinTime).toBeNull();
				expect(registered.checkoutTime).toBeNull();

				// Check in
				const checkinTime = new Date();
				const [checkedIn] = await server.drizzleClient
					.update(eventAttendeesTable)
					.set({
						isCheckedIn: true,
						checkinTime: checkinTime,
					})
					.where(eq(eventAttendeesTable.id, registered.id))
					.returning();

				expect(checkedIn).toBeDefined();
				if (!checkedIn) {
					throw new Error("Failed to update check-in status");
				}
				expect(checkedIn.isCheckedIn).toBe(true);
				expect(checkedIn.checkinTime).toEqual(checkinTime);
				expect(checkedIn.isCheckedOut).toBe(false);
				expect(checkedIn.checkoutTime).toBeNull();

				// Check out
				const checkoutTime = new Date(checkinTime.getTime() + 3600000); // 1 hour later
				const [checkedOut] = await server.drizzleClient
					.update(eventAttendeesTable)
					.set({
						isCheckedOut: true,
						checkoutTime: checkoutTime,
					})
					.where(eq(eventAttendeesTable.id, registered.id))
					.returning();

				expect(checkedOut).toBeDefined();
				if (!checkedOut) {
					throw new Error("Failed to update check-out status");
				}
				expect(checkedOut.isCheckedOut).toBe(true);
				expect(checkedOut.checkoutTime).toEqual(checkoutTime);
				expect(checkedOut.isCheckedIn).toBe(true); // Should remain true
			});

			it("should handle feedback submission state correctly", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isCheckedIn: true,
						isCheckedOut: true,
						feedbackSubmitted: false,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}
				expect(inserted.feedbackSubmitted).toBe(false);

				// Submit feedback
				const [updated] = await server.drizzleClient
					.update(eventAttendeesTable)
					.set({
						feedbackSubmitted: true,
					})
					.where(eq(eventAttendeesTable.id, inserted.id))
					.returning();

				expect(updated).toBeDefined();
				if (!updated) {
					throw new Error("Failed to update feedback status");
				}
				expect(updated.feedbackSubmitted).toBe(true);
			});

			it("should allow isInvited and isRegistered to be true simultaneously", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				// User can be both invited and registered
				const [result] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isInvited: true,
						isRegistered: true,
					})
					.returning();

				expect(result).toBeDefined();
				expect(result?.isInvited).toBe(true);
				expect(result?.isRegistered).toBe(true);
			});
		});

		describe("Concurrent Operation Edge Cases", () => {
			it("should handle rapid status updates correctly", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
						isRegistered: true,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}

				// Simulate rapid status updates (like quick check-in/check-out)
				const updates = [];
				for (let i = 0; i < 5; i++) {
					const updateResult = await server.drizzleClient
						.update(eventAttendeesTable)
						.set({
							isCheckedIn: i % 2 === 0,
							checkinTime: i % 2 === 0 ? new Date() : null,
							updatedAt: new Date(),
						})
						.where(eq(eventAttendeesTable.id, inserted.id))
						.returning();

					updates.push(updateResult[0]);
					await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
				}

				// Verify last state is correct
				const [final] = await server.drizzleClient
					.select()
					.from(eventAttendeesTable)
					.where(eq(eventAttendeesTable.id, inserted.id))
					.limit(1);

				expect(final).toBeDefined();
				expect(final?.updatedAt).not.toBeNull();
			});
		});

		describe("Data Integrity on Updates", () => {
			it("should maintain data consistency when updating multiple related fields", async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const eventId = await createTestEvent();

				const [inserted] = await server.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: userId,
						eventId: eventId,
					})
					.returning();

				expect(inserted).toBeDefined();
				if (!inserted) {
					throw new Error("Failed to insert eventAttendees record");
				}

				// Update multiple related fields at once
				const updateTime = new Date();
				const [updated] = await server.drizzleClient
					.update(eventAttendeesTable)
					.set({
						isInvited: true,
						isRegistered: true,
						isCheckedIn: true,
						checkinTime: updateTime,
						feedbackSubmitted: false,
					})
					.where(eq(eventAttendeesTable.id, inserted.id))
					.returning();

				expect(updated).toBeDefined();
				expect(updated?.isInvited).toBe(true);
				expect(updated?.isRegistered).toBe(true);
				expect(updated?.isCheckedIn).toBe(true);
				expect(updated?.checkinTime).toEqual(updateTime);
				expect(updated?.feedbackSubmitted).toBe(false);
				expect(updated?.updatedAt).not.toBeNull();
			});
		});
	});

	describe("Composite Index Scenarios", () => {
		it("should efficiently query using composite user-invited-event index for invite-only event checks", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();

			// Insert an invited attendee
			await server.drizzleClient.insert(eventAttendeesTable).values({
				userId: userId,
				eventId: eventId,
				isInvited: true,
				isRegistered: false,
			});

			// This query should use the userInvitedEventIdx composite index
			// (userId, isInvited, eventId) for checking if user is invited to specific event
			const [invitedAttendee] = await server.drizzleClient
				.select()
				.from(eventAttendeesTable)
				.where(
					and(
						eq(eventAttendeesTable.userId, userId),
						eq(eventAttendeesTable.isInvited, true),
						eq(eventAttendeesTable.eventId, eventId),
					),
				)
				.limit(1);

			expect(invitedAttendee).toBeDefined();
		});

		it("should efficiently query using composite user-registered-event index for registered user checks", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const eventId = await createTestEvent();

			// Insert a registered attendee
			await server.drizzleClient.insert(eventAttendeesTable).values({
				userId: userId,
				eventId: eventId,
				isInvited: false,
				isRegistered: true,
			});

			// This query should use the userRegisteredEventIdx composite index
			// (userId, isRegistered, eventId) for checking if user is registered for specific event
			const [registeredAttendee] = await server.drizzleClient
				.select()
				.from(eventAttendeesTable)
				.where(
					and(
						eq(eventAttendeesTable.userId, userId),
						eq(eventAttendeesTable.isRegistered, true),
						eq(eventAttendeesTable.eventId, eventId),
					),
				)
				.limit(1);

			expect(registeredAttendee).toBeDefined();
		});
	});
});
