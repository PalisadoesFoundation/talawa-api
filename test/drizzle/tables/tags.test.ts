import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { tagFoldersTable } from "~/src/drizzle/tables/tagFolders";
import {
	tagsTable,
	tagsTableInsertSchema,
	tagsTableRelations,
} from "~/src/drizzle/tables/tags";
import { usersTable } from "~/src/drizzle/tables/users";

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

describe("tagsTable", () => {
	describe("tagsTableInsertSchema", () => {
		const validData = {
			name: "Important Tag",
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
		};
		it("should validate correct data", () => {
			const result = tagsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
		it("should invalidate an empty name", () => {
			const result = tagsTableInsertSchema.safeParse({
				name: "",
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});
		it("should invalidate a name exceeding 256 characters", () => {
			const longName = "a".repeat(257);
			const result = tagsTableInsertSchema.safeParse({
				name: longName,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});
		it("should invalidate a missing organizationId", () => {
			const result = tagsTableInsertSchema.safeParse({
				name: "Tag without Org",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("tagsTable structure", () => {
		it("should have a creatorId field", () => {
			expect(tagsTable).toHaveProperty("creatorId");
		});
		it("should have a createdAt field", () => {
			expect(tagsTable).toHaveProperty("createdAt");
		});
		it("should have a folderId field", () => {
			expect(tagsTable).toHaveProperty("folderId");
		});
		it("should have an id field", () => {
			expect(tagsTable).toHaveProperty("id");
		});
		it("should have a name field", () => {
			expect(tagsTable).toHaveProperty("name");
		});
		it("should have an organizationId field", () => {
			expect(tagsTable).toHaveProperty("organizationId");
		});
		it("should have an updatedAt field", () => {
			expect(tagsTable).toHaveProperty("updatedAt");
		});
		it("should have an updaterId field", () => {
			expect(tagsTable).toHaveProperty("updaterId");
		});
	});

	describe("tagsTable Indexes", () => {
		const tableConfig = getTableConfig(tagsTable);
		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined => {
			if (col && "name" in col) return col.name;
			return undefined;
		};

		it("should have an index on creatorId", () => {
			const hasIndex = tableConfig.indexes.some(
				(index) =>
					index.config.columns.length === 1 &&
					getColumnName(index.config.columns[0]) === "creator_id",
			);
			expect(hasIndex).toBe(true);
		});

		it("should have an index on name", () => {
			const hasIndex = tableConfig.indexes.some(
				(index) =>
					index.config.columns.length === 1 &&
					getColumnName(index.config.columns[0]) === "name",
			);
			expect(hasIndex).toBe(true);
		});

		it("should have an index on organizationId", () => {
			const hasIndex = tableConfig.indexes.some(
				(index) =>
					index.config.columns.length === 1 &&
					getColumnName(index.config.columns[0]) === "organization_id",
			);
			expect(hasIndex).toBe(true);
		});

		it("should have a unique composite index on name and organizationId", () => {
			const hasUniqueIndex = tableConfig.indexes.some(
				(index) =>
					index.config.columns.length === 2 &&
					getColumnName(index.config.columns[0]) === "name" &&
					getColumnName(index.config.columns[1]) === "organization_id" &&
					index.config.unique,
			);
			expect(hasUniqueIndex).toBe(true);
		});
	});
	describe("tagsTable Relations", () => {
		beforeAll(() => {
			capturedRelations = {};

			(
				tagsTableRelations.config as unknown as (
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
					if (name.includes("updater")) {
						capturedRelations.updater = { table, config, type: "one" };
					}
					if (name.includes("folder")) {
						capturedRelations.folder = { table, config, type: "one" };
					}
					if (name.includes("organization")) {
						capturedRelations.organization = { table, config, type: "one" };
					}

					return { withFieldName: () => ({}) };
				},

				many: (table: Table, config?: CapturedRelation["config"]) => {
					if (!config) {
						return { withFieldName: () => ({}) };
					}

					const name = config.relationName;

					if (name.includes("tag_assignments")) {
						capturedRelations.tagAssignmentsWhereTag = {
							table,
							config,
							type: "many",
						};
					}

					return { withFieldName: () => ({}) };
				},
			});
		});

		describe("creator relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.creator).toBeDefined();
			});
			it("should reference usersTable", () => {
				const table = capturedRelations?.creator?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("users");
				}
			});
			it("should have correct relation names", () => {
				const relationName = capturedRelations?.creator?.config.relationName;
				expect(relationName).toBe("tags.creator_id:users.id");
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.creator?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.creator?.config.fields;
				const references = capturedRelations?.creator?.config.references;
				expect(fields).toEqual([tagsTable.creatorId]);
				expect(references).toEqual([usersTable.id]);
			});
		});
		describe("Folder relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.folder).toBeDefined();
			});
			it("should reference tagFoldersTable", () => {
				const table = capturedRelations?.folder?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("tag_folders");
				}
			});
			it("should have correct relation names", () => {
				const relationName = capturedRelations?.folder?.config.relationName;
				expect(relationName).toBe("tag_folders.id:tags.folder_id");
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.folder?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.folder?.config.fields;
				const references = capturedRelations?.folder?.config.references;
				expect(fields).toEqual([tagsTable.folderId]);
				expect(references).toEqual([tagFoldersTable.id]);
			});
		});
		describe("Organization relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.organization).toBeDefined();
			});
			it("should reference organizationsTable", () => {
				const table = capturedRelations?.organization?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("organizations");
				}
			});
			it("should have correct relation names", () => {
				const relationName =
					capturedRelations?.organization?.config.relationName;
				expect(relationName).toBe("organizations.id:tags.organization_id");
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.organization?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.organization?.config.fields;
				const references = capturedRelations?.organization?.config.references;
				expect(fields).toEqual([tagsTable.organizationId]);
				expect(references).toEqual([organizationsTable.id]);
			});
		});
		describe("TagAssignmentsWhereTag relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.tagAssignmentsWhereTag).toBeDefined();
			});
			it("should reference tagAssignmentsTable", () => {
				const table = capturedRelations?.tagAssignmentsWhereTag?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("tag_assignments");
				}
			});
			it("should have correct relation names", () => {
				const relationName =
					capturedRelations?.tagAssignmentsWhereTag?.config.relationName;
				expect(relationName).toBe("tag_assignments.tag_id:tags.id");
			});
			it("should be a one-to-many relation", () => {
				expect(capturedRelations.tagAssignmentsWhereTag?.type).toBe("many");
			});
			it("should not define fields or references on the many side", () => {
				expect(capturedRelations.tagAssignmentsWhereTag).toBeDefined();
				const relation = capturedRelations.tagAssignmentsWhereTag;
				if (relation) {
					const { config } = relation;
					expect(config.fields).toBeUndefined();
					expect(config.references).toBeUndefined();
				}
			});
		});
		describe("updater relations", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.updater).toBeDefined();
			});
			it("should reference usersTable", () => {
				const table = capturedRelations?.updater?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("users");
				}
			});
			it("should have correct relation names", () => {
				const relationName = capturedRelations?.updater?.config.relationName;
				expect(relationName).toBe("tags.updater_id:users.id");
			});
			it("should be a many-to-one relation", () => {
				expect(capturedRelations.updater?.type).toBe("one");
			});
			it("should have correct fields and references", () => {
				const fields = capturedRelations?.updater?.config.fields;
				const references = capturedRelations?.updater?.config.references;
				expect(fields).toEqual([tagsTable.updaterId]);
				expect(references).toEqual([usersTable.id]);
			});
		});
	});

	describe("tagsTable additional tests", () => {
		const tableConfig = getTableConfig(tagsTable);

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

	describe("tagsTableInsertSchema boundary tests", () => {
		it("should validate a name with exactly 256 characters", () => {
			const validName = "a".repeat(256);
			const result = tagsTableInsertSchema.safeParse({
				name: validName,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});

		it("should invalidate an organizationId with incorrect UUID format", () => {
			const invalidUUID = "12345";
			const result = tagsTableInsertSchema.safeParse({
				name: "Valid Name",
				organizationId: invalidUUID,
			});
			expect(result.success).toBe(false);
		});
	});
});
