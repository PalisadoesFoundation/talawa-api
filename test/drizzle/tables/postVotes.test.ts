import { faker } from "@faker-js/faker";
import { eq, inArray } from "drizzle-orm";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { afterEach, describe, expect, it } from "vitest";
import {
	organizationsTable,
	postsTable,
	postVotesTable,
	postVotesTableRelations,
	usersTable,
} from "~/src/drizzle/schema";
import { postVotesTableInsertSchema } from "~/src/drizzle/tables/postVotes";
import { server } from "../../server";

/*
 * Tests for the postVotes table and its relations.
 * Test validates table schema, insertion, and relations.
 * database operations, indexes.
 */

const _createdResources = {
	voteIds: [] as string[],
	postIds: [] as string[],
	orgIds: [] as string[],
	userIds: [] as string[],
};

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
				name: `Org-${faker.string.uuid()}`,
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
	_createdResources.orgIds.push(orgId);
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
	_createdResources.postIds.push(postId);
	return postId;
}

describe("src/drizzle/tables/postVotes", () => {
	afterEach(async () => {
		// Delete in reverse dependency order using tracked IDs only.
		// Each step is wrapped in try/catch so that a failure in one
		// does not skip cleanup of the remaining tables.
		try {
			if (_createdResources.voteIds.length > 0) {
				await server.drizzleClient
					.delete(postVotesTable)
					.where(inArray(postVotesTable.id, _createdResources.voteIds));
			}
		} catch (error) {
			console.error("Cleanup failed for postvotes:", error);
		}
		try {
			if (_createdResources.postIds.length > 0) {
				await server.drizzleClient
					.delete(postsTable)
					.where(inArray(postsTable.id, _createdResources.postIds));
			}
		} catch (error) {
			console.error("Cleanup failed for posts:", error);
		}
		try {
			if (_createdResources.orgIds.length > 0) {
				await server.drizzleClient
					.delete(organizationsTable)
					.where(inArray(organizationsTable.id, _createdResources.orgIds));
			}
		} catch (error) {
			console.error("Cleanup failed for organizations:", error);
		}
		try {
			if (_createdResources.userIds.length > 0) {
				await server.drizzleClient
					.delete(usersTable)
					.where(inArray(usersTable.id, _createdResources.userIds));
			}
		} catch (error) {
			console.error("Cleanup failed for users:", error);
		}

		// Reset tracked arrays
		_createdResources.voteIds.length = 0;
		_createdResources.postIds.length = 0;
		_createdResources.orgIds.length = 0;
		_createdResources.userIds.length = 0;
	});

	describe("PostVotes Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(postVotesTable);
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("id");
			expect(columns).toContain("postId");
			expect(columns).toContain("type");
			expect(columns).toContain("updatedAt");
		});

		it("should have correct primary key configuration", () => {
			expect(postVotesTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(postVotesTable.createdAt.notNull).toBe(true);
			expect(postVotesTable.postId.notNull).toBe(true);
			expect(postVotesTable.type.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(postVotesTable.creatorId.notNull).toBe(false);
			expect(postVotesTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(postVotesTable.createdAt.hasDefault).toBe(true);
			expect(postVotesTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
			const validPostId = await createTestPost();

			await expect(
				server.drizzleClient.insert(postVotesTable).values({
					type: "up_vote",
					postId: validPostId,
					creatorId: invalidCreatorId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty creatorId foreign key", async () => {
			const validPostId = await createTestPost();

			await expect(
				server.drizzleClient.insert(postVotesTable).values({
					type: "up_vote",
					postId: validPostId,
					creatorId: "",
				}),
			).rejects.toThrow();
		});

		it("should reject insert with null creatorId foreign key", async () => {
			const validPostId = await createTestPost();

			await expect(
				server.drizzleClient.insert(postVotesTable).values({
					type: "up_vote",
					postId: validPostId,
					creatorId: null,
				}),
			).resolves.toBeDefined();
		});

		it("should reject insert with invalid postId foreign key", async () => {
			const invalidPostId = faker.string.uuid();
			const validCreatorId = await createRegularUserUsingAdmin();
			_createdResources.userIds.push(validCreatorId.userId);

			await expect(
				server.drizzleClient.insert(postVotesTable).values({
					type: "up_vote",
					postId: invalidPostId,
					creatorId: validCreatorId.userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty postId foreign key", async () => {
			const validCreatorId = await createRegularUserUsingAdmin();
			_createdResources.userIds.push(validCreatorId.userId);

			await expect(
				server.drizzleClient.insert(postVotesTable).values({
					type: "up_vote",
					postId: "",
					creatorId: validCreatorId.userId,
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
					typeof postVotesTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof postVotesTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(postVotesTableRelations).toBeDefined();
			expect(typeof postVotesTableRelations).toBe("object");
		});

		it("should be associated with postVotesTableRelations", () => {
			expect(postVotesTableRelations.table).toBe(postVotesTable);
		});

		it("should have a config function", () => {
			expect(typeof postVotesTableRelations.config).toBe("function");
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = postVotesTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.post).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = postVotesTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define post as a one-to-one relation with postsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = postVotesTableRelations.config({
				one,
				many,
			});

			const post = relationsResult.post as unknown as RelationCall;
			expect(post.type).toBe("one");
			expect(post.table).toBe(postsTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required type field", () => {
			const invalidData = {};
			const result = postVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("type")),
				).toBe(true);
			}
		});

		it("should reject empty type string", () => {
			const invalidData = { type: "" };
			const result = postVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("type")),
				).toBe(true);
			}
		});

		it("should reject null type", () => {
			const invalidData = { type: null };
			const result = postVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("type")),
				).toBe(true);
			}
		});

		it("should reject empty postId string", () => {
			const invalidData = { type: "down_vote", postId: "" };
			const result = postVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("postId")),
				).toBe(true);
			}
		});

		it("should reject null postId", () => {
			const invalidData = { type: "down_vote", postId: null };
			const result = postVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("postId")),
				).toBe(true);
			}
		});

		it("should accept data with valid data", () => {
			const validData = {
				type: "down_vote",
				postId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
			};
			const result = postVotesTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "up_vote";
			_createdResources.userIds.push(userId);

			const [result] = await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			_createdResources.voteIds.push(result.id);
			expect(result.id).toBeDefined();
			expect(result.type).toBe(type);
			expect(result.postId).toBe(postId);
			expect(result.creatorId).toBe(userId);
		});

		it("should successfully insert a record with each valid enum value", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const validTypes: Array<"down_vote" | "up_vote"> = [
				"down_vote",
				"up_vote",
			];
			_createdResources.userIds.push(userId);

			for (const type of validTypes) {
				const postId = await createTestPost();
				const [result] = await server.drizzleClient
					.insert(postVotesTable)
					.values({
						type,
						postId,
						creatorId: userId,
					})
					.returning();

				expect(result).toBeDefined();
				if (result) {
					_createdResources.voteIds.push(result.id);
					expect(result.type).toBe(type);
				}
			}
		});

		it("should successfully query records", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "up_vote";
			_createdResources.userIds.push(userId);

			await server.drizzleClient.insert(postVotesTable).values({
				type,
				postId,
				creatorId: userId,
			});

			const results = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.type, type));

			results.forEach((e) => _createdResources.voteIds.push(e.id));
			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.type).toBe(type);
		});

		it("should successfully update a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "up_vote";
			_createdResources.userIds.push(userId);

			const [inserted] = await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const updatetype = "down_vote";

			const [updated] = await server.drizzleClient
				.update(postVotesTable)
				.set({
					type: updatetype,
				})
				.where(eq(postVotesTable.id, inserted.id))
				.returning();

			_createdResources.voteIds.push(updated?.id as string);
			expect(updated).toBeDefined();
			expect(updated?.type).toBe(updatetype);
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "up_vote";
			_createdResources.userIds.push(userId);

			const [inserted] = await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const postVoteId = inserted.id;

			const [deleted] = await server.drizzleClient
				.delete(postVotesTable)
				.where(eq(postVotesTable.id, postVoteId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(postVoteId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.id, postVoteId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find postVotes by old creatorId after user deletion", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			const [inserted] = await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			_createdResources.voteIds.push(inserted.id);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.creatorId, userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			const [inserted] = await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			_createdResources.voteIds.push(inserted.id);
			expect(inserted.creatorId).toBe(userId);
			const postVoteId = inserted.id;

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [updated] = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.id, postVoteId))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should delete postVote when post is deleted (cascade)", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			const [inserted] = await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			_createdResources.voteIds.push(inserted.id);
			expect(inserted.postId).toBe(postId);
			const postVoteId = inserted.id;

			await server.drizzleClient
				.delete(postsTable)
				.where(eq(postsTable.id, postId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.id, postVoteId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		it("should efficiently query using indexed creatorId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.creatorId, userId));

			results.forEach((e) => _createdResources.voteIds.push(e.id));
			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed postId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.postId, postId));

			results.forEach((e) => _createdResources.voteIds.push(e.id));
			expect(results.length).toBeGreaterThan(0);
		});

		it("should efficiently query using indexed type column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(postVotesTable)
				.where(eq(postVotesTable.type, type));

			results.forEach((e) => _createdResources.voteIds.push(e.id));
			expect(results.length).toBeGreaterThan(0);
		});

		it("should not allow duplicate votes by same user on same post", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(
				server.drizzleClient
					.insert(postVotesTable)
					.values({
						type,
						postId,
						creatorId: userId,
					})
					.returning(),
			).rejects.toThrow();
		});
	});

	describe("Enum Constraints", () => {
		it("should validate enum values in insert schema", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			const type = "down_vote";
			_createdResources.userIds.push(userId);

			const [result] = await server.drizzleClient
				.insert(postVotesTable)
				.values({
					type,
					postId,
					creatorId: userId,
				})
				.returning();

			expect(result).toBeDefined();

			if (result) {
				_createdResources.voteIds.push(result.id);
				expect(result.type).toBe(type);
			}
		});

		it("should reject invalid enum values at database level", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const postId = await createTestPost();
			_createdResources.userIds.push(userId);

			await expect(
				server.drizzleClient
					.insert(postVotesTable)
					.values({
						type: "invalid_vote_type" as "up_vote", // Type assertion to bypass TS
						postId,
						creatorId: userId,
					})
					.returning(),
			).rejects.toThrow();
		});
	});
});
