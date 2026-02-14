import { faker } from "@faker-js/faker";
import { and, eq, getTableName, inArray, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterEach, describe, expect, it } from "vitest";
import {
	commentsTable,
	commentVotesTable,
	commentVotesTableRelations,
	commentVoteTypePgEnum,
	postsTable,
	usersTable,
} from "~/src/drizzle/schema";
import {
	commentVotesTable as commentVotesTableDirect,
	commentVotesTableInsertSchema,
} from "~/src/drizzle/tables/commentVotes";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { server } from "../../server";

/**
 * Resource tracker for test isolation.
 * Tracks all created resource IDs so cleanup only deletes data created
 * by the current test, preventing cross-shard interference in parallel execution.
 */
const createdResources = {
	voteIds: [] as string[],
	commentIds: [] as string[],
	postIds: [] as string[],
	orgIds: [] as string[],
	userIds: [] as string[],
};

/**
 * Creates a test user directly via drizzle and tracks the ID.
 */
async function createTestUser(): Promise<string> {
	const [user] = await server.drizzleClient
		.insert(usersTable)
		.values({
			emailAddress: `email${faker.string.ulid()}@email.com`,
			name: faker.person.fullName(),
			passwordHash: "test-hash",
			role: "regular",
			isEmailAddressVerified: true,
		})
		.returning();
	if (!user?.id) {
		throw new Error("Failed to create test user");
	}
	createdResources.userIds.push(user.id);
	return user.id;
}

/**
 * Creates a test organization directly via drizzle and tracks the ID.
 */
async function createTestOrganization(): Promise<string> {
	const [org] = await server.drizzleClient
		.insert(organizationsTable)
		.values({
			name: `Org-${faker.string.ulid()}`,
			description: faker.lorem.sentence(),
			creatorId: null,
			updaterId: null,
		})
		.returning();
	if (!org?.id) {
		throw new Error("Failed to create test organization");
	}
	createdResources.orgIds.push(org.id);
	return org.id;
}

/**
 * Creates a test post directly via drizzle and tracks the ID.
 */
async function createTestPost(orgId: string): Promise<string> {
	const [post] = await server.drizzleClient
		.insert(postsTable)
		.values({
			caption: "Test Post Caption",
			organizationId: orgId,
		})
		.returning();
	if (!post?.id) {
		throw new Error("Failed to create test post");
	}
	createdResources.postIds.push(post.id);
	return post.id;
}

/**
 * Creates a test comment directly via drizzle and tracks the ID.
 */
async function createTestComment(postId: string): Promise<string> {
	const [comment] = await server.drizzleClient
		.insert(commentsTable)
		.values({
			body: "Test comment body",
			postId,
		})
		.returning();
	if (!comment?.id) {
		throw new Error("Failed to create test comment");
	}
	createdResources.commentIds.push(comment.id);
	return comment.id;
}

/**
 * Creates the full dependency chain (user, org, post, comment) and returns all IDs.
 */
async function createTestDependencyChain(): Promise<{
	userId: string;
	orgId: string;
	postId: string;
	commentId: string;
}> {
	const userId = await createTestUser();
	const orgId = await createTestOrganization();
	const postId = await createTestPost(orgId);
	const commentId = await createTestComment(postId);
	return { userId, orgId, postId, commentId };
}

