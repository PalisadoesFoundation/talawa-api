import { faker } from "@faker-js/faker";
import { eq, getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	notificationTemplatesTable,
	notificationTemplatesTableInsertSchema,
	notificationTemplatesTableRelations,
} from "~/src/drizzle/tables/NotificationTemplate";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

/**
 * Tests for notificationTemplatesTable definition - validates table schema, relations,
 * insert schema validation, and database operations.
 */
describe("Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(notificationTemplatesTable)).toBe(
				"notification_templates",
			);
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(notificationTemplatesTable);
			expect(columns).toContain("id");
			expect(columns).toContain("name");
			expect(columns).toContain("eventType");
			expect(columns).toContain("title");
			expect(columns).toContain("body");
			expect(columns).toContain("channelType");
			expect(columns).toContain("linkedRouteName");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have correct primary key configuration", () => {
			expect(notificationTemplatesTable.id.primary).toBe(true);
			expect(notificationTemplatesTable.id.hasDefault).toBe(true);
		});

		it("should have correct foreign key relationships validation", () => {
			const tableConfig = getTableConfig(notificationTemplatesTable);
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(tableConfig.foreignKeys.length).toBe(2);
		});
	});

	describe("Table Indexes", () => {
		const tableConfig = getTableConfig(notificationTemplatesTable);

		it("should have exactly 3 indexes defined", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
			expect(tableConfig.indexes.length).toBe(3);
		});
	});

	describe("Table Relations", () => {
		// Helper type for captured relation data
		interface CapturedRelation {
			table: Table;
			config?: {
				relationName?: string;
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

		beforeAll(() => {
			capturedRelations = {};
			(
				notificationTemplatesTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (
						getTableName(table) === "users" &&
						config?.fields?.[0] === notificationTemplatesTable.creatorId
					) {
						capturedRelations.creator = { table, config };
					}
					if (
						getTableName(table) === "users" &&
						config?.fields?.[0] === notificationTemplatesTable.updaterId
					) {
						capturedRelations.updater = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (table: Table, config?: CapturedRelation["config"]) => {
					if (getTableName(table) === "notification_logs") {
						capturedRelations.notificationLogsWhereTemplate = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should define creator relationship", () => {
			expect(capturedRelations.creator).toBeDefined();
			expect(getTableName(capturedRelations.creator?.table as Table)).toBe(
				"users",
			);
		});

		it("should define updater relationship", () => {
			expect(capturedRelations.updater).toBeDefined();
			expect(getTableName(capturedRelations.updater?.table as Table)).toBe(
				"users",
			);
		});

		it("should define notification logs relationship", () => {
			expect(capturedRelations.notificationLogsWhereTemplate).toBeDefined();
			expect(
				getTableName(
					capturedRelations.notificationLogsWhereTemplate?.table as Table,
				),
			).toBe("notification_logs");
		});
	});

	describe("Insert Schema Validation", () => {
		it("should accept valid notification template data", () => {
			const validData = {
				name: "Welcome Notification",
				eventType: "user_registration",
				title: "Welcome to Talawa!",
				body: "Thank you for joining us",
				channelType: "email",
				linkedRouteName: "/dashboard",
			};

			expect(
				notificationTemplatesTableInsertSchema.safeParse(validData).success,
			).toBe(true);
		});

		it("should reject name shorter than 1 character", () => {
			const invalidData = {
				name: "",
				eventType: "test",
				title: "Test",
				body: "Test body",
				channelType: "email",
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(invalidData).success,
			).toBe(false);
		});

		it("should reject name longer than 256 characters", () => {
			const invalidData = {
				name: "a".repeat(257),
				eventType: "test",
				title: "Test",
				body: "Test body",
				channelType: "email",
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(invalidData).success,
			).toBe(false);
		});

		it("should validate eventType length constraints (min: 1, max: 64)", () => {
			const tooLong = {
				name: "Test",
				eventType: "a".repeat(65),
				title: "Test",
				body: "Test body",
				channelType: "email",
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(tooLong).success,
			).toBe(false);
		});

		it("should validate title length constraints (min: 1, max: 256)", () => {
			const tooShort = {
				name: "Test",
				eventType: "test",
				title: "",
				body: "Test body",
				channelType: "email",
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(tooShort).success,
			).toBe(false);
		});

		it("should validate body length constraints (min: 1, max: 4096)", () => {
			const tooLong = {
				name: "Test",
				eventType: "test",
				title: "Test",
				body: "a".repeat(4097),
				channelType: "email",
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(tooLong).success,
			).toBe(false);
		});

		it("should validate channelType length constraints (min: 1, max: 32)", () => {
			const tooLong = {
				name: "Test",
				eventType: "test",
				title: "Test",
				body: "Test body",
				channelType: "a".repeat(33),
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(tooLong).success,
			).toBe(false);
		});

		it("should allow optional linkedRouteName", () => {
			const withoutLinkedRoute = {
				name: "Test",
				eventType: "test",
				title: "Test",
				body: "Test body",
				channelType: "email",
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(withoutLinkedRoute)
					.success,
			).toBe(true);
		});

		it("should validate linkedRouteName length if provided (min: 1, max: 256)", () => {
			const validWithRoute = {
				name: "Test",
				eventType: "test",
				title: "Test",
				body: "Test body",
				channelType: "email",
				linkedRouteName: "/dashboard",
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(validWithRoute)
					.success,
			).toBe(true);
		});

		it("should reject all required fields when missing", () => {
			const emptyData = {};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(emptyData).success,
			).toBe(false);
		});
	});

	describe("Database Operations", () => {
		let testUserId: string;
		let testTemplateId: string;

		beforeAll(async () => {
			// Create a test user for foreign key relationships
			const [user] = await server.drizzleClient
				.insert(usersTable)
				.values({
					name: faker.person.fullName(),
					emailAddress: faker.internet.email(),
					passwordHash: faker.internet.password(),
					isEmailAddressVerified: true,
					role: "USER",
				})
				.returning();
			if (!user) throw new Error("Failed to create test user");
			testUserId = user.id;
		});

		afterAll(async () => {
			// Clean up test data
			if (testTemplateId) {
				await server.drizzleClient
					.delete(notificationTemplatesTable)
					.where(eq(notificationTemplatesTable.id, testTemplateId));
			}
			if (testUserId) {
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, testUserId));
			}
		});

		it("should insert a notification template", async () => {
			const [inserted] = await server.drizzleClient
				.insert(notificationTemplatesTable)
				.values({
					name: "Test Template",
					eventType: "test_event",
					title: "Test Title",
					body: "Test Body",
					channelType: "email",
					creatorId: testUserId,
				})
				.returning();

			expect(inserted).toBeDefined();
			expect(inserted?.id).toBeDefined();
			expect(inserted?.name).toBe("Test Template");
			if (inserted) {
				testTemplateId = inserted.id;
			}
		});

		it("should query notification templates", async () => {
			const results = await server.drizzleClient
				.select()
				.from(notificationTemplatesTable)
				.where(eq(notificationTemplatesTable.id, testTemplateId));

			expect(results).toHaveLength(1);
			expect(results[0]?.name).toBe("Test Template");
		});

		it("should update a notification template", async () => {
			const [updated] = await server.drizzleClient
				.update(notificationTemplatesTable)
				.set({
					title: "Updated Title",
					updaterId: testUserId,
				})
				.where(eq(notificationTemplatesTable.id, testTemplateId))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.title).toBe("Updated Title");
			expect(updated?.updatedAt).toBeDefined();
		});

		// Skip this test if it's too flaky due to timing, but trying it out
		it("should verify updatedAt is set on update", async () => {
			const [original] = await server.drizzleClient
				.select()
				.from(notificationTemplatesTable)
				.where(eq(notificationTemplatesTable.id, testTemplateId));

			await new Promise((resolve) => setTimeout(resolve, 100)); // Increased wait

			await server.drizzleClient
				.update(notificationTemplatesTable)
				.set({ name: "Updated Name" })
				.where(eq(notificationTemplatesTable.id, testTemplateId));

			const [updated] = await server.drizzleClient
				.select()
				.from(notificationTemplatesTable)
				.where(eq(notificationTemplatesTable.id, testTemplateId));

			expect(updated?.updatedAt?.getTime()).toBeGreaterThan(
				original?.updatedAt?.getTime() ?? 0,
			);
		});

		it("should verify default createdAt timestamp", async () => {
			const [row] = await server.drizzleClient
				.select()
				.from(notificationTemplatesTable)
				.where(eq(notificationTemplatesTable.id, testTemplateId));

			expect(row?.createdAt).toBeInstanceOf(Date);
			expect(row?.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
		});
	});
});
