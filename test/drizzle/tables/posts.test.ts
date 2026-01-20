import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	POST_BODY_MAX_LENGTH,
	POST_CAPTION_MAX_LENGTH,
	postsTable,
	postsTableInsertSchema,
	postsTableRelations,
} from "~/src/drizzle/tables/posts";

/**
 * Tests for postsTable definition - validates table schema, relations,
 * insert schema validation, database constraints, indexes, and primary key configuration.
 * This ensures the posts table is properly configured and all code paths are covered.
 */
describe("src/drizzle/tables/posts.ts - Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(postsTable)).toBe("posts");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(postsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("caption");
			expect(columns).toContain("body");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("pinnedAt");
			expect(columns.length).toBeGreaterThanOrEqual(9);
		});

		it("should have correct column names and properties", () => {
			expect(postsTable.id.name).toBe("id");
			expect(postsTable.id.primary).toBe(true);
			expect(postsTable.id.hasDefault).toBe(true);
			expect(postsTable.caption.name).toBe("caption");
			expect(postsTable.caption.notNull).toBe(true);
			expect(postsTable.body.name).toBe("body");
			expect(postsTable.body.notNull).toBe(false);
			expect(postsTable.createdAt.name).toBe("created_at");
			expect(postsTable.createdAt.notNull).toBe(true);
			expect(postsTable.createdAt.hasDefault).toBe(true);
			expect(postsTable.updatedAt.name).toBe("updated_at");
			expect(postsTable.updatedAt.hasDefault).toBe(true);
			expect(postsTable.organizationId.name).toBe("organization_id");
			expect(postsTable.organizationId.notNull).toBe(true);
			expect(postsTable.creatorId.name).toBe("creator_id");
			expect(postsTable.creatorId.notNull).toBe(false);
			expect(postsTable.updaterId.name).toBe("updater_id");
			expect(postsTable.updaterId.notNull).toBe(false);
			expect(postsTable.pinnedAt.name).toBe("pinned_at");
			expect(postsTable.pinnedAt.notNull).toBe(false);
		});
	});

	describe("Foreign Key Relationships", () => {
		const tableConfig = getTableConfig(postsTable);

		it("should have exactly 3 foreign keys defined", () => {
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(Array.isArray(tableConfig.foreignKeys)).toBe(true);
			expect(tableConfig.foreignKeys.length).toBe(3);
		});
	});

	describe("Table Relations", () => {
		// Helper type for captured relation data
		interface CapturedRelation {
			table: Table;
			config?: {
				relationName?: string;
				fields?: unknown[];
				references?: unknown[];
			};
		}

		// Type for the mock relation helpers
		interface MockRelationHelpers {
			one: (
				table: Table,
				config?: CapturedRelation["config"],
			) => {
				withFieldName: () => object;
			};
			many: (
				table: Table,
				config?: CapturedRelation["config"],
			) => {
				withFieldName: () => object;
			};
		}

		// Capture all relations by invoking the config function with mock helpers
		let capturedRelations: Record<string, CapturedRelation> = {};
		let totalRelationCount = 0;

		beforeAll(() => {
			capturedRelations = {};
			totalRelationCount = 0;
			(
				postsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					totalRelationCount++;
					if (
						getTableName(table) === "users" &&
						config?.fields?.[0] === postsTable.creatorId
					) {
						capturedRelations.creator = { table, config };
					}
					if (
						getTableName(table) === "users" &&
						config?.fields?.[0] === postsTable.updaterId
					) {
						capturedRelations.updater = { table, config };
					}
					if (getTableName(table) === "organizations") {
						capturedRelations.organization = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (table: Table, config?: CapturedRelation["config"]) => {
					totalRelationCount++;
					if (getTableName(table) === "comments") {
						capturedRelations.commentsWherePost = { table, config };
					}
					if (getTableName(table) === "post_attachments") {
						capturedRelations.attachmentsWherePost = { table, config };
					}
					if (getTableName(table) === "post_votes") {
						capturedRelations.votesWherePost = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined", () => {
			expect(postsTableRelations).toBeDefined();
		});

		it("should have the correct table reference", () => {
			expect(postsTableRelations.table).toBe(postsTable);
		});

		it("should have config function defined", () => {
			expect(typeof postsTableRelations.config).toBe("function");
		});

		describe("creator relation", () => {
			it("should be defined with correct configuration", () => {
				expect(capturedRelations.creator).toBeDefined();
				const table = capturedRelations.creator?.table;
				expect(getTableName(table as Table)).toBe("users");
				expect(capturedRelations.creator?.config?.relationName).toBe(
					"posts.creator_id:users.id",
				);
				const fields = capturedRelations.creator?.config?.fields;
				expect(fields).toBeDefined();
				expect(fields?.[0]).toBe(postsTable.creatorId);
			});
		});

		describe("updater relation", () => {
			it("should be defined with correct configuration", () => {
				expect(capturedRelations.updater).toBeDefined();
				const table = capturedRelations.updater?.table;
				expect(getTableName(table as Table)).toBe("users");
				expect(capturedRelations.updater?.config?.relationName).toBe(
					"posts.updater_id:users.id",
				);
			});
		});

		describe("organization relation", () => {
			it("should be defined with correct configuration", () => {
				expect(capturedRelations.organization).toBeDefined();
				const table = capturedRelations.organization?.table;
				expect(getTableName(table as Table)).toBe("organizations");
				expect(capturedRelations.organization?.config?.relationName).toBe(
					"organizations.id:posts.organization_id",
				);
			});
		});

		describe("many relations", () => {
			it("should have commentsWherePost relation", () => {
				expect(capturedRelations.commentsWherePost).toBeDefined();
				const table = capturedRelations.commentsWherePost?.table;
				expect(getTableName(table as Table)).toBe("comments");
			});

			it("should have attachmentsWherePost relation", () => {
				expect(capturedRelations.attachmentsWherePost).toBeDefined();
				const table = capturedRelations.attachmentsWherePost?.table;
				expect(getTableName(table as Table)).toBe("post_attachments");
			});

			it("should have votesWherePost relation", () => {
				expect(capturedRelations.votesWherePost).toBeDefined();
				const table = capturedRelations.votesWherePost?.table;
				expect(getTableName(table as Table)).toBe("post_votes");
			});
		});

		it("should define exactly six relations (creator, updater, organization, commentsWherePost, attachmentsWherePost, votesWherePost)", () => {
			expect(totalRelationCount).toBe(6);
			expect(Object.keys(capturedRelations)).toHaveLength(6);
			expect(capturedRelations.creator).toBeDefined();
			expect(capturedRelations.updater).toBeDefined();
			expect(capturedRelations.organization).toBeDefined();
			expect(capturedRelations.commentsWherePost).toBeDefined();
			expect(capturedRelations.attachmentsWherePost).toBeDefined();
			expect(capturedRelations.votesWherePost).toBeDefined();
		});
	});

	describe("Insert Schema Validation", () => {
		const validPostData = {
			caption: "Test post caption",
			organizationId: "01234567-89ab-cdef-0123-456789abcdef",
		};

		describe("caption field", () => {
			it("should accept valid caption", () => {
				const result = postsTableInsertSchema.safeParse(validPostData);
				expect(result.success).toBe(true);
			});

			it("should reject missing or empty caption", () => {
				const { caption: _caption, ...dataWithoutCaption } = validPostData;
				expect(
					postsTableInsertSchema.safeParse(dataWithoutCaption).success,
				).toBe(false);
				expect(
					postsTableInsertSchema.safeParse({ ...validPostData, caption: "" })
						.success,
				).toBe(false);
			});

			it("should reject caption exceeding max length", () => {
				const longCaption = "a".repeat(POST_CAPTION_MAX_LENGTH + 1);
				const result = postsTableInsertSchema.safeParse({
					...validPostData,
					caption: longCaption,
				});
				expect(result.success).toBe(false);
			});

			it("should accept caption at max length and with special characters", () => {
				const maxCaption = "a".repeat(POST_CAPTION_MAX_LENGTH);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						caption: maxCaption,
					}).success,
				).toBe(true);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						caption: "Test @#$% 测试 📝",
					}).success,
				).toBe(true);
			});
		});

		describe("body field", () => {
			it("should accept valid body or optional body", () => {
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						body: "This is the post body content",
					}).success,
				).toBe(true);
				expect(postsTableInsertSchema.safeParse(validPostData).success).toBe(
					true,
				);
				expect(
					postsTableInsertSchema.safeParse({ ...validPostData, body: null })
						.success,
				).toBe(true);
			});

			it("should reject body exceeding max length", () => {
				const longBody = "a".repeat(POST_BODY_MAX_LENGTH + 1);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						body: longBody,
					}).success,
				).toBe(false);
			});

			it("should accept body at max length", () => {
				const maxBody = "a".repeat(POST_BODY_MAX_LENGTH);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						body: maxBody,
					}).success,
				).toBe(true);
			});
		});

		describe("organizationId field", () => {
			it("should accept valid UUID for organizationId", () => {
				const result = postsTableInsertSchema.safeParse(validPostData);
				expect(result.success).toBe(true);
			});

			it("should reject missing or invalid organizationId", () => {
				const { organizationId: _organizationId, ...dataWithoutOrgId } =
					validPostData;
				expect(postsTableInsertSchema.safeParse(dataWithoutOrgId).success).toBe(
					false,
				);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						organizationId: "invalid-uuid",
					}).success,
				).toBe(false);
			});
		});

		describe("optional UUID fields", () => {
			it("should accept valid UUIDs for creatorId and updaterId", () => {
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						creatorId: "11111111-1111-1111-1111-111111111111",
					}).success,
				).toBe(true);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						updaterId: "22222222-2222-2222-2222-222222222222",
					}).success,
				).toBe(true);
			});

			it("should accept null/undefined for optional fields", () => {
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						creatorId: null,
					}).success,
				).toBe(true);
				expect(postsTableInsertSchema.safeParse(validPostData).success).toBe(
					true,
				);
			});

			it("should reject invalid UUID format for optional fields", () => {
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						creatorId: "invalid-uuid",
					}).success,
				).toBe(false);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						updaterId: "invalid-uuid",
					}).success,
				).toBe(false);
			});
		});

		describe("timestamp fields", () => {
			it("should accept valid Date objects for timestamp fields", () => {
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						createdAt: new Date(),
					}).success,
				).toBe(true);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						updatedAt: new Date(),
					}).success,
				).toBe(true);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						pinnedAt: new Date(),
					}).success,
				).toBe(true);
			});

			it("should accept undefined for timestamp fields with defaults", () => {
				expect(postsTableInsertSchema.safeParse(validPostData).success).toBe(
					true,
				);
			});

			it("should reject invalid timestamp formats", () => {
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						createdAt: "2024-01-15",
					}).success,
				).toBe(false);
				expect(
					postsTableInsertSchema.safeParse({
						...validPostData,
						updatedAt: Date.now(),
					}).success,
				).toBe(false);
			});
		});

		describe("complete data validation", () => {
			it("should accept complete valid post data", () => {
				const completeData = {
					caption: "Complete post caption",
					body: "Complete post body",
					organizationId: "01234567-89ab-cdef-0123-456789abcdef",
					creatorId: "11111111-1111-1111-1111-111111111111",
					updaterId: "22222222-2222-2222-2222-222222222222",
					createdAt: new Date(),
					updatedAt: new Date(),
					pinnedAt: new Date(),
				};
				expect(postsTableInsertSchema.safeParse(completeData).success).toBe(
					true,
				);
			});

			it("should reject invalid data", () => {
				expect(postsTableInsertSchema.safeParse({}).success).toBe(false);
				expect(postsTableInsertSchema.safeParse(null).success).toBe(false);
				expect(
					postsTableInsertSchema.safeParse({ caption: "Caption only" }).success,
				).toBe(false);
			});
		});
	});

	describe("Table Indexes", () => {
		const tableConfig = getTableConfig(postsTable);

		const getColumnName = (col: unknown): string | undefined => {
			if (col && typeof col === "object" && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

		it("should have exactly 4 indexes defined", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
			expect(tableConfig.indexes.length).toBe(4);
		});

		it("should have indexes on key columns", () => {
			const indexedColumns = tableConfig.indexes.map(
				(idx) => idx.config.columns[0] && getColumnName(idx.config.columns[0]),
			);
			expect(indexedColumns).toContain("created_at");
			expect(indexedColumns).toContain("creator_id");
			expect(indexedColumns).toContain("pinned_at");
			expect(indexedColumns).toContain("organization_id");
		});

		it("should have all indexes as non-unique", () => {
			tableConfig.indexes.forEach((idx) => {
				expect(idx.config.unique).toBe(false);
			});
		});
	});

	describe("Table Configuration and Exports", () => {
		const tableConfig = getTableConfig(postsTable);

		it("should have correct table configuration", () => {
			expect(tableConfig).toBeDefined();
			expect(tableConfig.name).toBe("posts");
			expect(tableConfig.columns.length).toBe(9);
			expect(tableConfig.foreignKeys.length).toBe(3);
			expect(tableConfig.primaryKeys).toBeDefined();
		});

		it("should export all required objects and constants", () => {
			expect(postsTable).toBeDefined();
			expect(typeof postsTable).toBe("object");
			expect(postsTableRelations).toBeDefined();
			expect(typeof postsTableRelations).toBe("object");
			expect(postsTableInsertSchema).toBeDefined();
			expect(typeof postsTableInsertSchema.parse).toBe("function");
			expect(typeof postsTableInsertSchema.safeParse).toBe("function");
			expect(POST_CAPTION_MAX_LENGTH).toBe(2048);
			expect(POST_BODY_MAX_LENGTH).toBe(2048);
		});

		it("should have correct column data types", () => {
			expect(postsTable.caption.dataType).toBe("string");
			expect(postsTable.body.dataType).toBe("string");
			expect(postsTable.id.dataType).toBe("string");
			expect(postsTable.creatorId.dataType).toBe("string");
			expect(postsTable.updaterId.dataType).toBe("string");
			expect(postsTable.organizationId.dataType).toBe("string");
			expect(postsTable.createdAt.dataType).toBe("date");
			expect(postsTable.updatedAt.dataType).toBe("date");
			expect(postsTable.pinnedAt.dataType).toBe("date");
		});
	});
});
