import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import { organizationsTable, usersTable } from "~/src/drizzle/schema";
import {
	tagFoldersTable,
	tagFoldersTableInsertSchema,
	tagFoldersTableRelations,
} from "~/src/drizzle/tables/tagFolders";

interface CapturedRelation {
	table: Table;
	type: "one" | "many";
	config: {
		relationName: string;
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

let capturedRelations: Record<string, CapturedRelation> = {};

describe("tagFoldersTable", () => {
	describe("tagFoldersTableInsertSchema", () => {
		const validData = {
			name: "Sample Folder",
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
		};
		it("should validate correct data", () => {
			const result = tagFoldersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should invalidate on missing name", () => {
			const result = tagFoldersTableInsertSchema.safeParse({
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});
		it("should invalidate a name exceeding 256 characters", () => {
			const longName = "a".repeat(257);
			const result = tagFoldersTableInsertSchema.safeParse({
				name: longName,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});
		it("should invalidate a missing organizationId", () => {
			const result = tagFoldersTableInsertSchema.safeParse({
				name: "tagFolder without Org",
			});
			expect(result.success).toBe(false);
		});
		it("should validate a name with 1 character", () => {
			const result = tagFoldersTableInsertSchema.safeParse({
				name: "A",
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});
		it("should validate a name with 256 characters", () => {
			const longName = "a".repeat(256);
			const result = tagFoldersTableInsertSchema.safeParse({
				name: longName,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});
		it("should invalidate a name with 0 characters", () => {
			const result = tagFoldersTableInsertSchema.safeParse({
				name: "",
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});
		it("should invalidate if organisationId is not a valid uuid", () => {
			const result = tagFoldersTableInsertSchema.safeParse({
				name: "Valid Name",
				organizationId: "invalid-uuid",
			});

			expect(result.success).toBe(false);

			if (!result.success) {
				const fieldsWithErrors = result.error.issues.map((i) => i.path[0]);
				expect(fieldsWithErrors).toContain("organizationId");
			}
		});
	});
	describe("tagFoldersTable Structure", () => {
		it("it should have createdAt field", () => {
			expect(tagFoldersTable.createdAt).toBeDefined();
		});
		it("it should have creatorId field", () => {
			expect(tagFoldersTable.creatorId).toBeDefined();
		});
		it("it should have id field", () => {
			expect(tagFoldersTable.id).toBeDefined();
		});
		it("it should have name field", () => {
			expect(tagFoldersTable.name).toBeDefined();
		});
		it("it should have organizationId field", () => {
			expect(tagFoldersTable.organizationId).toBeDefined();
		});
		it("it should have parentFolderId field", () => {
			expect(tagFoldersTable.parentFolderId).toBeDefined();
		});
		it("it should have updaterId field", () => {
			expect(tagFoldersTable.updaterId).toBeDefined();
		});
		it("it should have updatedAt field", () => {
			expect(tagFoldersTable.updatedAt).toBeDefined();
		});
	});
	describe("tagFoldersTable indexes", () => {
		const tableConfig = getTableConfig(tagFoldersTable);
		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined => {
			if (col && "name" in col) return col.name;
			return undefined;
		};

		it("should have index on createdAt", () => {
			const hasIndex = tableConfig.indexes.some((index) => {
				const colName = getColumnName(index.config.columns[0]);
				return colName === "created_at";
			});
			expect(hasIndex).toBe(true);
		});

		it("should have index on creatorId", () => {
			const hasIndex = tableConfig.indexes.some((index) => {
				const colName = getColumnName(index.config.columns[0]);
				return colName === "creator_id";
			});
			expect(hasIndex).toBe(true);
		});
		it("should have index on name", () => {
			const hasIndex = tableConfig.indexes.some((index) => {
				const colName = getColumnName(index.config.columns[0]);
				return colName === "name";
			});
			expect(hasIndex).toBe(true);
		});
		it("should have index on organizationId", () => {
			const hasIndex = tableConfig.indexes.some((index) => {
				const colName = getColumnName(index.config.columns[0]);
				return colName === "organization_id";
			});
			expect(hasIndex).toBe(true);
		});
		it("should have index on parentFolderId", () => {
			const hasIndex = tableConfig.indexes.some((index) => {
				const colName = getColumnName(index.config.columns[0]);
				return colName === "parent_folder_id";
			});
			expect(hasIndex).toBe(true);
		});
	});
	describe("tagFoldersTable relations", () => {
		beforeAll(() => {
			capturedRelations = {};

			(
				tagFoldersTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (!config) {
						return { withFieldName: () => ({}) };
					}

					const name = config.relationName;

					if (name.includes("creator")) {
						capturedRelations.creator = { table, config, type: "one" };
					}
					if (name.includes("organization")) {
						capturedRelations.organization = { table, config, type: "one" };
					}
					if (name.includes("updater")) {
						capturedRelations.updater = { table, config, type: "one" };
					}
					if (name.includes("parent_folder")) {
						capturedRelations.parentFolder = { table, config, type: "one" };
					}
					return { withFieldName: () => ({}) };
				},

				many: (table: Table, config?: CapturedRelation["config"]) => {
					if (!config) {
						return { withFieldName: () => ({}) };
					}

					const name = config.relationName;

					if (name === "tag_folders.id:tags.folder_id") {
						capturedRelations.tagsWhereFolder = { table, config, type: "many" };
					}
					if (name === "tag_folders.id:tag_folders.parent_folder_id") {
						capturedRelations.tagFoldersWhereParentFolder = {
							table,
							config,
							type: "many",
						};
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		describe("creator relation", () => {
			it("should have a relation defination", () => {
				expect(capturedRelations.creator).toBeDefined();
			});
			it("should relate to usersTable", () => {
				const table = capturedRelations?.creator?.table;
				expect(table).toBeDefined();
				if (table) {
					const tableName = getTableName(table);
					expect(tableName).toBe("users");
				}
			});
			it("should have correct relation names", () => {
				const relationName = capturedRelations?.creator?.config.relationName;
				expect(relationName).toBe("tag_folders.creator_id:users.id");
			});
			it("should have many to one relation", () => {
				const relationType = capturedRelations?.creator?.type;
				expect(relationType).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.creator?.config.fields;
				const references = capturedRelations?.creator?.config.references;

				expect(fields).toEqual([tagFoldersTable.creatorId]);
				expect(references).toEqual([usersTable.id]);
			});
		});
		describe("organization relation", () => {
			it("should have a relation defination", () => {
				expect(capturedRelations.organization).toBeDefined();
			});
			it("should relate to organizationsTable", () => {
				const table = capturedRelations?.organization?.table;
				expect(table).toBeDefined();
				if (table) {
					const tableName = getTableName(table);
					expect(tableName).toBe("organizations");
				}
			});
			it("should have correct relation names", () => {
				const relationName =
					capturedRelations?.organization?.config.relationName;
				expect(relationName).toBe(
					"organizations.id:tag_folders.organization_id",
				);
			});
			it("should have many to one relation", () => {
				const relationType = capturedRelations?.organization?.type;
				expect(relationType).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.organization?.config.fields;
				const references = capturedRelations?.organization?.config.references;
				expect(fields).toEqual([tagFoldersTable.organizationId]);
				expect(references).toEqual([organizationsTable.id]);
			});
		});
		describe("Parent Folder relation", () => {
			it("should have a relation defination", () => {
				expect(capturedRelations.parentFolder).toBeDefined();
			});
			it("should relate to tagFoldersTable", () => {
				const table = capturedRelations?.parentFolder?.table;
				expect(table).toBeDefined();
				if (table) {
					const tableName = getTableName(table);
					expect(tableName).toBe("tag_folders");
				}
			});
			it("should have correct relation names", () => {
				const relationName =
					capturedRelations?.parentFolder?.config.relationName;
				expect(relationName).toBe(
					"tag_folders.id:tag_folders.parent_folder_id",
				);
			});
			it("should have many to one relation", () => {
				const relationType = capturedRelations?.parentFolder?.type;
				expect(relationType).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.parentFolder?.config.fields;
				const references = capturedRelations?.parentFolder?.config.references;
				expect(fields).toEqual([tagFoldersTable.parentFolderId]);
				expect(references).toEqual([tagFoldersTable.id]);
			});
		});
		describe("tagsWhereFolder relation", () => {
			it("should have a relation defination", () => {
				expect(capturedRelations.tagsWhereFolder).toBeDefined();
			});
			it("should relate to tagsTable", () => {
				const table = capturedRelations?.tagsWhereFolder?.table;
				expect(table).toBeDefined();
				if (table) {
					const tableName = getTableName(table);
					expect(tableName).toBe("tags");
				}
			});
			it("should have correct relation names", () => {
				const relationName =
					capturedRelations?.tagsWhereFolder?.config.relationName;
				expect(relationName).toBe("tag_folders.id:tags.folder_id");
			});
			it("should have one to many relation", () => {
				const relationType = capturedRelations?.tagsWhereFolder?.type;
				expect(relationType).toBe("many");
			});
		});
		describe("tagFoldersWhereParentFolder relation", () => {
			it("should have a relation defination", () => {
				expect(capturedRelations.tagFoldersWhereParentFolder).toBeDefined();
			});
			it("should relate to tagFoldersTable", () => {
				const table = capturedRelations?.tagFoldersWhereParentFolder?.table;
				expect(table).toBeDefined();
				if (table) {
					const tableName = getTableName(table);
					expect(tableName).toBe("tag_folders");
				}
			});
			it("should have correct relation names", () => {
				const relationName =
					capturedRelations?.tagFoldersWhereParentFolder?.config.relationName;
				expect(relationName).toBe(
					"tag_folders.id:tag_folders.parent_folder_id",
				);
			});
			it("should have one to many relation", () => {
				const relationType =
					capturedRelations?.tagFoldersWhereParentFolder?.type;
				expect(relationType).toBe("many");
			});
		});
		describe("updater relation", () => {
			it("should have a relation defination", () => {
				expect(capturedRelations.updater).toBeDefined();
			});
			it("should relate to usersTable", () => {
				const table = capturedRelations?.updater?.table;
				expect(table).toBeDefined();
				if (table) {
					const tableName = getTableName(table);
					expect(tableName).toBe("users");
				}
			});
			it("should have correct relation names", () => {
				const relationName = capturedRelations?.updater?.config.relationName;
				expect(relationName).toBe("tag_folders.updater_id:users.id");
			});
			it("should have many to one relation", () => {
				const relationType = capturedRelations?.updater?.type;
				expect(relationType).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.updater?.config.fields;
				const references = capturedRelations?.updater?.config.references;
				expect(fields).toEqual([tagFoldersTable.updaterId]);
				expect(references).toEqual([usersTable.id]);
			});
		});
	});
	describe("tagFoldersTable Additional tests", () => {
		const tableConfig = getTableConfig(tagFoldersTable);
		it("should enforce notNull constraints on name and organizationId", () => {
			const nameColumn = tableConfig.columns.find((col) => col.name === "name");
			const organizationIdColumn = tableConfig.columns.find(
				(col) => col.name === "organization_id",
			);

			expect(nameColumn?.notNull).toBe(true);
			expect(organizationIdColumn?.notNull).toBe(true);
		});

		it("should have id as primary key", () => {
			const idColumn = tableConfig.columns.find((col) => col.name === "id");
			expect(idColumn?.primary).toBe(true);
		});
		it("should have default for createdAt and onUpdateFn for updatedAt", () => {
			const createdAtColumn = tableConfig.columns.find(
				(col) => col.name === "created_at",
			);
			const updatedAtColumn = tableConfig.columns.find(
				(col) => col.name === "updated_at",
			);

			expect(createdAtColumn?.hasDefault).toBe(true);
			expect(updatedAtColumn?.onUpdateFn).toBeDefined();
		});
	});
});
