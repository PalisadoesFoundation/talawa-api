import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { eq, getTableName, inArray, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	chatMessagesTable,
	chatMessagesTableInsertSchema,
	chatMessagesTableRelations,
} from "~/src/drizzle/tables/chatMessages";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

/**
 * Helper function to get column name from a column object.
 */
const getColumnName = (col: unknown): string | undefined => {
	if (col && typeof col === "object" && "name" in col) {
		return col.name as string;
	}
	return undefined;
};

/**
 * Tests for chatMessages table definition - validates table schema, relations,
 * insert schema validation, foreign keys, indexes, and database operations.
 * Goal: 100% code coverage for src/drizzle/tables/chatMessages.ts.
 */
describe("Table Definition Tests", () => {
	const createdIds = {
		organizations: [] as string[],
		users: [] as string[],
		chats: [] as string[],
		messages: [] as string[],
	};

	function recordMessageId(message?: { id?: string | null }) {
		if (message?.id) {
			createdIds.messages.push(message.id);
		}
	}

	async function createTestOrganization() {
		const [organizationRow] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `${faker.company.name()}-${faker.string.uuid()}`,
				countryCode: "us",
				userRegistrationRequired: false,
			})
			.returning({ id: organizationsTable.id });

		if (!organizationRow?.id) {
			throw new Error("Failed to create test organization");
		}

		createdIds.organizations.push(organizationRow.id);
		return organizationRow.id;
	}

	async function createTestUser() {
		const testEmail = `test.user.${faker.string.ulid()}@email.com`;
		const testPassword = "password";
		const hashedPassword = await hash(testPassword);

		const [userRow] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: testEmail,
				passwordHash: hashedPassword,
				role: "regular",
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
			})
			.returning({ id: usersTable.id });

		if (!userRow?.id) {
			throw new Error("Failed to create test user");
		}

		createdIds.users.push(userRow.id);
		return userRow.id;
	}

	async function createTestChat(organizationId: string, creatorId: string) {
		const [chatRow] = await server.drizzleClient
			.insert(chatsTable)
			.values({
				name: faker.lorem.words(3),
				organizationId,
				creatorId,
			})
			.returning({ id: chatsTable.id });

		if (!chatRow?.id) {
			throw new Error("Failed to create test chat");
		}

		createdIds.chats.push(chatRow.id);
		return chatRow.id;
	}

	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(chatMessagesTable)).toBe("chat_messages");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(chatMessagesTable);
			expect(columns).toContain("id");
			expect(columns).toContain("body");
			expect(columns).toContain("chatId");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("parentMessageId");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should have correct primary key configuration", () => {
			expect(chatMessagesTable.id.primary).toBe(true);
		});

		it("should have body as required text field", () => {
			expect(chatMessagesTable.body).toBeDefined();
			expect(chatMessagesTable.body.notNull).toBe(true);
			expect(chatMessagesTable.body.name).toBe("body");
		});

		it("should have chatId with foreign key to chats table", () => {
			expect(chatMessagesTable.chatId).toBeDefined();
			expect(chatMessagesTable.chatId.notNull).toBe(true);
			expect(chatMessagesTable.chatId.name).toBe("chat_id");
		});

		it("should have creatorId as optional foreign key to users table", () => {
			expect(chatMessagesTable.creatorId).toBeDefined();
			expect(chatMessagesTable.creatorId.notNull).toBe(false);
			expect(chatMessagesTable.creatorId.name).toBe("creator_id");
		});

		it("should have parentMessageId with self-referencing foreign key", () => {
			expect(chatMessagesTable.parentMessageId).toBeDefined();
			expect(chatMessagesTable.parentMessageId.notNull).toBe(false);
			expect(chatMessagesTable.parentMessageId.name).toBe("parent_message_id");
		});

		it("should have id as primary key with default", () => {
			expect(chatMessagesTable.id).toBeDefined();
			expect(chatMessagesTable.id.primary).toBe(true);
			expect(chatMessagesTable.id.hasDefault).toBe(true);
			expect(chatMessagesTable.id.name).toBe("id");
		});

		it("should have createdAt with default now", () => {
			expect(chatMessagesTable.createdAt).toBeDefined();
			expect(chatMessagesTable.createdAt.notNull).toBe(true);
			expect(chatMessagesTable.createdAt.hasDefault).toBe(true);
			expect(chatMessagesTable.createdAt.name).toBe("created_at");
		});

		it("should have updatedAt with default function", () => {
			expect(chatMessagesTable.updatedAt).toBeDefined();
			expect(chatMessagesTable.updatedAt.hasDefault).toBe(true);
			expect(chatMessagesTable.updatedAt.name).toBe("updated_at");
		});
	});

	describe("Foreign Key Relationships", () => {
		const tableConfig = getTableConfig(chatMessagesTable);

		it("should have exactly three foreign keys defined", () => {
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(Array.isArray(tableConfig.foreignKeys)).toBe(true);
			expect(tableConfig.foreignKeys.length).toBe(3);
		});

		it("should have foreign key from chatId to chats", () => {
			const chatFk = tableConfig.foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => getColumnName(col) === "chat_id");
			});
			expect(chatFk).toBeDefined();
			const ref = chatFk?.reference();
			expect(ref?.foreignTable).toBe(chatsTable);
		});

		it("should have foreign key from creatorId to users", () => {
			const creatorFk = tableConfig.foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => getColumnName(col) === "creator_id");
			});
			expect(creatorFk).toBeDefined();
			const ref = creatorFk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
		});

		it("should have foreign key from parentMessageId to chat_messages (self)", () => {
			const parentFk = tableConfig.foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some(
					(col) => getColumnName(col) === "parent_message_id",
				);
			});
			expect(parentFk).toBeDefined();
			const ref = parentFk?.reference();
			expect(ref?.foreignTable).toBe(chatMessagesTable);
		});
	});

	describe("Table Relations", () => {
		interface CapturedRelation {
			table: Table;
			config?: {
				relationName?: string;
				fields?: unknown[];
				references?: unknown[];
			};
		}

		interface MockRelationHelpers {
			one: (
				table: Table,
				config?: CapturedRelation["config"],
			) => { withFieldName: () => object };
			many: (
				table: Table,
				config?: CapturedRelation["config"],
			) => { withFieldName: () => object };
		}

		let capturedRelations: Record<string, CapturedRelation> = {};

		beforeAll(() => {
			capturedRelations = {};
			(
				chatMessagesTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName === "chat_messages.chat_id:chats.id") {
						capturedRelations.chat = { table, config };
					}
					if (config?.relationName === "chat_messages.creator_id:users.id") {
						capturedRelations.creator = { table, config };
					}
					if (
						config?.relationName ===
						"chat_messages.parent_message_id:chat_messages.id"
					) {
						capturedRelations.parentMessage = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (table: Table, config?: CapturedRelation["config"]) => {
					if (
						config?.relationName ===
						"chat_messages.parent_message_id:chat_messages.id"
					) {
						capturedRelations.chatMessagesWhereParentMessage = {
							table,
							config,
						};
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined", () => {
			expect(chatMessagesTableRelations).toBeDefined();
		});

		it("should have the correct table reference", () => {
			expect(chatMessagesTableRelations.table).toBe(chatMessagesTable);
		});

		it("should have config function defined", () => {
			expect(typeof chatMessagesTableRelations.config).toBe("function");
		});

		it("should define chat relation (many-to-one to chats)", () => {
			expect(capturedRelations.chat).toBeDefined();
			expect(getTableName(capturedRelations.chat?.table as Table)).toBe(
				"chats",
			);
			expect(capturedRelations.chat?.config?.fields?.[0]).toBe(
				chatMessagesTable.chatId,
			);
		});

		it("should define creator relation (many-to-one to users)", () => {
			expect(capturedRelations.creator).toBeDefined();
			expect(getTableName(capturedRelations.creator?.table as Table)).toBe(
				"users",
			);
			expect(capturedRelations.creator?.config?.fields?.[0]).toBe(
				chatMessagesTable.creatorId,
			);
		});

		it("should define parentMessage relation (many-to-one self-reference)", () => {
			expect(capturedRelations.parentMessage).toBeDefined();
			expect(
				getTableName(capturedRelations.parentMessage?.table as Table),
			).toBe("chat_messages");
			expect(capturedRelations.parentMessage?.config?.fields?.[0]).toBe(
				chatMessagesTable.parentMessageId,
			);
		});

		it("should define chatMessagesWhereParentMessage relation (one-to-many)", () => {
			expect(capturedRelations.chatMessagesWhereParentMessage).toBeDefined();
			expect(
				getTableName(
					capturedRelations.chatMessagesWhereParentMessage?.table as Table,
				),
			).toBe("chat_messages");
		});
	});

	describe("Insert Schema Validation", () => {
		const validChatId = faker.string.uuid();

		it("should validate body field minimum length (1)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "",
				chatId: validChatId,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("body")),
				).toBe(true);
			}
		});

		it("should validate body field maximum length (2048)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "a".repeat(2049),
				chatId: validChatId,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("body")),
				).toBe(true);
			}
		});

		it("should accept body with exactly minimum length (1 character)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "a",
				chatId: validChatId,
			});
			expect(result.success).toBe(true);
		});

		it("should accept body with exactly maximum length (2048 characters)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "a".repeat(2048),
				chatId: validChatId,
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid data with required fields only", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "This is a valid message",
				chatId: validChatId,
			});
			expect(result.success).toBe(true);
		});

		it("should reject data without required body field", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				chatId: validChatId,
			});
			expect(result.success).toBe(false);
		});

		it("should reject data without required chatId field", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message without chat",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid chatId (non-UUID)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Valid body",
				chatId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should accept valid data with optional creatorId", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message with creator",
				chatId: validChatId,
				creatorId: faker.string.uuid(),
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid data with optional parentMessageId", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Reply message",
				chatId: validChatId,
				parentMessageId: faker.string.uuid(),
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid data with optional id", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message with id",
				chatId: validChatId,
				id: faker.string.uuid(),
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid data with all optional fields", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Full message",
				chatId: validChatId,
				creatorId: faker.string.uuid(),
				parentMessageId: faker.string.uuid(),
			});
			expect(result.success).toBe(true);
		});

		it("should accept creatorId as null", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message",
				chatId: validChatId,
				creatorId: null,
			});
			expect(result.success).toBe(true);
		});

		it("should accept parentMessageId as null", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message",
				chatId: validChatId,
				parentMessageId: null,
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid creatorId (non-UUID)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message",
				chatId: validChatId,
				creatorId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid parentMessageId (non-UUID)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message",
				chatId: validChatId,
				parentMessageId: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should reject invalid id (non-UUID)", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Message",
				chatId: validChatId,
				id: "not-a-uuid",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a chat message record", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [result] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: "Test message",
					chatId,
					creatorId: userId,
				})
				.returning();

			recordMessageId(result);
			expect(result).toBeDefined();
			if (!result) throw new Error("Insert failed");
			expect(result.id).toBeDefined();
			expect(result.body).toBe("Test message");
			expect(result.chatId).toBe(chatId);
			expect(result.creatorId).toBe(userId);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
		});

		it("should generate unique id for each message using uuidv7", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [message1] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Message 1", chatId })
				.returning();

			const [message2] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Message 2", chatId })
				.returning();

			recordMessageId(message1);
			recordMessageId(message2);
			expect(message1?.id).toBeDefined();
			expect(message2?.id).toBeDefined();
			expect(message1?.id).not.toBe(message2?.id);
		});

		it("should set createdAt to current timestamp by default", async () => {
			const beforeInsert = new Date();
			const SKEW_MS = 5 * 60 * 1000; // tolerate up to 5 minutes clock skew
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [result] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Test message", chatId })
				.returning();

			recordMessageId(result);
			const afterInsert = new Date();
			expect(result?.createdAt).toBeInstanceOf(Date);
			expect(result?.createdAt.getTime()).toBeGreaterThanOrEqual(
				beforeInsert.getTime() - SKEW_MS,
			);
			expect(result?.createdAt.getTime()).toBeLessThanOrEqual(
				afterInsert.getTime() + SKEW_MS,
			);
		});

		it("should set updatedAt to null by default", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [result] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Test message", chatId })
				.returning();

			recordMessageId(result);
			expect(result?.updatedAt).toBeNull();
		});

		it("should successfully query chat messages", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [inserted] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Query test message", chatId })
				.returning();

			recordMessageId(inserted);
			const results = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, inserted?.id ?? ""));

			expect(results).toHaveLength(1);
			expect(results[0]?.id).toBe(inserted?.id);
			expect(results[0]?.body).toBe("Query test message");
		});

		it("should successfully update a chat message and set updatedAt", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [inserted] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Original message", chatId })
				.returning();

			recordMessageId(inserted);
			const [updated] = await server.drizzleClient
				.update(chatMessagesTable)
				.set({ body: "Updated message" })
				.where(eq(chatMessagesTable.id, inserted?.id ?? ""))
				.returning();

			expect(updated?.body).toBe("Updated message");
			expect(updated?.updatedAt).toBeInstanceOf(Date);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a chat message", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [inserted] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Message to delete", chatId })
				.returning();

			recordMessageId(inserted);
			const [deleted] = await server.drizzleClient
				.delete(chatMessagesTable)
				.where(eq(chatMessagesTable.id, inserted?.id ?? ""))
				.returning();

			expect(deleted?.id).toBe(inserted?.id);

			const results = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, inserted?.id ?? ""));

			expect(results).toHaveLength(0);
		});

		it("should support parentMessageId self-reference", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [parentMessage] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Parent message", chatId })
				.returning();

			const [replyMessage] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: "Reply message",
					chatId,
					parentMessageId: parentMessage?.id ?? null,
				})
				.returning();

			recordMessageId(parentMessage);
			recordMessageId(replyMessage);
			expect(replyMessage?.parentMessageId).toBe(parentMessage?.id);
		});

		it("should cascade delete messages when chat is deleted", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [messageRow] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Message in chat", chatId })
				.returning();

			recordMessageId(messageRow);
			await server.drizzleClient
				.delete(chatsTable)
				.where(eq(chatsTable.id, chatId));

			const results = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, messageRow?.id ?? ""));

			expect(results).toHaveLength(0);
		});

		it("should set creatorId to null when user is deleted", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [messageRow] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: "Message with creator",
					chatId,
					creatorId: userId,
				})
				.returning();

			recordMessageId(messageRow);
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [result] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, messageRow?.id ?? ""));

			expect(result).toBeDefined();
			expect(result?.creatorId).toBeNull();
		});

		it("should set parentMessageId to null when parent message is deleted", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [parentMessage] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Parent message", chatId })
				.returning();

			const [replyMessage] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: "Reply message",
					chatId,
					parentMessageId: parentMessage?.id ?? null,
				})
				.returning();

			recordMessageId(parentMessage);
			recordMessageId(replyMessage);
			await server.drizzleClient
				.delete(chatMessagesTable)
				.where(eq(chatMessagesTable.id, parentMessage?.id ?? ""));

			const [result] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, replyMessage?.id ?? ""));

			expect(result).toBeDefined();
			expect(result?.parentMessageId).toBeNull();
		});

		it("should reject insert with invalid chatId foreign key", async () => {
			const invalidChatId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(chatMessagesTable).values({
					body: "Message",
					chatId: invalidChatId,
				}),
			).rejects.toThrow();
		});

		it("should cascade update chatId when chat id is updated", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [messageRow] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Message", chatId })
				.returning();

			recordMessageId(messageRow);
			const newChatId = faker.string.uuid();

			// Update the chat's ID
			await server.drizzleClient
				.update(chatsTable)
				.set({ id: newChatId })
				.where(eq(chatsTable.id, chatId));

			// Fetch the message to verify cascading update
			const [result] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, messageRow?.id ?? ""));

			expect(result?.chatId).toBe(newChatId);
		});

		it("should cascade update creatorId when user id is updated", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [messageRow] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: "Message",
					chatId,
					creatorId: userId,
				})
				.returning();

			recordMessageId(messageRow);
			const newUserId = faker.string.uuid();

			await server.drizzleClient
				.update(usersTable)
				.set({ id: newUserId })
				.where(eq(usersTable.id, userId));

			const [result] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, messageRow?.id ?? ""));

			expect(result?.creatorId).toBe(newUserId);
		});

		it("should cascade update parentMessageId when parent message id is updated", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();
			const chatId = await createTestChat(orgId, userId);

			const [parentMessage] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "Parent", chatId })
				.returning();

			const [replyMessage] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: "Reply",
					chatId,
					parentMessageId: parentMessage?.id ?? null,
				})
				.returning();

			recordMessageId(parentMessage);
			recordMessageId(replyMessage);
			const newParentId = faker.string.uuid();

			await server.drizzleClient
				.update(chatMessagesTable)
				.set({ id: newParentId })
				.where(eq(chatMessagesTable.id, parentMessage?.id ?? ""));

			const [result] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, replyMessage?.id ?? ""));

			expect(result?.parentMessageId).toBe(newParentId);
		});
	});

	describe("Index Configuration", () => {
		const tableConfig = getTableConfig(chatMessagesTable);

		it("should have indexes defined", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
		});

		it("should have exactly four indexes", () => {
			expect(tableConfig.indexes.length).toBe(4);
		});

		it("should have index on chatId", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					i.config.columns.length === 1 &&
					getColumnName(i.config.columns[0]) === "chat_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on createdAt", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					i.config.columns.length === 1 &&
					getColumnName(i.config.columns[0]) === "created_at",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on creatorId", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					i.config.columns.length === 1 &&
					getColumnName(i.config.columns[0]) === "creator_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on parentMessageId", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					i.config.columns.length === 1 &&
					getColumnName(i.config.columns[0]) === "parent_message_id",
			);
			expect(idx).toBeDefined();
		});
	});

	afterAll(async () => {
		// Clean up in reverse dependency order
		if (createdIds.messages.length > 0) {
			await server.drizzleClient
				.delete(chatMessagesTable)
				.where(inArray(chatMessagesTable.id, createdIds.messages));
		}

		if (createdIds.chats.length > 0) {
			await server.drizzleClient
				.delete(chatsTable)
				.where(inArray(chatsTable.id, createdIds.chats));
		}

		if (createdIds.users.length > 0) {
			await server.drizzleClient
				.delete(usersTable)
				.where(inArray(usersTable.id, createdIds.users));
		}

		if (createdIds.organizations.length > 0) {
			await server.drizzleClient
				.delete(organizationsTable)
				.where(inArray(organizationsTable.id, createdIds.organizations));
		}
	});
});
