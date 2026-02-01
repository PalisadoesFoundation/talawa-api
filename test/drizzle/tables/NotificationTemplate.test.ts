import { eq, getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
	notificationTemplatesTable,
	notificationTemplatesTableInsertSchema,
	notificationTemplatesTableRelations,
} from "~/src/drizzle/tables/NotificationTemplate";
import { usersTable } from "~/src/drizzle/tables/users";
import { createRegularUserUsingAdmin } from "../../graphql/types/createRegularUserUsingAdmin";
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
			const tableConfig = getTableConfig(notificationTemplatesTable);
			const columns = tableConfig.columns.map((col) => col.name);
			const expectedColumns = [
				"id",
				"name",
				"event_type",
				"title",
				"body",
				"channel_type",
				"linked_route_name",
				"created_at",
				"creator_id",
				"updated_at",
				"updater_id",
			];
			expect(columns).toEqual(expect.arrayContaining(expectedColumns));
			expect(columns.length).toBe(expectedColumns.length);
		});

		it("should have correct primary key configuration", () => {
			expect(notificationTemplatesTable.id.primary).toBe(true);
			expect(notificationTemplatesTable.id.hasDefault).toBe(true);
		});

		it("should have correct foreign key relationships validation", () => {
			const tableConfig = getTableConfig(notificationTemplatesTable);
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(tableConfig.foreignKeys.length).toBe(2);

			const fkCreator = tableConfig.foreignKeys.find((fk) =>
				fk.reference().columns.includes(notificationTemplatesTable.creatorId),
			);
			expect(fkCreator).toBeDefined();
			expect(getTableName(fkCreator?.reference().foreignTable as Table)).toBe(
				"users",
			);

			const fkUpdater = tableConfig.foreignKeys.find((fk) =>
				fk.reference().columns.includes(notificationTemplatesTable.updaterId),
			);
			expect(fkUpdater).toBeDefined();
			expect(getTableName(fkUpdater?.reference().foreignTable as Table)).toBe(
				"users",
			);
		});
	});

	describe("Table Indexes", () => {
		const tableConfig = getTableConfig(notificationTemplatesTable);

		it("should have exactly 3 indexes defined with correct columns", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
			expect(tableConfig.indexes.length).toBe(3);

			const indexedColumns = tableConfig.indexes.flatMap((index) =>
				index.config.columns.map((col) => {
					return (col as unknown as { name: string }).name;
				}),
			);

			expect(indexedColumns).toContain("event_type");
			expect(indexedColumns).toContain("channel_type");
			expect(indexedColumns).toContain("created_at");
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
			expect(capturedRelations.creator?.config?.fields?.[0]).toBe(
				notificationTemplatesTable.creatorId,
			);
			expect(capturedRelations.creator?.config?.references?.[0]).toBe(
				usersTable.id,
			);
		});

		it("should define updater relationship", () => {
			expect(capturedRelations.updater).toBeDefined();
			expect(getTableName(capturedRelations.updater?.table as Table)).toBe(
				"users",
			);
			expect(capturedRelations.updater?.config?.fields?.[0]).toBe(
				notificationTemplatesTable.updaterId,
			);
			expect(capturedRelations.updater?.config?.references?.[0]).toBe(
				usersTable.id,
			);
		});

		it("should define notification logs relationship", () => {
			expect(capturedRelations.notificationLogsWhereTemplate).toBeDefined();
			expect(
				getTableName(
					capturedRelations.notificationLogsWhereTemplate?.table as Table,
				),
			).toBe("notification_logs");
			expect(
				capturedRelations.notificationLogsWhereTemplate?.config?.relationName,
			).toBe("notification_logs.template_id:notification_templates.id");
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

		it.each([
			{ field: "eventType", len: 0, description: "length 0" },
			{ field: "eventType", len: 65, description: "length 65" },
			{ field: "title", len: 0, description: "length 0" },
			{ field: "title", len: 257, description: "length 257" },
			{ field: "body", len: 0, description: "length 0" },
			{ field: "body", len: 4097, description: "length 4097" },
			{ field: "channelType", len: 0, description: "length 0" },
			{ field: "channelType", len: 33, description: "length 33" },
			{ field: "linkedRouteName", len: 0, description: "length 0" },
			{ field: "linkedRouteName", len: 257, description: "length 257" },
		])("should reject $field with $description", ({ field, len }) => {
			const invalidData = {
				name: "Valid Name",
				eventType: "valid_event",
				title: "Valid Title",
				body: "Valid Body",
				channelType: "email",
				linkedRouteName: "/valid-route",
				[field]: "a".repeat(len),
			};
			expect(
				notificationTemplatesTableInsertSchema.safeParse(invalidData).success,
			).toBe(false);
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
			const result = await createRegularUserUsingAdmin();
			testUserId = result.userId;
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

		it("should verify updatedAt is set on update", async () => {
			const startTime = new Date("2020-01-01T00:00:00.000Z");
			let original: typeof notificationTemplatesTable.$inferSelect | undefined;
			let updated: typeof notificationTemplatesTable.$inferSelect | undefined;

			try {
				vi.useFakeTimers({ toFake: ["Date"] });
				vi.setSystemTime(startTime);

				// Update row to set updatedAt to our fixed start time
				await server.drizzleClient
					.update(notificationTemplatesTable)
					.set({ name: "Updated Name 1", updatedAt: startTime })
					.where(eq(notificationTemplatesTable.id, testTemplateId));

				[original] = await server.drizzleClient
					.select()
					.from(notificationTemplatesTable)
					.where(eq(notificationTemplatesTable.id, testTemplateId));

				// Advance time by 1 hour
				const futureTime = new Date("2020-01-01T01:00:00.000Z");
				vi.setSystemTime(futureTime);

				await server.drizzleClient
					.update(notificationTemplatesTable)
					.set({ name: "Updated Name 2" })
					.where(eq(notificationTemplatesTable.id, testTemplateId));

				[updated] = await server.drizzleClient
					.select()
					.from(notificationTemplatesTable)
					.where(eq(notificationTemplatesTable.id, testTemplateId));
			} finally {
				vi.useRealTimers();
			}

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
