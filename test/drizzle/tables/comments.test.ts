import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { eq, getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	COMMENT_BODY_MAX_LENGTH,
	commentsTable,
	commentsTableInsertSchema,
	commentsTableRelations,
} from "~/src/drizzle/tables/comments";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { postsTable } from "~/src/drizzle/tables/posts";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

/**
 * Tests for commentsTable definition - validates table schema, relations,
 * insert schema validation, foreign keys, indexes, and database operations.
 * Goal: 100% code coverage for src/drizzle/tables/comments.ts.
 */
describe("src/drizzle/tables/comments.ts - Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(commentsTable)).toBe("comments");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(commentsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("body");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("postId");
			expect(columns).toContain("updatedAt");
			expect(columns.length).toBeGreaterThanOrEqual(6);
		});

		it("should have correct column names and properties", () => {
			expect(commentsTable.id.name).toBe("id");
			expect(commentsTable.id.primary).toBe(true);
			expect(commentsTable.id.hasDefault).toBe(true);
			expect(commentsTable.body.name).toBe("body");
			expect(commentsTable.body.notNull).toBe(true);
			expect(commentsTable.createdAt.name).toBe("created_at");
			expect(commentsTable.createdAt.notNull).toBe(true);
			expect(commentsTable.createdAt.hasDefault).toBe(true);
			expect(commentsTable.creatorId.name).toBe("creator_id");
			expect(commentsTable.creatorId.notNull).toBe(false);
			expect(commentsTable.postId.name).toBe("post_id");
			expect(commentsTable.postId.notNull).toBe(true);
			expect(commentsTable.updatedAt.name).toBe("updated_at");
			expect(commentsTable.updatedAt.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		const tableConfig = getTableConfig(commentsTable);

		it("should have exactly 2 foreign keys defined", () => {
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(Array.isArray(tableConfig.foreignKeys)).toBe(true);
			expect(tableConfig.foreignKeys.length).toBe(2);
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

		it("should have foreign key from postId to posts", () => {
			const postFk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some((col) => col.name === "post_id");
				},
			);
			expect(postFk).toBeDefined();
			const ref = postFk?.reference();
			expect(ref?.foreignTable).toBe(postsTable);
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
		let totalRelationCount = 0;

		beforeAll(() => {
			capturedRelations = {};
			totalRelationCount = 0;
			(
				commentsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					totalRelationCount++;
					if (getTableName(table) === "users") {
						capturedRelations.creator = { table, config };
					}
					if (getTableName(table) === "posts") {
						capturedRelations.post = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (table: Table, config?: CapturedRelation["config"]) => {
					totalRelationCount++;
					if (getTableName(table) === "comment_votes") {
						capturedRelations.votesWhereComment = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined", () => {
			expect(commentsTableRelations).toBeDefined();
		});

		it("should have the correct table reference", () => {
			expect(commentsTableRelations.table).toBe(commentsTable);
		});

		it("should have config function defined", () => {
			expect(typeof commentsTableRelations.config).toBe("function");
		});

		describe("votesWhereComment relation", () => {
			it("should be defined with correct configuration", () => {
				expect(capturedRelations.votesWhereComment).toBeDefined();
				const table = capturedRelations.votesWhereComment?.table;
				expect(getTableName(table as Table)).toBe("comment_votes");
				expect(capturedRelations.votesWhereComment?.config?.relationName).toBe(
					"comment_votes.comment_id:comments.id",
				);
			});
		});

		describe("creator relation", () => {
			it("should be defined with correct configuration", () => {
				expect(capturedRelations.creator).toBeDefined();
				const table = capturedRelations.creator?.table;
				expect(getTableName(table as Table)).toBe("users");
				expect(capturedRelations.creator?.config?.relationName).toBe(
					"comments.creator_id:users.id",
				);
				const fields = capturedRelations.creator?.config?.fields;
				expect(fields).toBeDefined();
				expect(fields?.[0]).toBe(commentsTable.creatorId);
			});
		});

		describe("post relation", () => {
			it("should be defined with correct configuration", () => {
				expect(capturedRelations.post).toBeDefined();
				const table = capturedRelations.post?.table;
				expect(getTableName(table as Table)).toBe("posts");
				expect(capturedRelations.post?.config?.relationName).toBe(
					"comments.post_id:posts.id",
				);
				const fields = capturedRelations.post?.config?.fields;
				expect(fields).toBeDefined();
				expect(fields?.[0]).toBe(commentsTable.postId);
			});
		});

		it("should define exactly three relations (votesWhereComment, creator, post)", () => {
			expect(totalRelationCount).toBe(3);
			expect(Object.keys(capturedRelations)).toHaveLength(3);
			expect(capturedRelations.votesWhereComment).toBeDefined();
			expect(capturedRelations.creator).toBeDefined();
			expect(capturedRelations.post).toBeDefined();
		});
	});

	describe("Insert Schema Validation", () => {
		const validPostId = "01234567-89ab-4def-a123-456789abcdef";

		describe("body field", () => {
			it("should accept valid body", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "A valid comment body",
					postId: validPostId,
				});
				expect(result.success).toBe(true);
			});

			it("should reject missing body", () => {
				const result = commentsTableInsertSchema.safeParse({
					postId: validPostId,
				});
				expect(result.success).toBe(false);
			});

			it("should reject empty body", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "",
					postId: validPostId,
				});
				expect(result.success).toBe(false);
			});

			it("should reject body exceeding max length", () => {
				const longBody = "a".repeat(COMMENT_BODY_MAX_LENGTH + 1);
				const result = commentsTableInsertSchema.safeParse({
					body: longBody,
					postId: validPostId,
				});
				expect(result.success).toBe(false);
			});

			it("should accept body at max length", () => {
				const maxBody = "a".repeat(COMMENT_BODY_MAX_LENGTH);
				const result = commentsTableInsertSchema.safeParse({
					body: maxBody,
					postId: validPostId,
				});
				expect(result.success).toBe(true);
			});

			it("should accept body with single character (min boundary)", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "x",
					postId: validPostId,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("postId field", () => {
			it("should accept valid UUID for postId", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "Comment text",
					postId: validPostId,
				});
				expect(result.success).toBe(true);
			});

			it("should reject missing postId", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "Comment text",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID for postId", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "Comment text",
					postId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("creatorId field", () => {
			it("should accept valid UUID for creatorId", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "Comment text",
					postId: validPostId,
					creatorId: "11111111-1111-4111-a111-111111111111",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined creatorId", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "Comment text",
					postId: validPostId,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID for creatorId", () => {
				const result = commentsTableInsertSchema.safeParse({
					body: "Comment text",
					postId: validPostId,
					creatorId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("complete data validation", () => {
			it("should accept complete valid comment data", () => {
				const completeData = {
					body: "Complete comment body",
					postId: validPostId,
					creatorId: "11111111-1111-4111-a111-111111111111",
				};
				expect(commentsTableInsertSchema.safeParse(completeData).success).toBe(
					true,
				);
			});

			it("should reject invalid data", () => {
				expect(commentsTableInsertSchema.safeParse({}).success).toBe(false);
				expect(commentsTableInsertSchema.safeParse(null).success).toBe(false);
				expect(
					commentsTableInsertSchema.safeParse({ body: "Only body" }).success,
				).toBe(false);
			});
		});
	});

	describe("Table Indexes", () => {
		const tableConfig = getTableConfig(commentsTable);

		const getColumnName = (col: unknown): string | undefined => {
			if (col && typeof col === "object" && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

		it("should have exactly 3 indexes defined", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
			expect(tableConfig.indexes.length).toBe(3);
		});

		it("should have indexes on created_at, creator_id, and post_id", () => {
			const indexedColumns = tableConfig.indexes.map(
				(idx) => idx.config.columns[0] && getColumnName(idx.config.columns[0]),
			);
			expect(indexedColumns).toContain("created_at");
			expect(indexedColumns).toContain("creator_id");
			expect(indexedColumns).toContain("post_id");
		});

		it("should have all indexes as non-unique", () => {
			tableConfig.indexes.forEach((idx) => {
				expect(idx.config.unique).toBe(false);
			});
		});
	});

	describe("Constants and Exports", () => {
		it("should export COMMENT_BODY_MAX_LENGTH as 2048", () => {
			expect(COMMENT_BODY_MAX_LENGTH).toBe(2048);
		});

		it("should export all required objects and constants", () => {
			expect(commentsTable).toBeDefined();
			expect(typeof commentsTable).toBe("object");
			expect(commentsTableRelations).toBeDefined();
			expect(typeof commentsTableRelations).toBe("object");
			expect(commentsTableInsertSchema).toBeDefined();
			expect(typeof commentsTableInsertSchema.parse).toBe("function");
			expect(typeof commentsTableInsertSchema.safeParse).toBe("function");
		});

		it("should have correct column data types", () => {
			expect(commentsTable.body.dataType).toBe("string");
			expect(commentsTable.id.dataType).toBe("string");
			expect(commentsTable.creatorId.dataType).toBe("string");
			expect(commentsTable.postId.dataType).toBe("string");
			expect(commentsTable.createdAt.dataType).toBe("date");
			expect(commentsTable.updatedAt.dataType).toBe("date");
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a comment with required fields only", async () => {
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			const [post] = await server.drizzleClient
				.insert(postsTable)
				.values({
					caption: "Test post",
					organizationId: org.id,
				})
				.returning();
			if (!post?.id) {
				throw new Error("Failed to create test post");
			}

			const [comment] = await server.drizzleClient
				.insert(commentsTable)
				.values({
					body: "Test comment body",
					postId: post.id,
				})
				.returning();

			expect(comment).toBeDefined();
			if (!comment) {
				throw new Error("Failed to insert comment");
			}
			expect(comment.id).toBeDefined();
			expect(comment.body).toBe("Test comment body");
			expect(comment.postId).toBe(post.id);
			expect(comment.creatorId).toBeNull();
			expect(comment.createdAt).toBeInstanceOf(Date);
			expect(comment.updatedAt).toBeNull();
		});

		it("should successfully insert a comment with creatorId", async () => {
			const [user] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: faker.internet.email(),
					name: faker.person.fullName(),
					passwordHash: await hash("password"),
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();
			if (!user?.id) {
				throw new Error("Failed to create test user");
			}

			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			const [post] = await server.drizzleClient
				.insert(postsTable)
				.values({
					caption: "Post for comment",
					organizationId: org.id,
				})
				.returning();
			if (!post?.id) {
				throw new Error("Failed to create test post");
			}

			const [comment] = await server.drizzleClient
				.insert(commentsTable)
				.values({
					body: "Comment by user",
					postId: post.id,
					creatorId: user.id,
				})
				.returning();

			expect(comment).toBeDefined();
			if (!comment) {
				throw new Error("Failed to insert comment");
			}
			expect(comment.creatorId).toBe(user.id);
		});

		it("should successfully select a comment", async () => {
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			const [post] = await server.drizzleClient
				.insert(postsTable)
				.values({
					caption: "Post",
					organizationId: org.id,
				})
				.returning();
			if (!post?.id) {
				throw new Error("Failed to create test post");
			}

			const [inserted] = await server.drizzleClient
				.insert(commentsTable)
				.values({
					body: "Comment to select",
					postId: post.id,
				})
				.returning();
			if (!inserted?.id) {
				throw new Error("Failed to insert comment");
			}

			const rows = await server.drizzleClient
				.select()
				.from(commentsTable)
				.where(eq(commentsTable.id, inserted.id));

			expect(rows).toHaveLength(1);
			expect(rows[0]?.body).toBe("Comment to select");
		});

		it("should successfully update a comment (exercises updatedAt onUpdate)", async () => {
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			const [post] = await server.drizzleClient
				.insert(postsTable)
				.values({
					caption: "Post",
					organizationId: org.id,
				})
				.returning();
			if (!post?.id) {
				throw new Error("Failed to create test post");
			}

			const [inserted] = await server.drizzleClient
				.insert(commentsTable)
				.values({
					body: "Original body",
					postId: post.id,
				})
				.returning();
			if (!inserted?.id) {
				throw new Error("Failed to insert comment");
			}

			const [updated] = await server.drizzleClient
				.update(commentsTable)
				.set({ body: "Updated body" })
				.where(eq(commentsTable.id, inserted.id))
				.returning();

			expect(updated).toBeDefined();
			if (!updated) {
				throw new Error("Failed to update comment");
			}
			expect(updated.body).toBe("Updated body");
			expect(updated.updatedAt).toBeInstanceOf(Date);
		});

		it("should successfully delete a comment", async () => {
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			const [post] = await server.drizzleClient
				.insert(postsTable)
				.values({
					caption: "Post",
					organizationId: org.id,
				})
				.returning();
			if (!post?.id) {
				throw new Error("Failed to create test post");
			}

			const [inserted] = await server.drizzleClient
				.insert(commentsTable)
				.values({
					body: "Comment to delete",
					postId: post.id,
				})
				.returning();
			if (!inserted?.id) {
				throw new Error("Failed to insert comment");
			}

			const [deleted] = await server.drizzleClient
				.delete(commentsTable)
				.where(eq(commentsTable.id, inserted.id))
				.returning();

			expect(deleted).toBeDefined();
			if (!deleted) {
				throw new Error("Failed to delete comment");
			}
			expect(deleted.id).toBe(inserted.id);
		});
	});
});
