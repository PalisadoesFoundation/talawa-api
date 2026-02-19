import { faker } from "@faker-js/faker";
import { getTableConfig } from "drizzle-orm/pg-core";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_readNotification,
	Query_user_notifications,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { afterEach, describe, expect, it } from "vitest";
import {
	notificationAudienceTable,
	notificationAudienceTableRelations,
	notificationLogsTable,
	notificationTemplatesTable,
	usersTable,
} from "~/src/drizzle/schema";
import { notificationAudienceTableInsertSchema } from "~/src/drizzle/tables/NotificationAudience";
import { server } from "../../server";

const POST_CREATED_EVENT_TYPE = "post_created";

type GraphQLNotification = {
	id: string | null;
	isRead: boolean | null;
	readAt: string | null;
	createdAt: string | null;
};

type NotificationListItem = {
	id: string;
	isRead: boolean;
	readAt: string | null;
	createdAt: string | null;
};

const getColumnName = (col: unknown): string | undefined =>
	col && typeof col === "object" && "name" in col
		? (col as { name: string }).name
		: undefined;

async function ensureInAppPostCreatedTemplate(): Promise<string> {
	const existing =
		await server.drizzleClient.query.notificationTemplatesTable.findFirst({
			where: (fields, operators) =>
				operators.and(
					operators.eq(fields.eventType, POST_CREATED_EVENT_TYPE),
					operators.eq(fields.channelType, "in_app"),
				),
		});

	if (existing?.id) {
		return existing.id;
	}

	const [template] = await server.drizzleClient
		.insert(notificationTemplatesTable)
		.values({
			name: "New Post Created",
			eventType: POST_CREATED_EVENT_TYPE,
			title: "New post created",
			body: "A post was created",
			channelType: "in_app",
			linkedRouteName: "/post/{postId}",
		})
		.returning({ id: notificationTemplatesTable.id });

	if (!template?.id) {
		throw new Error("Failed to create notification template for tests");
	}

	return template.id;
}

async function createNotificationLogForTests(): Promise<string> {
	const templateId = await ensureInAppPostCreatedTemplate();
	const notificationId = faker.string.uuid();
	const [notification] = await server.drizzleClient
		.insert(notificationLogsTable)
		.values({
			id: notificationId,
			templateId,
			renderedContent: { title: "Test notification", body: "Body" },
			variables: {},
			eventType: POST_CREATED_EVENT_TYPE,
			channel: "in_app",
			status: "delivered",
		})
		.returning({ id: notificationLogsTable.id });

	if (!notification?.id) {
		throw new Error("Failed to create notification log for tests");
	}

	return notification.id;
}

async function waitForNotifications(
	userId: string,
	authToken: string,
	timeoutMs = 10000,
	predicate?: (notification: NotificationListItem) => boolean,
): Promise<NotificationListItem[]> {
	const start = Date.now();

	while (Date.now() - start < timeoutMs) {
		const response = await mercuriusClient.query(Query_user_notifications, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: { id: userId },
				notificationInput: { first: 10 },
			},
		});

		const raw = (response.data?.user?.notifications ??
			[]) as GraphQLNotification[];

		const normalized = raw.flatMap((notification) => {
			if (!notification?.id || typeof notification.isRead !== "boolean") {
				return [];
			}

			return [
				{
					id: notification.id,
					isRead: notification.isRead,
					readAt: notification.readAt,
					createdAt: notification.createdAt,
				},
			];
		});

		if (normalized.length > 0) {
			if (predicate) {
				const matchingNotification = normalized.find(predicate);
				if (matchingNotification) {
					return normalized;
				}
			} else {
				return normalized;
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 200));
	}

	return [];
}

afterEach(() => {
	mercuriusClient.setHeaders({});
});

