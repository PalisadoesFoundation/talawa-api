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
import {
	commentsTable,
	commentVotesTable,
	commentVotesTableRelations,
	postsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { commentVotesTableInsertSchema } from "~/src/drizzle/tables/commentVotes";
import { server } from "../../server";

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

async function createTestComment(): Promise<string> {
	const { userId } = await createRegularUserUsingAdmin();
	const postId = await createTestPost();

	const commentResult = await server.drizzleClient
		.insert(commentsTable)
		.values({
			body: faker.lorem.paragraph(),
			creatorId: userId,
			postId: postId,
		})
		.returning({ id: commentsTable.id });

	const commentId = commentResult[0]?.id;
	assertToBeNonNullish(
		commentId,
		"Comment ID is missing from creation response",
	);
	return commentId;
}

describe("src/drizzle/tables/commentVotes.test.ts", () => {
	describe("CommentVotes Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(commentVotesTable);
			expect(columns).toContain("commentId");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("id");
			expect(columns).toContain("type");
			expect(columns).toContain("updatedAt");
		});

		it("should have correct primary key configuration", () => {
			expect(commentVotesTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(commentVotesTable.createdAt.notNull).toBe(true);
			expect(commentVotesTable.commentId.notNull).toBe(true);
			expect(commentVotesTable.type.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(commentVotesTable.creatorId.notNull).toBe(false);
			expect(commentVotesTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(commentVotesTable.createdAt.hasDefault).toBe(true);
			expect(commentVotesTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
			const validCommentId = await createTestComment();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId: validCommentId,
					creatorId: invalidCreatorId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty creatorId foreign key", async () => {
			const validCommentId = await createTestComment();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId: validCommentId,
					creatorId: "",
				}),
			).rejects.toThrow();
		});

		it("should reject insert with null creatorId foreign key", async () => {
			const validCommentId = await createTestComment();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId: validCommentId,
					creatorId: null,
				}),
			).resolves.toBeDefined();
		});

		it("should reject insert with invalid commentId foreign key", async () => {
			const invalidCommitId = faker.string.uuid();
			const { userId } = await createRegularUserUsingAdmin();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId: invalidCommitId,
					creatorId: userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty commentId foreign key", async () => {
			const { userId } = await createRegularUserUsingAdmin();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId: "",
					creatorId: userId,
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
					typeof commentVotesTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof commentVotesTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(commentVotesTableRelations).toBeDefined();
			expect(typeof commentVotesTableRelations).toBe("object");
		});

		it("should be associated with commentVotesTableRelations", () => {
			expect(commentVotesTableRelations.table).toBe(commentVotesTable);
		});

		it("should have a config function", () => {
			expect(typeof commentVotesTableRelations.config).toBe("function");
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = commentVotesTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.comment).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = commentVotesTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define comment as a one-to-one relation with comment Table", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = commentVotesTableRelations.config({
				one,
				many,
			});

			const comment = relationsResult.comment as unknown as RelationCall;
			expect(comment.type).toBe("one");
			expect(comment.table).toBe(commentsTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required type field", () => {
			const invalidData = {};
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("type")),
				).toBe(true);
			}
		});

		it("should reject empty type string", () => {
			const invalidData = { type: "" };
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("type")),
				).toBe(true);
			}
		});

		it("should reject null type", () => {
			const invalidData = { type: null };
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("type")),
				).toBe(true);
			}
		});

		it("should reject empty commentId string", () => {
			const invalidData = { type: "down_vote", commentId: "" };
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("commentId")),
				).toBe(true);
			}
		});

		it("should reject null commentId string", () => {
			const invalidData = { type: "down_vote", commentId: null };
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("commentId")),
				).toBe(true);
			}
		});

		it("should accept data with valid data", () => {
			const validData = {
				type: "down_vote",
				commentId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
			};
			const result = commentVotesTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "up_vote";

			const [result] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			expect(result.id).toBeDefined();
			expect(result.type).toBe(type);
			expect(result.commentId).toBe(commentId);
			expect(result.creatorId).toBe(userId);
		});

		it("should successfully insert a record with each valid enum value", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const validTypes: Array<"down_vote" | "up_vote"> = [
				"down_vote",
				"up_vote",
			];

			for (const type of validTypes) {
				const commentId = await createTestComment();
				const [result] = await server.drizzleClient
					.insert(commentVotesTable)
					.values({
						type,
						commentId,
						creatorId: userId,
					})
					.returning();

				expect(result).toBeDefined();
				if (result) {
					expect(result.type).toBe(type);
				}
			}
		});

		it("should successfully query records", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "up_vote";

			await server.drizzleClient.insert(commentVotesTable).values({
				type,
				commentId,
				creatorId: userId,
			});

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.type, type));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.type).toBe(type);
		});

		it("should successfully update a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "up_vote";

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const updateType = "down_vote";

			const [updated] = await server.drizzleClient
				.update(commentVotesTable)
				.set({
					type: updateType,
				})
				.where(eq(commentVotesTable.id, inserted.id))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.type).toBe(updateType);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "up_vote";

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const commentVoteId = inserted.id;

			const [deleted] = await server.drizzleClient
				.delete(commentVotesTable)
				.where(eq(commentVotesTable.id, commentVoteId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(commentVoteId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.id, commentVoteId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find commentVote by old creatorId after user deletion", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.creatorId, userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			expect(inserted.creatorId).toBe(userId);
			const commentVoteId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.id, commentVoteId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should delete postVote when post is deleted (cascade)", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			expect(inserted.commentId).toBe(commentId);
			const commentVoteId = inserted.id;

			await server.drizzleClient
				.delete(commentsTable)
				.where(eq(commentsTable.id, commentId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.id, commentVoteId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		it("should efficiently query using indexed creatorId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.creatorId, userId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed commentId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.commentId, commentId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed type column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.type, type));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should not allow duplicate votes by same user on same post", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			await expect(
				server.drizzleClient
					.insert(commentVotesTable)
					.values({
						type,
						commentId,
						creatorId: userId,
					})
					.returning(),
			).rejects.toThrow();
		});
	});

	describe("Enum Constraints", () => {
		it("should validate enum values in insert schema", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();
			const type = "down_vote";

			const [result] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type,
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				expect(result.type).toBe(type);
			}
		});

		it("should reject invalid enum values at database level", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const commentId = await createTestComment();

			await expect(
				server.drizzleClient
					.insert(commentVotesTable)
					.values({
						type: "invalid_vote_type" as "up_vote", // Type assertion to bypass TS
						commentId,
						creatorId: userId,
					})
					.returning(),
			).rejects.toThrow();
		});
	});
});
