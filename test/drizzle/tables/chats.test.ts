import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { eq, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import {
	chatsTable,
	chatsTableInsertSchema,
	chatsTableRelations,
} from "~/src/drizzle/tables/chats";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

/**
 * Tests for chats table definition - validates table schema, relations, insert schema validation,
 * database operations, indexes, and enum constraints.
 * This ensures the chats table is properly configured and all code paths are covered.
 */
describe("src/drizzle/tables/chats.ts - Table Definition Tests", () => {
	/**
	 * Helper function to create a test organization for foreign key references.
	 */
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

		return organizationRow.id;
	}

	/**
	 * Helper function to create a test user for foreign key references.
	 */
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

		return userRow.id;
	}

	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(chatsTable)).toBe("chats");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(chatsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("name");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("description");
			expect(columns).toContain("avatarName");
			expect(columns).toContain("avatarMimeType");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should have correct primary key configuration", () => {
			expect(chatsTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(chatsTable.name.notNull).toBe(true);
			expect(chatsTable.organizationId.notNull).toBe(true);
			expect(chatsTable.createdAt.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(chatsTable.creatorId.notNull).toBe(false);
			expect(chatsTable.updaterId.notNull).toBe(false);
			expect(chatsTable.description.notNull).toBe(false);
			expect(chatsTable.avatarName.notNull).toBe(false);
			expect(chatsTable.avatarMimeType.notNull).toBe(false);
			expect(chatsTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(chatsTable.createdAt.hasDefault).toBe(true);
			expect(chatsTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should have creatorId column defined", () => {
			expect(chatsTable.creatorId).toBeDefined();
		});

		it("should have organizationId column defined", () => {
			expect(chatsTable.organizationId).toBeDefined();
		});

		it("should have updaterId column defined", () => {
			expect(chatsTable.updaterId).toBeDefined();
		});

		it("should reject insert with invalid organizationId foreign key", async () => {
			const invalidOrgId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(chatsTable).values({
					name: faker.lorem.words(3),
					organizationId: invalidOrgId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid creatorId foreign key", async () => {
			const orgId = await createTestOrganization();
			const invalidUserId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(chatsTable).values({
					name: faker.lorem.words(3),
					organizationId: orgId,
					creatorId: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const orgId = await createTestOrganization();
			const invalidUserId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(chatsTable).values({
					name: faker.lorem.words(3),
					organizationId: orgId,
					updaterId: invalidUserId,
				}),
			).rejects.toThrow();
		});
	});

	describe("Table Relations", () => {
		// Type for tracking relation calls
		type RelationCall = {
			type: "one" | "many";
			table: unknown;
			config: unknown;
			withFieldName: (fieldName: string) => RelationCall;
		};

		// Helper to create mock builders that track calls
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
					typeof chatsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof chatsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(chatsTableRelations).toBeDefined();
			expect(typeof chatsTableRelations).toBe("object");
		});

		it("should be associated with chatsTable", () => {
			expect(chatsTableRelations.table).toBe(chatsTable);
		});

		it("should have a config function", () => {
			expect(typeof chatsTableRelations.config).toBe("function");
		});

		it("should define five relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = chatsTableRelations.config({ one, many });

			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.organization).toBeDefined();
			expect(relationsResult.updater).toBeDefined();
			expect(relationsResult.chatMembershipsWhereChat).toBeDefined();
			expect(relationsResult.chatMessagesWhereChat).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = chatsTableRelations.config({ one, many });

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define organization as a one-to-one relation with organizationsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = chatsTableRelations.config({ one, many });

			const organization =
				relationsResult.organization as unknown as RelationCall;
			expect(organization.type).toBe("one");
			expect(organization.table).toBe(organizationsTable);
		});

		it("should define updater as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = chatsTableRelations.config({ one, many });

			const updater = relationsResult.updater as unknown as RelationCall;
			expect(updater.type).toBe("one");
			expect(updater.table).toBe(usersTable);
		});

		it("should define chatMembershipsWhereChat as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = chatsTableRelations.config({ one, many });

			const chatMembershipsWhereChat =
				relationsResult.chatMembershipsWhereChat as unknown as RelationCall;
			expect(chatMembershipsWhereChat.type).toBe("many");
			expect(chatMembershipsWhereChat.table).toBe(chatMembershipsTable);
		});

		it("should define chatMessagesWhereChat as a one-to-many relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = chatsTableRelations.config({ one, many });

			const chatMessagesWhereChat =
				relationsResult.chatMessagesWhereChat as unknown as RelationCall;
			expect(chatMessagesWhereChat.type).toBe("many");
			expect(chatMessagesWhereChat.table).toBe(chatMessagesTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required name field", () => {
			const invalidData = {};
			const result = chatsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject empty name string", () => {
			const invalidData = { name: "" };
			const result = chatsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject name exceeding maximum length", () => {
			const invalidData = { name: "a".repeat(257) };
			const result = chatsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should accept valid name within length constraints", () => {
			const validData = { name: faker.lorem.words(5) };
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept name with exactly minimum length (1 character)", () => {
			const validData = { name: "a" };
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept name with exactly maximum length (256 characters)", () => {
			const validData = { name: "a".repeat(256) };
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject description with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), description: "" };
			const result = chatsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("description"),
					),
				).toBe(true);
			}
		});

		it("should reject description exceeding maximum length", () => {
			const invalidData = {
				name: faker.lorem.words(3),
				description: "a".repeat(2049),
			};
			const result = chatsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("description"),
					),
				).toBe(true);
			}
		});

		it("should accept valid description within length constraints", () => {
			const validData = {
				name: faker.lorem.words(3),
				description: faker.lorem.paragraph(),
			};
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept description as optional", () => {
			const validData = { name: faker.lorem.words(3) };
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept description with exactly minimum length (1 character)", () => {
			const validData = { name: faker.lorem.words(3), description: "a" };
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept description with exactly maximum length (2048 characters)", () => {
			const validData = {
				name: faker.lorem.words(3),
				description: "a".repeat(2048),
			};
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should reject avatarName with length less than minimum when provided", () => {
			const invalidData = { name: faker.lorem.words(3), avatarName: "" };
			const result = chatsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("avatarName"),
					),
				).toBe(true);
			}
		});

		it("should accept valid avatarName", () => {
			const validData = {
				name: faker.lorem.words(3),
				avatarName: faker.string.alphanumeric(10),
			};
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept avatarName as optional", () => {
			const validData = { name: faker.lorem.words(3) };
			const result = chatsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const orgId = await createTestOrganization();
			const chatName = faker.lorem.words(3);

			const [result] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: chatName,
					organizationId: orgId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert chat record");
			}
			expect(result.id).toBeDefined();
			expect(result.name).toBe(chatName);
			expect(result.organizationId).toBe(orgId);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
		});

		it("should successfully insert a record with all optional fields", async () => {
			const orgId = await createTestOrganization();
			const creatorId = await createTestUser();
			const updaterId = await createTestUser();
			const chatName = faker.lorem.words(3);
			const description = faker.lorem.paragraph();
			const avatarName = faker.string.alphanumeric(10);
			const avatarMimeType = "image/png" as const;

			const [result] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: chatName,
					organizationId: orgId,
					creatorId,
					updaterId,
					description,
					avatarName,
					avatarMimeType,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert chat record");
			}
			expect(result.name).toBe(chatName);
			expect(result.organizationId).toBe(orgId);
			expect(result.creatorId).toBe(creatorId);
			expect(result.updaterId).toBe(updaterId);
			expect(result.description).toBe(description);
			expect(result.avatarName).toBe(avatarName);
			expect(result.avatarMimeType).toBe(avatarMimeType);
		});

		it("should successfully insert a record with each valid enum value", async () => {
			const orgId = await createTestOrganization();
			const validMimeTypes: Array<
				"image/avif" | "image/jpeg" | "image/png" | "image/webp"
			> = ["image/avif", "image/jpeg", "image/png", "image/webp"];

			// Test each enum value individually for better test isolation
			for (const mimeType of validMimeTypes) {
				const [result] = await server.drizzleClient
					.insert(chatsTable)
					.values({
						name: `${faker.lorem.words(3)}-${mimeType.replace(/\//g, "-")}`,
						organizationId: orgId,
						avatarMimeType: mimeType,
					})
					.returning();

				expect(result).toBeDefined();
				if (result) {
					expect(result.avatarMimeType).toBe(mimeType);
				}
			}
		});

		it("should successfully query records", async () => {
			const orgId = await createTestOrganization();
			const chatName = faker.lorem.words(3);

			await server.drizzleClient.insert(chatsTable).values({
				name: chatName,
				organizationId: orgId,
			});

			const results = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.name, chatName));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.name).toBe(chatName);
		});

		it("should successfully update a record", async () => {
			const orgId = await createTestOrganization();
			const chatName = faker.lorem.words(3);
			const newName = faker.lorem.words(4);
			const newDescription = faker.lorem.paragraph();

			const [inserted] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: chatName,
					organizationId: orgId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert chat record");
			}
			const chatId = inserted.id;
			const originalUpdatedAt = inserted.updatedAt;

			// Wait a bit to ensure updatedAt changes (database timestamp precision)
			await new Promise((resolve) => setTimeout(resolve, 100));

			const [updated] = await server.drizzleClient
				.update(chatsTable)
				.set({
					name: newName,
					description: newDescription,
				})
				.where(eq(chatsTable.id, chatId))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.name).toBe(newName);
			expect(updated?.description).toBe(newDescription);
			expect(updated?.updatedAt).not.toBeNull();
			if (originalUpdatedAt && updated?.updatedAt) {
				expect(updated.updatedAt.getTime()).toBeGreaterThan(
					originalUpdatedAt.getTime(),
				);
			}
		});

		it("should successfully delete a record", async () => {
			const orgId = await createTestOrganization();
			const chatName = faker.lorem.words(3);

			const [inserted] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: chatName,
					organizationId: orgId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert chat record");
			}
			const chatId = inserted.id;

			const [deleted] = await server.drizzleClient
				.delete(chatsTable)
				.where(eq(chatsTable.id, chatId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(chatId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.id, chatId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should cascade delete when organization is deleted", async () => {
			const orgId = await createTestOrganization();
			const chatName = faker.lorem.words(3);

			const [inserted] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: chatName,
					organizationId: orgId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert chat record");
			}
			const chatId = inserted.id;

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, orgId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.id, chatId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const orgId = await createTestOrganization();
			const creatorId = await createTestUser();
			const chatName = faker.lorem.words(3);

			const [inserted] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: chatName,
					organizationId: orgId,
					creatorId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert chat record");
			}
			expect(inserted.creatorId).toBe(creatorId);
			const chatId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, creatorId));

			const [updated] = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.id, chatId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should set null when updater is deleted", async () => {
			const orgId = await createTestOrganization();
			const updaterId = await createTestUser();
			const chatName = faker.lorem.words(3);

			const [inserted] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: chatName,
					organizationId: orgId,
					updaterId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert chat record");
			}
			expect(inserted.updaterId).toBe(updaterId);
			const chatId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, updaterId));

			const [updated] = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.id, chatId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.updaterId).toBeNull();
		});
	});

	describe("Index Configuration", () => {
		it("should have indexed columns present (creatorId, name, organizationId, updaterId)", () => {
			// Verify that columns that should be indexed exist in the table definition
			// Note: This test verifies column presence, not actual index metadata
			// Drizzle doesn't expose index metadata directly, but indexes are defined
			// in the table definition's second parameter
			const tableDefinition = chatsTable;
			expect(tableDefinition).toBeDefined();

			// Assert that the columns that should be indexed are present
			expect(tableDefinition.creatorId).toBeDefined();
			expect(tableDefinition.name).toBeDefined();
			expect(tableDefinition.organizationId).toBeDefined();
			expect(tableDefinition.updaterId).toBeDefined();
		});

		it("should efficiently query using indexed creatorId column", async () => {
			const orgId = await createTestOrganization();
			const creatorId = await createTestUser();
			const chatName = faker.lorem.words(3);

			await server.drizzleClient.insert(chatsTable).values({
				name: chatName,
				organizationId: orgId,
				creatorId,
			});

			const results = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.creatorId, creatorId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed name column", async () => {
			const orgId = await createTestOrganization();
			const chatName = faker.lorem.words(3);

			await server.drizzleClient.insert(chatsTable).values({
				name: chatName,
				organizationId: orgId,
			});

			const results = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.name, chatName));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed organizationId column", async () => {
			const orgId = await createTestOrganization();
			const chatName = faker.lorem.words(3);

			await server.drizzleClient.insert(chatsTable).values({
				name: chatName,
				organizationId: orgId,
			});

			const results = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.organizationId, orgId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed updaterId column", async () => {
			const orgId = await createTestOrganization();
			const updaterId = await createTestUser();
			const chatName = faker.lorem.words(3);

			await server.drizzleClient.insert(chatsTable).values({
				name: chatName,
				organizationId: orgId,
				updaterId,
			});

			const results = await server.drizzleClient
				.select()
				.from(chatsTable)
				.where(eq(chatsTable.updaterId, updaterId));

			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe("Enum Constraints", () => {
		it("should accept valid enum values for avatarMimeType", () => {
			const validMimeTypes: Array<
				"image/avif" | "image/jpeg" | "image/png" | "image/webp"
			> = ["image/avif", "image/jpeg", "image/png", "image/webp"];

			for (const mimeType of validMimeTypes) {
				const result = imageMimeTypeEnum.safeParse(mimeType);
				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid enum values for avatarMimeType", () => {
			const invalidMimeTypes = [
				"image/gif",
				"image/svg+xml",
				"application/pdf",
				"text/html",
				"",
			];

			for (const mimeType of invalidMimeTypes) {
				const result = imageMimeTypeEnum.safeParse(mimeType);
				expect(result.success).toBe(false);
			}
		});

		it("should validate enum values in insert schema", async () => {
			const orgId = await createTestOrganization();
			const validMimeType = "image/png" as const;

			const [result] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: faker.lorem.words(3),
					organizationId: orgId,
					avatarMimeType: validMimeType,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.avatarMimeType).toBe(validMimeType);
			}
		});

		it("should validate avatarMimeType at schema level", () => {
			// The imageMimeTypeEnum schema should reject invalid values
			const invalidMimeType = "invalid/mime-type";
			const result = imageMimeTypeEnum.safeParse(invalidMimeType);
			expect(result.success).toBe(false);
		});

		it("should handle null values for optional enum fields", async () => {
			const orgId = await createTestOrganization();

			const [result] = await server.drizzleClient
				.insert(chatsTable)
				.values({
					name: faker.lorem.words(3),
					organizationId: orgId,
					avatarMimeType: null,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.avatarMimeType).toBeNull();
			}
		});
	});
});
