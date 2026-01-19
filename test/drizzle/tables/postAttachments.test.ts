import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { describe, expect, it } from "vitest";
import { postsTable, usersTable } from "~/src/drizzle/schema";
import {
	postAttachmentsTable,
	postAttachmentsTableInsertSchema,
	postAttachmentsTableRelations,
} from "~/src/drizzle/tables/postAttachments";
import { server } from "../../server";

/*
 * Tests for the postAttachments table and its relations.
 * Test validates table schema, insertion, and relations.
 * database operations, indexes.
 */

async function createTestOrganization(): Promise<string> {
	// Clear any existing headers to ensure a clean sign-in
	mercuriusClient.setHeaders({});
	const signIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (signIn.errors) {
		throw new Error(`Admin sign-in failed: ${JSON.stringify(signIn.errors)}`);
	}
	const token = signIn.data?.signIn?.authenticationToken;
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

async function createTestPost(): Promise<string> {
	const { userId } = await createRegularUserUsingAdmin();
	const postResult = await server.drizzleClient
		.insert(postsTable)
		.values({
			caption: "Test Post Caption",
			body: "This is the body of the test post.",
			creatorId: userId,
			organizationId: await createTestOrganization(),
		})
		.returning({ id: postsTable.id });
	const postId = postResult[0]?.id;
	assertToBeNonNullish(postId, "Post ID is missing from creation response");
	return postId;
}

describe("src/drizzle/tables/postAttachments", () => {
	describe("PostAttachments Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(postAttachmentsTable);
			expect(columns).toContain("createdAt");
			expect(columns).toContain("id");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("postId");
			expect(columns).toContain("mimeType");
			expect(columns).toContain("name");
			expect(columns).toContain("objectName");
			expect(columns).toContain("fileHash");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have correct primary key configuration", () => {
			expect(postAttachmentsTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(postAttachmentsTable.createdAt.notNull).toBe(true);
			expect(postAttachmentsTable.postId.notNull).toBe(true);
			expect(postAttachmentsTable.mimeType.notNull).toBe(true);
			expect(postAttachmentsTable.name.notNull).toBe(true);
			expect(postAttachmentsTable.objectName.notNull).toBe(true);
			expect(postAttachmentsTable.fileHash.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(postAttachmentsTable.updaterId.notNull).toBe(false);
			expect(postAttachmentsTable.creatorId.notNull).toBe(false);
			expect(postAttachmentsTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(postAttachmentsTable.createdAt.hasDefault).toBe(true);
			expect(postAttachmentsTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
			const validPostId = await createTestPost();
			await expect(
				server.drizzleClient.insert(postAttachmentsTable).values({
					name: "testfile.txt",
					creatorId: invalidCreatorId,
					mimeType: "image/png",
					objectName: "testfileobject",
					fileHash: "somehashvalue",
					postId: validPostId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const invalidUpdaterId = faker.string.uuid();
			const validPostId = await createTestPost();
			await expect(
				server.drizzleClient.insert(postAttachmentsTable).values({
					name: "testfile.txt",
					updaterId: invalidUpdaterId,
					mimeType: "image/png",
					objectName: "testfileobject",
					fileHash: "somehashvalue",
					postId: validPostId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid postId foreign key", async () => {
			const invalidPostId = faker.string.uuid();
			const validCreatorId = await createRegularUserUsingAdmin();
			await expect(
				server.drizzleClient.insert(postAttachmentsTable).values({
					name: "testfile.txt",
					creatorId: validCreatorId.userId,
					mimeType: "image/png",
					objectName: "testfileobject",
					fileHash: "somehashvalue",
					postId: invalidPostId,
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
					typeof postAttachmentsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof postAttachmentsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(postAttachmentsTableRelations).toBeDefined();
			expect(typeof postAttachmentsTableRelations).toBe("object");
		});

		it("should be associated with postAttachmentsTable", () => {
			expect(postAttachmentsTableRelations.table).toBe(postAttachmentsTable);
		});

		it("should have a config function", () => {
			expect(typeof postAttachmentsTableRelations.config).toBe("function");
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = postAttachmentsTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.updater).toBeDefined();
			expect(relationsResult.post).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = postAttachmentsTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define updater as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = postAttachmentsTableRelations.config({
				one,
				many,
			});

			const updater = relationsResult.updater as unknown as RelationCall;
			expect(updater.type).toBe("one");
			expect(updater.table).toBe(usersTable);
		});

		it("should define post as a one-to-one relation with postsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = postAttachmentsTableRelations.config({
				one,
				many,
			});

			const post = relationsResult.post as unknown as RelationCall;
			expect(post.type).toBe("one");
			expect(post.table).toBe(postsTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required name field", () => {
			const invalidData = {};
			const result = postAttachmentsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should reject empty name string", () => {
			const invalidData = { name: "" };
			const result = postAttachmentsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should accept name with exactly minimum length (1 character)", () => {
			const validData = {
				name: "a",
				mimeType: "image/png",
				postId: crypto.randomUUID(),
				objectName: "obj",
				fileHash: "hash",
				creatorId: crypto.randomUUID(),
			};
			const result = postAttachmentsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			const [result] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			expect(result.id).toBeDefined();
			expect(result.name).toBe(name);
			expect(result.objectName).toBe(objectName);
			expect(result.mimeType).toBe(mimeType);
			expect(result.fileHash).toBe(fileHash);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
		});

		it("should successfully insert a record with each valid enum value", async () => {
			const { userId } = await createRegularUserUsingAdmin();

			const validMimeTypes: Array<
				| "image/avif"
				| "image/jpeg"
				| "image/png"
				| "image/webp"
				| "video/mp4"
				| "video/webm"
				| "video/quicktime"
			> = [
				"image/avif",
				"image/jpeg",
				"image/png",
				"image/webp",
				"video/mp4",
				"video/webm",
				"video/quicktime",
			];

			for (const mimeType of validMimeTypes) {
				const postId = await createTestPost();
				const [result] = await server.drizzleClient
					.insert(postAttachmentsTable)
					.values({
						name: faker.system.fileName(),
						creatorId: userId,
						mimeType: mimeType,
						objectName: faker.system.fileName(),
						fileHash: faker.string.hexadecimal({ length: 64 }),
						postId: postId,
					})
					.returning();

				expect(result).toBeDefined();
				if (result) {
					expect(result.mimeType).toBe(mimeType);
				}
			}
		});

		it("should successfully query records", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			await server.drizzleClient.insert(postAttachmentsTable).values({
				name: name,
				creatorId: userId,
				mimeType: mimeType,
				postId: postId,
				objectName: objectName,
				fileHash: fileHash,
			});

			const results = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.name, name));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.name).toBe(name);
		});

		it("should successfully update a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			const [inserted] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert PostAttachments record");
			}
			const updatedName = faker.system.fileName();
			const updatedMimeType = "image/jpeg";
			const updatedObjectName = faker.system.fileName();
			const updateFileHash = faker.string.hexadecimal({ length: 64 });

			const [updated] = await server.drizzleClient
				.update(postAttachmentsTable)
				.set({
					name: updatedName,
					mimeType: updatedMimeType,
					objectName: updatedObjectName,
					fileHash: updateFileHash,
				})
				.where(eq(postAttachmentsTable.id, inserted.id))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.name).toBe(updatedName);
			expect(updated?.mimeType).toBe(updatedMimeType);
			expect(updated?.objectName).toBe(updatedObjectName);
			expect(updated?.fileHash).toBe(updateFileHash);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			const [inserted] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert PostAttachments record");
			}

			const postAttachmentsId = inserted.id;

			const [deleted] = await server.drizzleClient
				.delete(postAttachmentsTable)
				.where(eq(postAttachmentsTable.id, postAttachmentsId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(postAttachmentsId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.id, postAttachmentsId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find postAttachments by old creatorId after user deletion", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			const [inserted] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert PostAttachments record");
			}

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.creatorId, userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			const [inserted] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert PostAttachment record");
			}

			expect(inserted.creatorId).toBe(userId);
			const postAttachmentId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.id, postAttachmentId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should set null when updater is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			const [inserted] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					updaterId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert PostAttachment record");
			}
			expect(inserted.updaterId).toBe(userId);

			const postAttachmentId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.id, postAttachmentId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.updaterId).toBeNull();
		});

		it("should delete attachment when post is deleted (cascade)", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();

			const [inserted] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: faker.system.fileName(),
					creatorId: userId,
					mimeType: "image/png",
					postId: postId,
					objectName: faker.system.fileName(),
					fileHash: faker.string.hexadecimal({ length: 64 }),
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert PostAttachment record");
			}
			expect(inserted.updaterId).toBe(userId);

			const postAttachmentId = inserted.id;

			// Delete the post
			await server.drizzleClient
				.delete(postsTable)
				.where(eq(postsTable.id, postId));

			// Verify attachment was cascade deleted
			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.id, postAttachmentId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		it("should efficiently query using indexed creatorId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.creatorId, userId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed objectName column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.objectName, objectName));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed postId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.postId, postId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed fileHash column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });

			await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.fileHash, fileHash));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed createdAt column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const mimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });
			const createdAt = faker.date.recent();

			await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: mimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
					createdAt: createdAt,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postAttachmentsTable)
				.where(eq(postAttachmentsTable.createdAt, createdAt));

			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe("Enum Constraints", () => {
		it("should validate enum values in insert schema", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const name = faker.system.fileName();
			const validMimeType = "image/png";
			const objectName = faker.system.fileName();
			const fileHash = faker.string.hexadecimal({ length: 64 });
			const createdAt = faker.date.recent();

			const [result] = await server.drizzleClient
				.insert(postAttachmentsTable)
				.values({
					name: name,
					creatorId: userId,
					mimeType: validMimeType,
					postId: postId,
					objectName: objectName,
					fileHash: fileHash,
					createdAt: createdAt,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.mimeType).toBe(validMimeType);
			}
		});

		it("should reject invalid MIME type", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();

			await expect(
				server.drizzleClient.insert(postAttachmentsTable).values({
					name: "test.pdf",
					creatorId: userId,
					mimeType: "application/pdf" as any,
					objectName: "testobj",
					fileHash: "hash123",
					postId: postId,
				}),
			).rejects.toThrow();
		});
	});
});
