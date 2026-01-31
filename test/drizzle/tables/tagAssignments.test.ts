import { faker } from "@faker-js/faker";
import { getTableColumns, getTableName, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { organizationsTable } from "../../../src/drizzle/tables/organizations";
import {
	tagAssignmentsTable,
	tagAssignmentsTableInsertSchema,
	tagAssignmentsTableRelations,
} from "../../../src/drizzle/tables/tagAssignments";
import { tagsTable } from "../../../src/drizzle/tables/tags";
import { usersTable } from "../../../src/drizzle/tables/users";

// Setup DB connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
const db = drizzle(pool);

describe("src/drizzle/tables/tagAssignments.ts", () => {
	afterAll(async () => {
		await pool.end();
	});

	describe("Table Schema (Static Checks)", () => {
		it("should have the correct table name", () => {
			expect(getTableName(tagAssignmentsTable)).toBe("tag_assignments");
		});

		it("should have all 4 required columns", () => {
			const columns = getTableColumns(tagAssignmentsTable);
			const columnNames = Object.keys(columns);
			expect(columnNames).toHaveLength(4);
			expect(columnNames).toContain("assigneeId");
			expect(columnNames).toContain("tagId");
			expect(columnNames).toContain("creatorId");
			expect(columnNames).toContain("createdAt");
		});

		it("should configure columns for the Composite Primary Key", () => {
			const columns = getTableColumns(tagAssignmentsTable);
			expect(columns.assigneeId.notNull).toBe(true);
			expect(columns.tagId.notNull).toBe(true);
		});
	});

	describe("Table Relations", () => {
		it("should be defined", () => {
			expect(tagAssignmentsTableRelations).toBeDefined();
		});
	});

	describe("Insert Schema Validation (Zod)", () => {
		it("should validate proper UUIDs", () => {
			const validData = {
				assigneeId: faker.string.uuid(),
				tagId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
			};
			expect(() =>
				tagAssignmentsTableInsertSchema.parse(validData),
			).not.toThrow();
		});

		it("should reject invalid data", () => {
			const invalidData = {
				assigneeId: "not-a-uuid",
				tagId: "not-a-uuid",
			};
			expect(() =>
				tagAssignmentsTableInsertSchema.parse(invalidData),
			).toThrow();
		});
	});

	describe("Database Operations (Integration)", () => {
		it("should successfully insert and retrieve a record", async () => {
			// 0. Create a Real Organization (Parent for the Tag)
			const [organization] = await db
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					slug: `${faker.lorem.slug()}-${faker.string.uuid()}`,
					isPublic: true,
					// biome-ignore lint/suspicious/noExplicitAny: Partial types needed for test setup
				} as any)
				.returning();

			if (!organization) throw new Error("Failed to create organization");

			// 1. Create a Fake Assignee
			const [assignee] = await db
				.insert(usersTable)
				.values({
					name: "Test User",
					emailAddress: faker.internet.email(),
					isEmailAddressVerified: true,
					failedLoginAttempts: 0,
					passwordHash: "hashed_password_placeholder",
					role: "USER",
					isBlocked: false,
					isVerified: true,
					// biome-ignore lint/suspicious/noExplicitAny: Partial types needed for test setup
				} as any)
				.returning();

			if (!assignee) throw new Error("Failed to create assignee");

			// 2. Create a Fake Creator
			const [creator] = await db
				.insert(usersTable)
				.values({
					name: "Creator User",
					emailAddress: faker.internet.email(),
					isEmailAddressVerified: true,
					failedLoginAttempts: 0,
					passwordHash: "hashed_password_placeholder",
					role: "USER",
					isBlocked: false,
					isVerified: true,
					// biome-ignore lint/suspicious/noExplicitAny: Partial types needed for test setup
				} as any)
				.returning();

			if (!creator) throw new Error("Failed to create creator");

			// 3. Create a Fake Tag (Linked to the REAL Organization)
			const [tag] = await db
				.insert(tagsTable)
				.values({
					name: `${faker.lorem.word()}_${faker.string.uuid()}`,
					creatorId: creator.id,
					organizationId: organization.id,
					// biome-ignore lint/suspicious/noExplicitAny: Partial types needed for test setup
				} as any)
				.returning();

			if (!tag) throw new Error("Failed to create tag");

			// 4. THE ACTUAL TEST: Insert into tagAssignments
			const newAssignment = {
				assigneeId: assignee.id,
				tagId: tag.id,
				creatorId: creator.id,
			};

			const [result] = await db
				.insert(tagAssignmentsTable)
				.values(newAssignment)
				.returning();

			// Verify
			if (!result) throw new Error("Insert returned undefined");

			expect(result).toBeDefined();
			expect(result.assigneeId).toBe(assignee.id);
			expect(result.tagId).toBe(tag.id);

			// 5. Cleanup
			await db
				.delete(tagAssignmentsTable)
				.where(
					sql`${tagAssignmentsTable.assigneeId} = ${assignee.id} AND ${tagAssignmentsTable.tagId} = ${tag.id}`,
				);
		});
	});
});
