import { faker } from "@faker-js/faker";
import { eq, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { server } from "../../server";

import {
	membershipRequestsTable,
	membershipRequestsTableInsertSchema,
	membershipRequestsTableRelations,
} from "~/src/drizzle/tables/membershipRequests";

import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";


describe("src/drizzle/tables/membershipRequests.ts", () => {


	async function createTestOrganization() {
		const [org] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `${faker.company.name()}-${faker.string.uuid()}`,
				countryCode: "us",
				userRegistrationRequired: false,
			})
			.returning({ id: organizationsTable.id });

		if (!org?.id) throw new Error("Failed to create organization");
		return org.id;
	}

	async function createTestUser() {
		const [user] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: `user.${faker.string.uuid()}@test.com`,
				passwordHash: faker.string.alphanumeric(32),
				role: "regular",
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
			})
			.returning({ id: usersTable.id });

		if (!user?.id) throw new Error("Failed to create user");
		return user.id;
	}



	describe("Table Definition", () => {
		it("should have correct table name", () => {
			expect(getTableName(membershipRequestsTable)).toBe(
				"membership_requests",
			);
		});

		it("should define expected columns", () => {
			expect(membershipRequestsTable.membershipRequestId).toBeDefined();
			expect(membershipRequestsTable.userId).toBeDefined();
			expect(membershipRequestsTable.organizationId).toBeDefined();
			expect(membershipRequestsTable.status).toBeDefined();
			expect(membershipRequestsTable.createdAt).toBeDefined();
		});
	});



	describe("Insert Schema Validation", () => {
		it("should reject empty payload", () => {
			const result = membershipRequestsTableInsertSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("should accept valid payload without status (default applied)", () => {
			const result = membershipRequestsTableInsertSchema.safeParse({
				userId: faker.string.uuid(),
				organizationId: faker.string.uuid(),
			});
			expect(result.success).toBe(true);
		});

		it("should reject invalid status", () => {
			const result = membershipRequestsTableInsertSchema.safeParse({
				userId: faker.string.uuid(),
				organizationId: faker.string.uuid(),
				status: "invalid-status",
			});
			expect(result.success).toBe(false);
		});
	});

	/* ------------------------------------------------------------------ */
	/* Database Operations                                                 */
	/* ------------------------------------------------------------------ */

	describe("Database Operations", () => {
		it("should insert with default status = pending", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();

			const [row] = await server.drizzleClient
				.insert(membershipRequestsTable)
				.values({
					userId,
					organizationId: orgId,
				})
				.returning();

			expect(row).toBeDefined();
			expect(row?.status).toBe("pending");
			expect(row?.createdAt).toBeInstanceOf(Date);
		});

		it("should enforce unique (userId, organizationId)", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();

			await server.drizzleClient.insert(membershipRequestsTable).values({
				userId,
				organizationId: orgId,
			});

			await expect(
				server.drizzleClient.insert(membershipRequestsTable).values({
					userId,
					organizationId: orgId,
				}),
			).rejects.toThrow();
		});

		it("should cascade delete when organization is deleted", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();

			const [inserted] = await server.drizzleClient
				.insert(membershipRequestsTable)
				.values({ userId, organizationId: orgId })
				.returning();

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, orgId));

			const rows = await server.drizzleClient
				.select()
				.from(membershipRequestsTable)
				.where(
					eq(
						membershipRequestsTable.membershipRequestId,
						inserted!.membershipRequestId,
					),
				);

			expect(rows.length).toBe(0);
		});

		it("should cascade delete when user is deleted", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();

			const [inserted] = await server.drizzleClient
				.insert(membershipRequestsTable)
				.values({ userId, organizationId: orgId })
				.returning();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const rows = await server.drizzleClient
				.select()
				.from(membershipRequestsTable)
				.where(
					eq(
						membershipRequestsTable.membershipRequestId,
						inserted!.membershipRequestId,
					),
				);

			expect(rows.length).toBe(0);
		});
	});



	describe("Relations", () => {
		it("should define relations config", () => {
			expect(membershipRequestsTableRelations).toBeDefined();
			expect(typeof membershipRequestsTableRelations.config).toBe(
				"function",
			);
		});

		it("should expose user, organization, and membership relations", () => {
			const mock = {
				one: (table: unknown) => ({ table }),
			};

			const relations = membershipRequestsTableRelations.config(
				mock as any,
			);

			expect(relations.user).toBeDefined();
			expect(relations.organization).toBeDefined();
			expect(relations.membership).toBeDefined();
		});
	});
});
