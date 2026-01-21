import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { eq, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
	chatMessagesTable,
	chatMessagesTableInsertSchema,
	chatMessagesTableRelations,
} from "~/src/drizzle/tables/chatMessages";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

describe("src/drizzle/tables/chatMessages.ts", () => {
	async function createTestOrganization() {
		const [row] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `${faker.company.name()}-${faker.string.uuid()}`,
				countryCode: "us",
				userRegistrationRequired: false,
			})
			.returning({ id: organizationsTable.id });
		if (!row?.id) throw new Error("Failed to create test organization");
		return row.id;
	}

	async function createTestUser() {
		const [row] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: `test.${faker.string.ulid()}@email.com`,
				passwordHash: await hash("password"),
				role: "regular",
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
			})
			.returning({ id: usersTable.id });
		if (!row?.id) throw new Error("Failed to create test user");
		return row.id;
	}

	async function createTestChat() {
		const orgId = await createTestOrganization();
		const [row] = await server.drizzleClient
			.insert(chatsTable)
			.values({ name: faker.lorem.words(3), organizationId: orgId })
			.returning({ id: chatsTable.id });
		if (!row?.id) throw new Error("Failed to create test chat");
		return row.id;
	}

	describe("Table Schema", () => {
		it("should have correct table name and columns", () => {
			expect(getTableName(chatMessagesTable)).toBe("chat_messages");
			const columns = Object.keys(chatMessagesTable);
			for (const col of [
				"id",
				"body",
				"chatId",
				"creatorId",
				"parentMessageId",
				"createdAt",
				"updatedAt",
			]) {
				expect(columns).toContain(col);
			}
		});

		it("should have correct column configurations", () => {
			expect(chatMessagesTable.id.primary).toBe(true);
			expect(chatMessagesTable.body.notNull).toBe(true);
			expect(chatMessagesTable.chatId.notNull).toBe(true);
			expect(chatMessagesTable.createdAt.notNull).toBe(true);
			expect(chatMessagesTable.creatorId.notNull).toBe(false);
			expect(chatMessagesTable.parentMessageId.notNull).toBe(false);
			expect(chatMessagesTable.updatedAt.notNull).toBe(false);
			expect(chatMessagesTable.createdAt.hasDefault).toBe(true);
			expect(chatMessagesTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid foreign keys", async () => {
			const chatId = await createTestChat();

			await expect(
				server.drizzleClient.insert(chatMessagesTable).values({
					body: faker.lorem.sentence(),
					chatId: faker.string.uuid(),
				}),
			).rejects.toThrow();

			await expect(
				server.drizzleClient.insert(chatMessagesTable).values({
					body: faker.lorem.sentence(),
					chatId,
					creatorId: faker.string.uuid(),
				}),
			).rejects.toThrow();

			await expect(
				server.drizzleClient.insert(chatMessagesTable).values({
					body: faker.lorem.sentence(),
					chatId,
					parentMessageId: faker.string.uuid(),
				}),
			).rejects.toThrow();
		});
	});

	describe("Table Relations", () => {
		it("should define all relations correctly", () => {
			expect(chatMessagesTableRelations).toBeDefined();
			expect(chatMessagesTableRelations.table).toBe(chatMessagesTable);
			expect(typeof chatMessagesTableRelations.config).toBe("function");

			type RelationCall = {
				type: "one" | "many";
				table: unknown;
				withFieldName: () => RelationCall;
			};
			const one = (table: unknown): RelationCall => {
				const r: RelationCall = { type: "one", table, withFieldName: () => r };
				return r;
			};
			const many = (table: unknown): RelationCall => {
				const r: RelationCall = { type: "many", table, withFieldName: () => r };
				return r;
			};
			const mockBuilders = {
				one: one as unknown as Parameters<
					typeof chatMessagesTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof chatMessagesTableRelations.config
				>[0]["many"],
			};

			const relations = chatMessagesTableRelations.config(mockBuilders);

			expect((relations.chat as unknown as RelationCall).type).toBe("one");
			expect((relations.chat as unknown as RelationCall).table).toBe(
				chatsTable,
			);
			expect((relations.creator as unknown as RelationCall).type).toBe("one");
			expect((relations.creator as unknown as RelationCall).table).toBe(
				usersTable,
			);
			expect((relations.parentMessage as unknown as RelationCall).type).toBe(
				"one",
			);
			expect((relations.parentMessage as unknown as RelationCall).table).toBe(
				chatMessagesTable,
			);
			expect(
				(relations.chatMessagesWhereParentMessage as unknown as RelationCall)
					.type,
			).toBe("many");
			expect(
				(relations.chatMessagesWhereParentMessage as unknown as RelationCall)
					.table,
			).toBe(chatMessagesTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required fields", () => {
			expect(chatMessagesTableInsertSchema.safeParse({}).success).toBe(false);
			expect(
				chatMessagesTableInsertSchema.safeParse({ chatId: faker.string.uuid() })
					.success,
			).toBe(false);
			expect(
				chatMessagesTableInsertSchema.safeParse({ body: "test" }).success,
			).toBe(false);
		});

		it("should validate body length constraints", () => {
			const chatId = faker.string.uuid();
			expect(
				chatMessagesTableInsertSchema.safeParse({ body: "", chatId }).success,
			).toBe(false);
			expect(
				chatMessagesTableInsertSchema.safeParse({
					body: "a".repeat(2049),
					chatId,
				}).success,
			).toBe(false);
			expect(
				chatMessagesTableInsertSchema.safeParse({ body: "a", chatId }).success,
			).toBe(true);
			expect(
				chatMessagesTableInsertSchema.safeParse({
					body: "a".repeat(2048),
					chatId,
				}).success,
			).toBe(true);
		});

		it("should validate UUID formats", () => {
			const body = faker.lorem.sentence();
			const validUuid = faker.string.uuid();

			expect(
				chatMessagesTableInsertSchema.safeParse({ body, chatId: "invalid" })
					.success,
			).toBe(false);
			expect(
				chatMessagesTableInsertSchema.safeParse({
					body,
					chatId: validUuid,
					creatorId: "invalid",
				}).success,
			).toBe(false);
			expect(
				chatMessagesTableInsertSchema.safeParse({
					body,
					chatId: validUuid,
					parentMessageId: "invalid",
				}).success,
			).toBe(false);
			expect(
				chatMessagesTableInsertSchema.safeParse({
					body,
					chatId: validUuid,
					id: validUuid,
				}).success,
			).toBe(true);
		});

		it("should accept valid data with optional fields", () => {
			const result = chatMessagesTableInsertSchema.safeParse({
				body: "Valid message",
				chatId: faker.string.uuid(),
			});
			expect(result.success).toBe(true);
			if (result.success) expect(result.data.body).toBe("Valid message");
		});
	});

	describe("Database Operations", () => {
		it("should insert, query, update, and delete records", async () => {
			const chatId = await createTestChat();
			const creatorId = await createTestUser();
			const body = faker.lorem.sentence();

			// Insert with required fields
			const [inserted] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body, chatId })
				.returning();
			expect(inserted?.id).toBeDefined();
			expect(inserted?.body).toBe(body);
			expect(inserted?.createdAt).toBeInstanceOf(Date);
			expect(inserted?.updatedAt).toBeNull();

			// Insert with all fields (parent message)
			const [withOptional] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: "reply",
					chatId,
					creatorId,
					parentMessageId: inserted?.id,
				})
				.returning();
			expect(withOptional?.creatorId).toBe(creatorId);
			expect(withOptional?.parentMessageId).toBe(inserted?.id);

			// Query
			const results = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.body, body));
			expect(results.length).toBeGreaterThan(0);

			// Update
			const [updated] = await server.drizzleClient
				.update(chatMessagesTable)
				.set({ body: "updated" })
				.where(eq(chatMessagesTable.id, inserted?.id as string))
				.returning();
			expect(updated?.body).toBe("updated");
			expect(updated?.updatedAt).not.toBeNull();

			// Delete
			const [deleted] = await server.drizzleClient
				.delete(chatMessagesTable)
				.where(eq(chatMessagesTable.id, inserted?.id as string))
				.returning();
			expect(deleted?.id).toBe(inserted?.id);
		});

		it("should cascade delete when chat is deleted", async () => {
			const chatId = await createTestChat();
			const [msg] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "test", chatId })
				.returning();

			await server.drizzleClient
				.delete(chatsTable)
				.where(eq(chatsTable.id, chatId));

			const [found] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, msg?.id as string));
			expect(found).toBeUndefined();
		});

		it("should set null when creator or parent message is deleted", async () => {
			const chatId = await createTestChat();
			const creatorId = await createTestUser();

			// Test creator deletion
			const [msg1] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "test", chatId, creatorId })
				.returning();
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, creatorId));
			const [afterCreatorDelete] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, msg1?.id as string));
			expect(afterCreatorDelete?.creatorId).toBeNull();

			// Test parent message deletion
			const [parent] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "parent", chatId })
				.returning();
			const [child] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "child", chatId, parentMessageId: parent?.id })
				.returning();
			await server.drizzleClient
				.delete(chatMessagesTable)
				.where(eq(chatMessagesTable.id, parent?.id as string));
			const [afterParentDelete] = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.id, child?.id as string));
			expect(afterParentDelete?.parentMessageId).toBeNull();
		});

		it("should handle self-referential relationships", async () => {
			const chatId = await createTestChat();
			const [parent] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "parent", chatId })
				.returning();

			await Promise.all(
				[1, 2, 3].map((i) =>
					server.drizzleClient.insert(chatMessagesTable).values({
						body: `child ${i}`,
						chatId,
						parentMessageId: parent?.id,
					}),
				),
			);

			const children = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.parentMessageId, parent?.id as string));
			expect(children.length).toBe(3);
		});
	});

	describe("Index Configuration", () => {
		it("should have indexed columns and support efficient queries", async () => {
			expect(chatMessagesTable.chatId).toBeDefined();
			expect(chatMessagesTable.createdAt).toBeDefined();
			expect(chatMessagesTable.creatorId).toBeDefined();
			expect(chatMessagesTable.parentMessageId).toBeDefined();

			const chatId = await createTestChat();
			const creatorId = await createTestUser();
			const [parent] = await server.drizzleClient
				.insert(chatMessagesTable)
				.values({ body: "parent", chatId })
				.returning();
			await server.drizzleClient.insert(chatMessagesTable).values({
				body: "child",
				chatId,
				creatorId,
				parentMessageId: parent?.id,
			});

			// Test indexed queries
			const byChatId = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.chatId, chatId));
			expect(byChatId.length).toBeGreaterThan(0);

			const byCreatorId = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.creatorId, creatorId));
			expect(byCreatorId.length).toBeGreaterThan(0);

			const byParentId = await server.drizzleClient
				.select()
				.from(chatMessagesTable)
				.where(eq(chatMessagesTable.parentMessageId, parent?.id as string));
			expect(byParentId.length).toBeGreaterThan(0);
		});
	});
});