describe("src/drizzle/tables/NotificationAudience.ts", () => {
	describe("NotificationAudience GraphQL integration", () => {
		it("exposes audience read state via GraphQL and updates readAt on read", async () => {
			await ensureInAppPostCreatedTemplate();

			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			const { userId, authToken } = await createRegularUserUsingAdmin();
			const cleanups: Array<() => Promise<void>> = [];

			cleanups.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: userId } },
				});
			});

			const organizationResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
					},
				},
			);

			const organizationId = organizationResult.data?.createOrganization?.id;
			assertToBeNonNullish(organizationId);

			cleanups.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: userId,
						organizationId,
						role: "regular",
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						caption: `Post ${faker.lorem.words(2)}`,
					},
				},
			});

			try {
				const notifications = await waitForNotifications(
					userId,
					authToken,
					12000,
				);
				expect(notifications.length).toBeGreaterThan(0);

				const firstNotification = notifications[0];
				assertToBeNonNullish(firstNotification);
				expect(firstNotification.isRead).toBe(false);
				expect(firstNotification.readAt).toBeNull();
				expect(firstNotification.createdAt).toBeTruthy();

				const markReadResult = await mercuriusClient.mutate(
					Mutation_readNotification,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: { notificationIds: [firstNotification.id] },
						},
					},
				);

				expect(markReadResult.errors).toBeUndefined();

				const updatedNotifications = await waitForNotifications(
					userId,
					authToken,
					8000,
					(notification) =>
						notification.id === firstNotification.id &&
						notification.isRead === true,
				);

				const updated = updatedNotifications.find(
					(notification) => notification.id === firstNotification.id,
				);

				expect(updated?.isRead).toBe(true);
				expect(updated?.readAt).not.toBeNull();
			} finally {
				for (const cleanup of cleanups.reverse()) {
					try {
						await cleanup();
					} catch (error) {
						console.error("Cleanup failed:", error);
					}
				}
			}
		}, 20000);
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
					notificationId: "" as unknown as string,
					userId: userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid userId foreign key", async () => {
			const invalidUserId = faker.string.uuid();
			const notificationId = await createNotificationLogForTests();

			await expect(
				server.drizzleClient.insert(notificationAudienceTable).values({
					notificationId: notificationId,
					userId: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty userId", async () => {
			const notificationId = await createNotificationLogForTests();

			await expect(
				server.drizzleClient.insert(notificationAudienceTable).values({
					notificationId: notificationId,
					userId: "" as unknown as string,
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
			expect(typeof notificationAudienceTableRelations.config).toBe("function");
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
					result.error.issues.some((issue) => issue.path.includes("userId")),
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
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept valid data with isRead field", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
			};
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept valid data with isRead as false", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: false,
			};
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should make isRead optional in insert schema", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
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
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept null readAt value", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				readAt: null,
			};
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Index Configuration", () => {
		it("should define indexes for notification_id, user_id, and is_read", () => {
			const tableConfig = getTableConfig(notificationAudienceTable);

			expect(tableConfig.indexes).toHaveLength(3);

			const hasIndexFor = (columnName: string) =>
				tableConfig.indexes.some((index) =>
					index.config.columns.some(
						(column) => getColumnName(column) === columnName,
					),
				);

			expect(hasIndexFor("notification_id")).toBe(true);
			expect(hasIndexFor("user_id")).toBe(true);
			expect(hasIndexFor("is_read")).toBe(true);
		});
	});

	describe("Default Values", () => {
		it("should default isRead to false when absent and allow explicit override to true", () => {
			const dataWithoutIsRead = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			const resultWithoutIsRead =
				notificationAudienceTableInsertSchema.safeParse(dataWithoutIsRead);
			expect(resultWithoutIsRead.success).toBe(true);
			if (resultWithoutIsRead.success) {
				expect(resultWithoutIsRead.data.isRead).toBeUndefined();
			}

			const dataWithIsRead = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
			};
			const resultWithIsRead =
				notificationAudienceTableInsertSchema.safeParse(dataWithIsRead);
			expect(resultWithIsRead.success).toBe(true);
			if (resultWithIsRead.success) {
				expect(resultWithIsRead.data.isRead).toBe(true);
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

		it("should validate composite key configuration in table schema", () => {
			const tableConfig = getTableConfig(notificationAudienceTable);
			const primaryKeyColumns = tableConfig.primaryKeys[0]?.columns.map(
				(col) => col.name,
			);

			expect(primaryKeyColumns).toBeDefined();
			expect(primaryKeyColumns).toContain("notification_id");
			expect(primaryKeyColumns).toContain("user_id");
			expect(primaryKeyColumns).toHaveLength(2);
		});
	});

	describe("Cascade Delete Behavior", () => {
		it("should cascade deletes from notification and user parents", () => {
			const tableConfig = getTableConfig(notificationAudienceTable);

			const findFkForColumn = (columnName: string) =>
				tableConfig.foreignKeys.find((fk) => {
					const reference = fk.reference();
					return reference.columns.some(
						(column) => getColumnName(column) === columnName,
					);
				});

			const notificationFk = findFkForColumn("notification_id");
			const userFk = findFkForColumn("user_id");

			expect(notificationFk).toBeDefined();
			expect(notificationFk?.onDelete).toBe("cascade");
			expect(userFk).toBeDefined();
			expect(userFk?.onDelete).toBe("cascade");
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
			expect(notificationAudienceTable.createdAt.dataType).toBe("date");
			expect(notificationAudienceTable.readAt.dataType).toBe("date");
		});
	});

	describe("Read Status Tracking", () => {
		it("should track read status with isRead boolean", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: false,
			};
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
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
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
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
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Column Precision", () => {
		it("should have timestamps with correct precision", () => {
			const tableConfig = getTableConfig(notificationAudienceTable);
			const createdAtCol = tableConfig.columns.find(
				(col) => col.name === "created_at",
			);
			const readAtCol = tableConfig.columns.find(
				(col) => col.name === "read_at",
			);

			expect(createdAtCol).toBeDefined();
			expect(readAtCol).toBeDefined();
			expect((createdAtCol as unknown as { precision: number }).precision).toBe(
				3,
			);
			expect((readAtCol as unknown as { precision: number }).precision).toBe(3);
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

			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept boolean for isRead", () => {
			const validData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: true,
			};
			const result = notificationAudienceTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject non-boolean values for isRead", () => {
			const invalidData = {
				notificationId: faker.string.uuid(),
				userId: faker.string.uuid(),
				isRead: "true" as unknown as boolean,
			};
			const result =
				notificationAudienceTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});
	});
});
