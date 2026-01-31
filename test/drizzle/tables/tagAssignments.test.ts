import { eq, getTableColumns, getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import {
	tagAssignmentsTable,
	tagAssignmentsTableInsertSchema,
	tagAssignmentsTableRelations,
} from "~/src/drizzle/tables/tagAssignments";
import { tagsTable } from "~/src/drizzle/tables/tags";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

/**
 * Tests for tagAssignmentsTable definition - validates table schema, relations,
 * insert schema validation, and database operations.
 */
describe("src/drizzle/tables/tagAssignments.ts - Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(tagAssignmentsTable)).toBe("tag_assignments");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(tagAssignmentsTable);
			expect(columns).toContain("assigneeId");
			expect(columns).toContain("tagId");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("createdAt");
		});

		it("should enforce notNull constraints on columns", () => {
			const columns = getTableColumns(tagAssignmentsTable);
			expect(columns.assigneeId.notNull).toBe(true);
			expect(columns.tagId.notNull).toBe(true);
			expect(columns.creatorId.notNull).toBe(true);
			expect(columns.createdAt.notNull).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		const tableConfig = getTableConfig(tagAssignmentsTable);

		it("should have correct foreign keys defined", () => {
			expect(tableConfig.foreignKeys.length).toBe(3);
		});

		it("should map assigneeId and tagId to correct tables", () => {
			const assigneeFk = tableConfig.foreignKeys.find((fk) =>
				fk.reference().columns.some((col) => col.name === "assignee_id"),
			);
			const tagFk = tableConfig.foreignKeys.find((fk) =>
				fk.reference().columns.some((col) => col.name === "tag_id"),
			);
			expect(assigneeFk?.reference().foreignTable).toBe(usersTable);
			expect(tagFk?.reference().foreignTable).toBe(tagsTable);
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
		}

		let capturedRelations: Record<string, CapturedRelation> = {};

		beforeAll(() => {
			capturedRelations = {};
			(
				tagAssignmentsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					const name = getTableName(table);
					capturedRelations[name] = { table, config };
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should define relations for users and tags", () => {
			expect(capturedRelations.users).toBeDefined();
			expect(capturedRelations.tags).toBeDefined();
		});
	});

	describe("Insert Schema Validation", () => {
		const validUuid = "01234567-89ab-4def-a123-456789abcdef";

		it("should accept valid data", () => {
			const result = tagAssignmentsTableInsertSchema.safeParse({
				assigneeId: validUuid,
				tagId: validUuid,
				creatorId: validUuid,
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid UUIDs", () => {
			const result = tagAssignmentsTableInsertSchema.safeParse({
				assigneeId: "not-a-uuid",
				tagId: validUuid,
				creatorId: validUuid,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert and delete an assignment", async () => {
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: `Org-${Date.now()}`,
					description: "Test Org",
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org) throw new Error("Failed to create test organization");

			const [user] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: `user-${Date.now()}@test.com`,
					name: "Test User",
					passwordHash: "hash",
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();
			if (!user) throw new Error("Failed to create test user");

			const [tag] = await server.drizzleClient
				.insert(tagsTable)
				.values({
					name: `Tag-${Date.now()}`,
					organizationId: org.id,
				})
				.returning();
			if (!tag) throw new Error("Failed to create test tag");

			const [assignment] = await server.drizzleClient
				.insert(tagAssignmentsTable)
				.values({
					assigneeId: user.id,
					tagId: tag.id,
					creatorId: user.id,
				})
				.returning();

			expect(assignment).toBeDefined();
			if (!assignment) throw new Error("Failed to create assignment");
			
			// Verify fields
			expect(assignment.assigneeId).toBe(user.id);
			// Verify createdAt was auto-populated
			expect(assignment.createdAt).toBeInstanceOf(Date);

			await server.drizzleClient
				.delete(tagAssignmentsTable)
				.where(eq(tagAssignmentsTable.assigneeId, user.id));
		});

		it("should enforce composite primary key constraint (reject duplicate assignment)", async () => {
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: `Org-PK-${Date.now()}`,
					description: "Test Org PK",
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org) throw new Error("Failed to create org");

			const [user] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: `user-pk-${Date.now()}@test.com`,
					name: "Test User PK",
					passwordHash: "hash",
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();
			if (!user) throw new Error("Failed to create user");

			const [tag] = await server.drizzleClient
				.insert(tagsTable)
				.values({
					name: `Tag-PK-${Date.now()}`,
					organizationId: org.id,
				})
				.returning();
			if (!tag) throw new Error("Failed to create tag");

			await server.drizzleClient.insert(tagAssignmentsTable).values({
				assigneeId: user.id,
				tagId: tag.id,
				creatorId: user.id,
			});

			await expect(
				server.drizzleClient.insert(tagAssignmentsTable).values({
					assigneeId: user.id,
					tagId: tag.id,
					creatorId: user.id,
				}),
			).rejects.toThrow();

			await server.drizzleClient
				.delete(tagAssignmentsTable)
				.where(eq(tagAssignmentsTable.assigneeId, user.id));
		});

		it("should enforce foreign key constraints (reject non-existent IDs)", async () => {
			const fakeUuid = "00000000-0000-0000-0000-000000000000";

			await expect(
				server.drizzleClient.insert(tagAssignmentsTable).values({
					assigneeId: fakeUuid,
					tagId: fakeUuid,
					creatorId: fakeUuid,
				}),
			).rejects.toThrow();
		});
	});
});