describe("src/drizzle/tables/commentVotes", () => {
	afterEach(async () => {
		// Delete in reverse dependency order using tracked IDs only.
		// Each step is wrapped in try/catch so that a failure in one
		// does not skip cleanup of the remaining tables.
		try {
			if (createdResources.voteIds.length > 0) {
				await server.drizzleClient
					.delete(commentVotesTable)
					.where(inArray(commentVotesTable.id, createdResources.voteIds));
			}
		} catch (error) {
			console.error("Cleanup failed for commentVotes:", error);
		}
		try {
			if (createdResources.commentIds.length > 0) {
				await server.drizzleClient
					.delete(commentsTable)
					.where(inArray(commentsTable.id, createdResources.commentIds));
			}
		} catch (error) {
			console.error("Cleanup failed for comments:", error);
		}
		try {
			if (createdResources.postIds.length > 0) {
				await server.drizzleClient
					.delete(postsTable)
					.where(inArray(postsTable.id, createdResources.postIds));
			}
		} catch (error) {
			console.error("Cleanup failed for posts:", error);
		}
		try {
			if (createdResources.orgIds.length > 0) {
				await server.drizzleClient
					.delete(organizationsTable)
					.where(inArray(organizationsTable.id, createdResources.orgIds));
			}
		} catch (error) {
			console.error("Cleanup failed for organizations:", error);
		}
		try {
			if (createdResources.userIds.length > 0) {
				await server.drizzleClient
					.delete(usersTable)
					.where(inArray(usersTable.id, createdResources.userIds));
			}
		} catch (error) {
			console.error("Cleanup failed for users:", error);
		}

		// Reset tracked arrays
		createdResources.voteIds.length = 0;
		createdResources.commentIds.length = 0;
		createdResources.postIds.length = 0;
		createdResources.orgIds.length = 0;
		createdResources.userIds.length = 0;
	});

	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(commentVotesTable)).toBe("comment_votes");
		});

		it("should have all required columns defined", () => {
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
			expect(commentVotesTable.commentId.notNull).toBe(true);
			expect(commentVotesTable.createdAt.notNull).toBe(true);
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

		it("should have correct column names", () => {
			expect(commentVotesTable.commentId.name).toBe("comment_id");
			expect(commentVotesTable.createdAt.name).toBe("created_at");
			expect(commentVotesTable.creatorId.name).toBe("creator_id");
			expect(commentVotesTable.id.name).toBe("id");
			expect(commentVotesTable.type.name).toBe("type");
			expect(commentVotesTable.updatedAt.name).toBe("updated_at");
		});

		it("should have correct column data types", () => {
			expect(commentVotesTable.commentId.dataType).toBe("string");
			expect(commentVotesTable.creatorId.dataType).toBe("string");
			expect(commentVotesTable.id.dataType).toBe("string");
			expect(commentVotesTable.createdAt.dataType).toBe("date");
			expect(commentVotesTable.updatedAt.dataType).toBe("date");
		});
	});

	describe("Foreign Key Relationships", () => {
		const tableConfig = getTableConfig(commentVotesTable);

		it("should have exactly 2 foreign keys defined", () => {
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(Array.isArray(tableConfig.foreignKeys)).toBe(true);
			expect(tableConfig.foreignKeys.length).toBe(2);
		});

		it("should have foreign key from commentId to comments", () => {
			const commentFk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "comment_id");
				},
			);
			expect(commentFk).toBeDefined();
			const ref = commentFk?.reference();
			expect(ref?.foreignTable).toBe(commentsTable);
		});

		it("should have foreign key from creatorId to users", () => {
			const creatorFk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "creator_id");
				},
			);
			expect(creatorFk).toBeDefined();
			const ref = creatorFk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
		});

		it("should reject insert with invalid commentId foreign key", async () => {
			const invalidCommentId = faker.string.uuid();
			const userId = await createTestUser();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId: invalidCommentId,
					creatorId: userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
			const { commentId } = await createTestDependencyChain();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId,
					creatorId: invalidCreatorId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty commentId foreign key", async () => {
			const userId = await createTestUser();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId: "",
					creatorId: userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty creatorId foreign key", async () => {
			const { commentId } = await createTestDependencyChain();

			await expect(
				server.drizzleClient.insert(commentVotesTable).values({
					type: "up_vote",
					commentId,
					creatorId: "",
				}),
			).rejects.toThrow();
		});

		it("should allow insert with null creatorId", async () => {
			const { commentId } = await createTestDependencyChain();

			const [result] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "up_vote",
					commentId,
					creatorId: null,
				})
				.returning();

			expect(result).toBeDefined();
			if (result) {
				createdResources.voteIds.push(result.id);
				expect(result.creatorId).toBeNull();
			}
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

		it("should be associated with commentVotesTable", () => {
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

			expect(relationsResult.comment).toBeDefined();
			expect(relationsResult.creator).toBeDefined();
		});

		it("should define comment as a one-to-one relation with commentsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = commentVotesTableRelations.config({
				one,
				many,
			});

			const comment = relationsResult.comment as unknown as RelationCall;
			expect(comment.type).toBe("one");
			expect(comment.table).toBe(commentsTable);
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

		it("should define exactly two relations (comment, creator)", () => {
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

			const capturedRelations: Record<string, CapturedRelation> = {};
			let totalRelationCount = 0;

			(
				commentVotesTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					totalRelationCount++;
					if (getTableName(table) === "comments") {
						capturedRelations.comment = { table, config };
					}
					if (getTableName(table) === "users") {
						capturedRelations.creator = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (_table: Table, _config?: CapturedRelation["config"]) => {
					totalRelationCount++;
					return { withFieldName: () => ({}) };
				},
			});

			expect(totalRelationCount).toBe(2);
			expect(Object.keys(capturedRelations)).toHaveLength(2);
			expect(capturedRelations.comment).toBeDefined();
			expect(capturedRelations.creator).toBeDefined();
			expect(capturedRelations.comment?.config?.relationName).toBe(
				"comment_votes.comment_id:comments.id",
			);
			expect(capturedRelations.creator?.config?.relationName).toBe(
				"comment_votes.creator_id:users.id",
			);
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

		it("should reject invalid type enum value", () => {
			const invalidData = {
				type: "invalid_vote",
				commentId: faker.string.uuid(),
			};
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject empty commentId string", () => {
			const invalidData = { type: "up_vote", commentId: "" };
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("commentId")),
				).toBe(true);
			}
		});

		it("should reject null commentId", () => {
			const invalidData = { type: "up_vote", commentId: null };
			const result = commentVotesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("commentId")),
				).toBe(true);
			}
		});

		it("should accept valid data with up_vote type", () => {
			const validData = {
				type: "up_vote",
				commentId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
			};
			const result = commentVotesTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept valid data with down_vote type", () => {
			const validData = {
				type: "down_vote",
				commentId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
			};
			const result = commentVotesTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept data without optional creatorId", () => {
			const validData = {
				type: "up_vote",
				commentId: faker.string.uuid(),
			};
			const result = commentVotesTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Enum Configuration", () => {
		it("should export commentVoteTypePgEnum", () => {
			expect(commentVoteTypePgEnum).toBeDefined();
		});

		it("should have correct enum values", () => {
			expect(commentVoteTypePgEnum.enumValues).toContain("up_vote");
			expect(commentVoteTypePgEnum.enumValues).toContain("down_vote");
			expect(commentVoteTypePgEnum.enumValues).toHaveLength(2);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [result] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "up_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			createdResources.voteIds.push(result.id);
			expect(result.id).toBeDefined();
			expect(result.type).toBe("up_vote");
			expect(result.commentId).toBe(commentId);
			expect(result.creatorId).toBe(userId);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
		});

		it("should successfully insert a record with each valid enum value", async () => {
			const userId = await createTestUser();
			const validTypes: Array<"down_vote" | "up_vote"> = [
				"down_vote",
				"up_vote",
			];

			for (const type of validTypes) {
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId);

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
					createdResources.voteIds.push(result.id);
					expect(result.type).toBe(type);
				}
			}
		});

		it("should successfully query records", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "up_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			if (!inserted) {
				throw new Error("Failed to insert record");
			}
			createdResources.voteIds.push(inserted.id);

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.id, inserted.id));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBe(1);
			expect(results[0]?.type).toBe("up_vote");
		});

		it("should successfully update a record", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "up_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}
			createdResources.voteIds.push(inserted.id);

			const [updated] = await server.drizzleClient
				.update(commentVotesTable)
				.set({ type: "down_vote" })
				.where(eq(commentVotesTable.id, inserted.id))
				.returning();

			expect(updated).toBeDefined();
			expect(updated?.type).toBe("down_vote");
			expect(updated?.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "up_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const voteId = inserted.id;
			createdResources.voteIds.push(voteId);

			const [deleted] = await server.drizzleClient
				.delete(commentVotesTable)
				.where(eq(commentVotesTable.id, voteId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(voteId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.id, voteId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should set null when creator is deleted", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "down_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			createdResources.voteIds.push(inserted.id);
			expect(inserted.creatorId).toBe(userId);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			// Remove from tracking since we manually deleted it
			createdResources.userIds = createdResources.userIds.filter(
				(id) => id !== userId,
			);

			const [updated] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.id, inserted.id))
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should not find commentVotes by old creatorId after user deletion", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "down_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			createdResources.voteIds.push(inserted.id);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			createdResources.userIds = createdResources.userIds.filter(
				(id) => id !== userId,
			);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.creatorId, userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should delete commentVote when comment is deleted (cascade)", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "down_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			expect(inserted.commentId).toBe(commentId);
			const voteId = inserted.id;
			createdResources.voteIds.push(voteId);

			await server.drizzleClient
				.delete(commentsTable)
				.where(eq(commentsTable.id, commentId));

			// Remove from tracking since we manually deleted it (and cascade removed the vote)
			createdResources.commentIds = createdResources.commentIds.filter(
				(id) => id !== commentId,
			);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.id, voteId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		const tableConfig = getTableConfig(commentVotesTable);

		const getColumnName = (col: unknown): string | undefined => {
			if (col && typeof col === "object" && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

		it("should have indexes defined", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
			expect(tableConfig.indexes.length).toBe(4);
		});

		it("should have indexes on comment_id, creator_id, and type", () => {
			const indexedColumns = tableConfig.indexes.map(
				(idx) => idx.config.columns[0] && getColumnName(idx.config.columns[0]),
			);
			expect(indexedColumns).toContain("comment_id");
			expect(indexedColumns).toContain("creator_id");
			expect(indexedColumns).toContain("type");
		});

		it("should have a unique index on (comment_id, creator_id)", () => {
			const uniqueIndexes = tableConfig.indexes.filter(
				(idx) => idx.config.unique === true,
			);
			expect(uniqueIndexes.length).toBe(1);

			const uniqueIdx = uniqueIndexes[0];
			if (uniqueIdx) {
				const columnNames = uniqueIdx.config.columns.map((col) =>
					getColumnName(col),
				);
				expect(columnNames).toContain("comment_id");
				expect(columnNames).toContain("creator_id");
			}
		});

		it("should query by indexed commentId column", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "down_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			if (inserted) {
				createdResources.voteIds.push(inserted.id);
			}

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.commentId, commentId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should query by indexed creatorId column", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "down_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			if (inserted) {
				createdResources.voteIds.push(inserted.id);
			}

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(eq(commentVotesTable.creatorId, userId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should query by indexed type column", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "down_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			if (inserted) {
				createdResources.voteIds.push(inserted.id);
			}

			const results = await server.drizzleClient
				.select()
				.from(commentVotesTable)
				.where(
					and(
						eq(commentVotesTable.type, "down_vote"),
						eq(commentVotesTable.commentId, commentId),
					),
				);

			expect(results.length).toBeGreaterThan(0);
		});

		it("should not allow duplicate votes by same user on same comment", async () => {
			const { userId, commentId } = await createTestDependencyChain();

			const [inserted] = await server.drizzleClient
				.insert(commentVotesTable)
				.values({
					type: "up_vote",
					commentId,
					creatorId: userId,
				})
				.returning();

			if (inserted) {
				createdResources.voteIds.push(inserted.id);
			}

			await expect(
				server.drizzleClient
					.insert(commentVotesTable)
					.values({
						type: "down_vote",
						commentId,
						creatorId: userId,
					})
					.returning(),
			).rejects.toThrow();
		});
	});

	describe("Exports", () => {
		it("should export all required objects", () => {
			expect(commentVotesTable).toBeDefined();
			expect(typeof commentVotesTable).toBe("object");
			expect(commentVotesTableRelations).toBeDefined();
			expect(typeof commentVotesTableRelations).toBe("object");
			expect(commentVotesTableInsertSchema).toBeDefined();
			expect(typeof commentVotesTableInsertSchema.parse).toBe("function");
			expect(typeof commentVotesTableInsertSchema.safeParse).toBe("function");
			expect(commentVoteTypePgEnum).toBeDefined();
		});

		it("should export commentVotesTable from direct import", () => {
			expect(commentVotesTableDirect).toBeDefined();
			expect(commentVotesTableDirect).toBe(commentVotesTable);
		});
	});
});
