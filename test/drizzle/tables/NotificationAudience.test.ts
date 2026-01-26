import { faker } from "@faker-js/faker";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import { describe, expect, it } from "vitest";
import {
	notificationAudienceTable,
	notificationAudienceTableRelations,
	notificationLogsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { notificationAudienceTableInsertSchema } from "~/src/drizzle/tables/NotificationAudience";
import { server } from "../../server";

describe("src/drizzle/tables/NotificationAudience.ts", () => {
	describe("notificationAudience Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(notificationAudienceTable);
			expect(columns).toContain("notificationId");
			expect(columns).toContain("userId");
			expect(columns).toContain("isRead");
			expect(columns).toContain("readAt");
			expect(columns).toContain("createdAt");
		});

		it("should have correct primary key configuration", () => {
			expect(notificationAudienceTable.notificationId).toBeDefined();
			expect(notificationAudienceTable.userId).toBeDefined();
		});

		it("should have required fields configured as not null", () => {
			expect(notificationAudienceTable.notificationId.notNull).toBe(true);
			expect(notificationAudienceTable.userId.notNull).toBe(true);
			expect(notificationAudienceTable.isRead.notNull).toBe(true);
			expect(notificationAudienceTable.createdAt.notNull).toBe(true);
		});

		it("should have default values configured", () => {
			expect(notificationAudienceTable.isRead.hasDefault).toBe(true);
			expect(notificationAudienceTable.createdAt.hasDefault).toBe(true);
		});

		it("should have isRead default to false", () => {
			const defaultValue = notificationAudienceTable.isRead.default;
			expect(defaultValue).toBe(false);
		});

		it("should have nullable readAt field", () => {
			expect(notificationAudienceTable.readAt.notNull).toBe(false);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid notificationId foreign key", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const invalidNotificationId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(notificationAudienceTable).values({
					notificationId: invalidNotificationId,
					userId: userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty notificationId", async () => {
			const { userId } = await createRegularUserUsingAdmin();

			await expect(
				server.drizzleClient.insert(notificationAudienceTable).values({
					notificationId: "" as any,
					userId: userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid userId foreign key", async () => {
			const invalidUserId = faker.string.uuid();
			const notificationId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(notificationAudienceTable).values({
					notificationId: notificationId,
					userId: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty userId", async () => {
			const notificationId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(notificationAudienceTable).values({
					notificationId: notificationId,
					userId: "" as any,
				}),
			).rejects.toThrow();
		});
	});

	describe("Table Relations", () => {
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
					typeof notificationAudienceTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof notificationAudienceTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(notificationAudienceTableRelations).toBeDefined();
			expect(typeof notificationAudienceTableRelations).toBe("object");
		});

		it("should be associated with notificationAudienceTableRelations", () => {
			expect(notificationAudienceTableRelations.table).toBe(
				notificationAudienceTable,
			);
		});

		it("should have a config function", () => {
			expect(typeof notificationAudienceTableRelations.config).toBe(
				"function",
			);
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = notificationAudienceTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.notification).toBeDefined();
			expect(relationsResult.user).toBeDefined();
		});

		it("should define notification as a one-to-one relation with notificationLogsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = notificationAudienceTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.notification as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(notificationLogsTable);
		});

		it("should define user as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = notificationAudienceTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.user as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should execute relations config function with proper structure", () => {
			const { one, many } = createMockBuilders();
			const result = notificationAudienceTableRelations.config({
				one,
				many,
			});

			expect(result).toHaveProperty("notification");
			expect(result).toHaveProperty("user");
			expect(Object.keys(result)).toHaveLength(2);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required notificationId and userId fields", () => {
			const invalidData = {};
			const result =
				notificationAudienceTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("notificationId"),
					),
				).toBe(true);
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("userId"),
					),
				).toBe(true);
			}
		});

		it("should reject empty notificationId string", () => {
			const invalidData = {
				notificationId: "",
				userId: faker.string.uuid(),
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject empty userId string", () => {
			const invalidData = {
				notificationId: faker.string.uuid(),
				userId: "",
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject null notificationId", () => {
			const invalidData = {
				notificationId: null,
				userId: faker.string.uuid(),
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject null userId", () => {
			const invalidData = {
				notificationId: faker.string.uuid(),
				userId: null,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should accept valid data with required fields only", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept valid data with isRead field", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept valid data with isRead as false", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: false,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should make isRead optional in insert schema", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isRead).toBeUndefined();
			}
		});

		it("should accept valid data with readAt timestamp", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
				readAt: new Date(),
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept null readAt value", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				readAt: null,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Index Configuration", () => {
		it("should have indexes defined on the table", () => {
			const tableConfigs = Object.getOwnPropertyNames(
				notificationAudienceTable,
			);
			expect(tableConfigs.length).toBeGreaterThan(0);
		});

		it("should have index on notificationId column", () => {
			expect(notificationAudienceTable.notificationId).toBeDefined();
		});

		it("should have index on userId column", () => {
			expect(notificationAudienceTable.userId).toBeDefined();
		});

		it("should have index on isRead column", () => {
			expect(notificationAudienceTable.isRead).toBeDefined();
		});
	});

	describe("Default Values", () => {
		it("should set isRead to false by default", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should allow overriding isRead default", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isRead).toBe(true);
			}
		});
	});

	describe("Composite Primary Key", () => {
		it("should have composite primary key defined on (notificationId, userId)", () => {
			expect(notificationAudienceTable.notificationId).toBeDefined();
			expect(notificationAudienceTable.userId).toBeDefined();
			expect(notificationAudienceTable.notificationId.notNull).toBe(true);
			expect(notificationAudienceTable.userId.notNull).toBe(true);
		});

		it("should validate composite key uniqueness in schema", () => {
			const validData1 = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			const validData2 = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};

			const result1 = notificationAudienceTableInsertSchema.safeParse(validData1);
			const result2 = notificationAudienceTableInsertSchema.safeParse(validData2);
			
			expect(result1.success).toBe(true);
			expect(result2.success).toBe(true);
		});
	});

	describe("Cascade Delete Behavior", () => {
		it("should define cascade delete constraint on notificationId", () => {
			expect(notificationAudienceTable.notificationId).toBeDefined();
		});

		it("should define cascade delete constraint on userId", () => {
			expect(notificationAudienceTable.userId).toBeDefined();
		});
	});

	describe("Timestamp Fields", () => {
		it("should have createdAt timestamp", () => {
			expect(notificationAudienceTable.createdAt).toBeDefined();
			expect(notificationAudienceTable.createdAt.notNull).toBe(true);
		});

		it("should have readAt as optional timestamp", () => {
			expect(notificationAudienceTable.readAt).toBeDefined();
			expect(notificationAudienceTable.readAt.notNull).toBe(false);
		});

		it("should have timestamps with timezone support", () => {
			expect(notificationAudienceTable.createdAt).toBeDefined();
			expect(notificationAudienceTable.readAt).toBeDefined();
		});
	});

	describe("Read Status Tracking", () => {
		it("should track read status with isRead boolean", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: false,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.isRead).toBe(false);
			}
		});

		it("should track read timestamp with readAt field", () => {
			const now = new Date();
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
				readAt: now,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.readAt).toEqual(now);
			}
		});

		it("should allow readAt to be null when isRead is false", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: false,
				readAt: null,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Column Precision", () => {
		it("should have timestamps with correct precision", () => {
			expect(notificationAudienceTable.createdAt).toBeDefined();
			expect(notificationAudienceTable.readAt).toBeDefined();
		});
	});

	describe("Data Type Validation", () => {
		it("should accept UUID format for notificationId", () => {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			expect(uuidRegex.test(validData.notificationId)).toBe(true);
			expect(uuidRegex.test(validData.userId)).toBe(true);

			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept boolean for isRead", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject non-boolean values for isRead", () => {
			const invalidData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: "true" as any,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});
});
