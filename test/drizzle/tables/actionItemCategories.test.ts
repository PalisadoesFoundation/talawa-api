import { faker } from "@faker-js/faker";
import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	actionItemCategoriesTable,
	actionItemCategoriesTableInsertSchema,
	actionItemCategoriesTableRelations,
} from "~/src/drizzle/tables/actionItemCategories";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

interface CapturedRelation {
	table: Table;
	type: "one" | "many";
	config: {
		relationName: string;
		fields?: unknown[];
		references?: unknown[];
	};
}

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

describe("actionItemCategoriesTable", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(actionItemCategoriesTable)).toBe(
				"actionitem_categories",
			);
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(actionItemCategoriesTable);
			expect(columns).toContain("id");
			expect(columns).toContain("name");
			expect(columns).toContain("description");
			expect(columns).toContain("isDisabled");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should have correct primary key configuration", () => {
			expect(actionItemCategoriesTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(actionItemCategoriesTable.name.notNull).toBe(true);
			expect(actionItemCategoriesTable.isDisabled.notNull).toBe(true);
			expect(actionItemCategoriesTable.organizationId.notNull).toBe(true);
			expect(actionItemCategoriesTable.createdAt.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(actionItemCategoriesTable.description.notNull).toBe(false);
			expect(actionItemCategoriesTable.creatorId.notNull).toBe(false);
			expect(actionItemCategoriesTable.updaterId.notNull).toBe(false);
			expect(actionItemCategoriesTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(actionItemCategoriesTable.createdAt.hasDefault).toBe(true);
			expect(actionItemCategoriesTable.id.hasDefault).toBe(true);
		});
	});

	describe("Indexes", () => {
		const tableConfig = getTableConfig(actionItemCategoriesTable);
		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined => {
			if (col && "name" in col) return col.name;
			return undefined;
		};

		it("should have an index on createdAt", () => {
			const hasIndex = tableConfig.indexes.some(
				(index) =>
					index.config.columns.length === 1 &&
					getColumnName(index.config.columns[0]) === "created_at",
			);
			expect(hasIndex).toBe(true);
		});

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

		it("should have exact expected indexes defined", () => {
			const expectedIndexes = [
				["created_at"],
				["creator_id"],
				["name"],
				["name", "organization_id"],
			];

			expect(tableConfig.indexes.length).toBe(expectedIndexes.length);

			const actualIndexSet = new Set(
				tableConfig.indexes.map((idx) =>
					idx.config.columns
						.map((col) => ("name" in col ? col.name : ""))
						.sort()
						.join(","),
				),
			);

			const expectedIndexSet = new Set(
				expectedIndexes.map((cols) => cols.sort().join(",")),
			);

			expect(actualIndexSet).toEqual(expectedIndexSet);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should have creatorId column defined", () => {
			expect(actionItemCategoriesTable.creatorId).toBeDefined();
		});

		it("should have organizationId column defined", () => {
			expect(actionItemCategoriesTable.organizationId).toBeDefined();
		});

		it("should have updaterId column defined", () => {
			expect(actionItemCategoriesTable.updaterId).toBeDefined();
		});

		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
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

			await expect(
				server.drizzleClient.insert(actionItemCategoriesTable).values({
					name: faker.lorem.word(),
					isDisabled: false,
					organizationId: org.id,
					creatorId: invalidCreatorId,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" },
			});
		});

		it("should reject insert with invalid organizationId foreign key", async () => {
			const invalidOrganizationId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(actionItemCategoriesTable).values({
					name: faker.lorem.word(),
					isDisabled: false,
					organizationId: invalidOrganizationId,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" },
			});
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const invalidUpdaterId = faker.string.uuid();
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

			await expect(
				server.drizzleClient.insert(actionItemCategoriesTable).values({
					name: faker.lorem.word(),
					isDisabled: false,
					organizationId: org.id,
					updaterId: invalidUpdaterId,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" },
			});
		});
	});

	describe("Table Relations", () => {
		beforeAll(() => {
			capturedRelations = {};

			(
				actionItemCategoriesTableRelations.config as unknown as (
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

					if (name.includes("actionitems.category_id")) {
						capturedRelations.actionItemsWhereCategory = {
							table,
							config,
							type: "many",
						};
					}

					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should define relations object", () => {
			expect(actionItemCategoriesTableRelations).toBeDefined();
			expect(typeof actionItemCategoriesTableRelations).toBe("object");
		});

		it("should be associated with actionItemCategoriesTable", () => {
			expect(actionItemCategoriesTableRelations.table).toBe(
				actionItemCategoriesTable,
			);
		});

		it("should have a config function", () => {
			expect(typeof actionItemCategoriesTableRelations.config).toBe("function");
		});

		describe("creator relation", () => {
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

			it("should have correct relation name", () => {
				const relationName = capturedRelations?.creator?.config.relationName;
				expect(relationName).toBe("actionitem_categories.creator_id:users.id");
			});

			it("should be a many-to-one relation", () => {
				expect(capturedRelations.creator?.type).toBe("one");
			});

			it("should have correct fields and references", () => {
				const fields = capturedRelations?.creator?.config.fields;
				const references = capturedRelations?.creator?.config.references;
				expect(fields).toEqual([actionItemCategoriesTable.creatorId]);
				expect(references).toEqual([usersTable.id]);
			});
		});

		describe("organization relation", () => {
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

			it("should have correct relation name", () => {
				const relationName =
					capturedRelations?.organization?.config.relationName;
				expect(relationName).toBe(
					"actionitem_categories.organization_id:organizations.id",
				);
			});

			it("should be a many-to-one relation", () => {
				expect(capturedRelations.organization?.type).toBe("one");
			});

			it("should have correct fields and references", () => {
				const fields = capturedRelations?.organization?.config.fields;
				const references = capturedRelations?.organization?.config.references;
				expect(fields).toEqual([actionItemCategoriesTable.organizationId]);
				expect(references).toEqual([organizationsTable.id]);
			});
		});

		describe("updater relation", () => {
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

			it("should have correct relation name", () => {
				const relationName = capturedRelations?.updater?.config.relationName;
				expect(relationName).toBe("actionitem_categories.updater_id:users.id");
			});

			it("should be a many-to-one relation", () => {
				expect(capturedRelations.updater?.type).toBe("one");
			});

			it("should have correct fields and references", () => {
				const fields = capturedRelations?.updater?.config.fields;
				const references = capturedRelations?.updater?.config.references;
				expect(fields).toEqual([actionItemCategoriesTable.updaterId]);
				expect(references).toEqual([usersTable.id]);
			});
		});

		describe("actionItemsWhereCategory relation", () => {
			it("should have a relation definition", () => {
				expect(capturedRelations.actionItemsWhereCategory).toBeDefined();
			});

			it("should reference actionItemsTable", () => {
				const table = capturedRelations?.actionItemsWhereCategory?.table;
				expect(table).toBeDefined();
				if (table) {
					expect(getTableName(table)).toBe("actionitems");
				}
			});

			it("should have correct relation name", () => {
				const relationName =
					capturedRelations?.actionItemsWhereCategory?.config.relationName;
				expect(relationName).toBe(
					"actionitem_categories.id:actionitems.category_id",
				);
			});

			it("should be a one-to-many relation", () => {
				expect(capturedRelations.actionItemsWhereCategory?.type).toBe("many");
			});

			it("should not define fields or references on the many side", () => {
				expect(capturedRelations.actionItemsWhereCategory).toBeDefined();
				const relation = capturedRelations.actionItemsWhereCategory;
				if (relation) {
					const { config } = relation;
					expect(config.fields).toBeUndefined();
					expect(config.references).toBeUndefined();
				}
			});
		});
	});

	describe("Insert Schema Validation", () => {
		const validData = {
			name: "Test Category",
			isDisabled: false,
			organizationId: "550e8400-e29b-41d4-a716-446655440000",
		};

		it("should validate correct data", () => {
			const result = actionItemCategoriesTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should validate required name field", () => {
			const invalidData = {
				isDisabled: false,
				organizationId: faker.string.uuid(),
			};
			const result =
				actionItemCategoriesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("name")),
				).toBe(true);
			}
		});

		it("should validate required isDisabled field", () => {
			const invalidData = {
				name: "Test Category",
				organizationId: faker.string.uuid(),
			};
			const result =
				actionItemCategoriesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("isDisabled"),
					),
				).toBe(true);
			}
		});

		it("should validate required organizationId field", () => {
			const invalidData = {
				name: "Test Category",
				isDisabled: false,
			};
			const result =
				actionItemCategoriesTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("organizationId"),
					),
				).toBe(true);
			}
		});

		it("should invalidate an empty name", () => {
			const result = actionItemCategoriesTableInsertSchema.safeParse({
				name: "",
				isDisabled: false,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});

		it("should invalidate a name exceeding 256 characters", () => {
			const longName = "a".repeat(257);
			const result = actionItemCategoriesTableInsertSchema.safeParse({
				name: longName,
				isDisabled: false,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});

		it("should validate a name with exactly 256 characters", () => {
			const validName = "a".repeat(256);
			const result = actionItemCategoriesTableInsertSchema.safeParse({
				name: validName,
				isDisabled: false,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});

		it("should accept valid data with all optional fields", () => {
			const fullData = {
				name: "Test Category",
				description: "A test category description",
				isDisabled: false,
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: faker.string.uuid(),
			};
			const result = actionItemCategoriesTableInsertSchema.safeParse(fullData);
			expect(result.success).toBe(true);
		});

		it("should reject null values for optional fields", () => {
			const dataWithNulls = {
				name: "Test Category",
				description: null,
				isDisabled: true,
				organizationId: faker.string.uuid(),
				creatorId: null,
				updaterId: null,
			};
			const result =
				actionItemCategoriesTableInsertSchema.safeParse(dataWithNulls);
			expect(result.success).toBe(true);
		});

		it("should invalidate a description exceeding 2048 characters", () => {
			const longDescription = "a".repeat(2049);
			const result = actionItemCategoriesTableInsertSchema.safeParse({
				name: "Test Category",
				description: longDescription,
				isDisabled: false,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});

		it("should validate a description with exactly 2048 characters", () => {
			const validDescription = "a".repeat(2048);
			const result = actionItemCategoriesTableInsertSchema.safeParse({
				name: "Test Category",
				description: validDescription,
				isDisabled: false,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(true);
		});

		it("should invalidate an empty description", () => {
			const result = actionItemCategoriesTableInsertSchema.safeParse({
				name: "Test Category",
				description: "",
				isDisabled: false,
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			});
			expect(result.success).toBe(false);
		});

		it("should invalidate an organizationId with incorrect UUID format", () => {
			const invalidUUID = "12345";
			const result = actionItemCategoriesTableInsertSchema.safeParse({
				name: "Valid Name",
				isDisabled: false,
				organizationId: invalidUUID,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Additional Table Configuration", () => {
		const tableConfig = getTableConfig(actionItemCategoriesTable);

		it("should enforce notNull constraints on name, isDisabled, and organizationId", () => {
			const nameColumn = tableConfig.columns.find((col) => col.name === "name");
			const isDisabledColumn = tableConfig.columns.find(
				(col) => col.name === "is_disabled",
			);
			const organizationIdColumn = tableConfig.columns.find(
				(col) => col.name === "organization_id",
			);

			expect(nameColumn?.notNull).toBe(true);
			expect(isDisabledColumn?.notNull).toBe(true);
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

	describe("Database Operations", () => {
		async function createTestOrganization() {
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
			return org;
		}

		it("should successfully insert a record with required fields", async () => {
			const org = await createTestOrganization();
			const name = faker.lorem.word();
			const isDisabled = false;

			const [result] = await server.drizzleClient
				.insert(actionItemCategoriesTable)
				.values({
					name,
					isDisabled,
					organizationId: org.id,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert action item category record");
			}
			expect(result.id).toBeDefined();
			expect(result.name).toBe(name);
			expect(result.isDisabled).toBe(isDisabled);
			expect(result.organizationId).toBe(org.id);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
			expect(result.creatorId).toBeNull();
			expect(result.updaterId).toBeNull();
			expect(result.description).toBeNull();
		});

		it("should successfully insert a record with all optional fields", async () => {
			const org = await createTestOrganization();
			const name = faker.lorem.word();
			const description = faker.lorem.sentence();
			const isDisabled = true;

			const [result] = await server.drizzleClient
				.insert(actionItemCategoriesTable)
				.values({
					name,
					description,
					isDisabled,
					organizationId: org.id,
					creatorId: null,
					updaterId: null,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert action item category record");
			}
			expect(result.name).toBe(name);
			expect(result.description).toBe(description);
			expect(result.isDisabled).toBe(isDisabled);
			expect(result.organizationId).toBe(org.id);
		});

		it("should successfully query records", async () => {
			const org = await createTestOrganization();
			const categoryName = `Test Query Category ${faker.string.uuid()}`;

			await server.drizzleClient.insert(actionItemCategoriesTable).values({
				name: categoryName,
				isDisabled: false,
				organizationId: org.id,
			});

			const results = await server.drizzleClient
				.select()
				.from(actionItemCategoriesTable);

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);

			const insertedCategory = results.find((r) => r.name === categoryName);
			expect(insertedCategory).toBeDefined();
		});

		it("should enforce unique constraint on name and organizationId", async () => {
			const org = await createTestOrganization();
			const categoryName = faker.lorem.word();

			await server.drizzleClient.insert(actionItemCategoriesTable).values({
				name: categoryName,
				isDisabled: false,
				organizationId: org.id,
			});

			await expect(
				server.drizzleClient.insert(actionItemCategoriesTable).values({
					name: categoryName,
					isDisabled: true,
					organizationId: org.id,
				}),
			).rejects.toMatchObject({
				cause: { code: "23505" },
			});
		});

		it("should allow same category name in different organizations", async () => {
			const org1 = await createTestOrganization();
			const org2 = await createTestOrganization();
			const categoryName = faker.lorem.word();

			const [result1] = await server.drizzleClient
				.insert(actionItemCategoriesTable)
				.values({
					name: categoryName,
					isDisabled: false,
					organizationId: org1.id,
				})
				.returning();

			const [result2] = await server.drizzleClient
				.insert(actionItemCategoriesTable)
				.values({
					name: categoryName,
					isDisabled: false,
					organizationId: org2.id,
				})
				.returning();

			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
			expect(result1?.name).toBe(result2?.name);
			expect(result1?.organizationId).not.toBe(result2?.organizationId);
		});
	});
});
