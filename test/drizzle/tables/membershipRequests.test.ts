import { faker } from "@faker-js/faker";
import { eq, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MembershipRequestStatusValues } from "~/src/drizzle/enums/membershipRequestStatus";
import {
	membershipRequestsTable,
	membershipRequestsTableInsertSchema,
	membershipRequestsTableRelations,
} from "~/src/drizzle/tables/membershipRequests";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

describe("src/drizzle/tables/membershipRequests.ts", () => {
	const createdOrgIds: string[] = [];
	const createdUserIds: string[] = [];
	const createdMembershipRequestIds: string[] = [];

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const id of createdMembershipRequestIds) {
			await server.drizzleClient
				.delete(membershipRequestsTable)
				.where(eq(membershipRequestsTable.membershipRequestId, id))
				.catch(() => {});
		}
		createdMembershipRequestIds.length = 0;

		for (const id of createdUserIds) {
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, id))
				.catch(() => {});
		}
		createdUserIds.length = 0;

		for (const id of createdOrgIds) {
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, id))
				.catch(() => {});
		}
		createdOrgIds.length = 0;
	});

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

		createdOrgIds.push(org.id);
		return org.id;
	}

	async function createTestUser() {
		const [user] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: faker.internet.email(),
				passwordHash: "hash",
				role: "regular",
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
			})
			.returning({ id: usersTable.id });

		if (!user?.id) throw new Error("Failed to create user");

		createdUserIds.push(user.id);
		return user.id;
	}

	describe("Table Definition", () => {
		it("should have correct table name", () => {
			expect(getTableName(membershipRequestsTable)).toBe("membership_requests");
		});

		it("should define expected columns", () => {
			expect(membershipRequestsTable.membershipRequestId).toBeDefined();
			expect(membershipRequestsTable.userId).toBeDefined();
			expect(membershipRequestsTable.organizationId).toBeDefined();
			expect(membershipRequestsTable.status).toBeDefined();
			expect(membershipRequestsTable.createdAt).toBeDefined();
		});
	});

	describe("Indexes & Constraints", () => {
		it("should define expected indexes", () => {
			const tableConfig = getTableConfig(membershipRequestsTable);

			const indexColumns = tableConfig.indexes.map((idx) =>
				idx.config.columns
					.map((c) => {
						if ("name" in c) {
							return c.name;
						}
						throw new Error("Unexpected index column type");
					})

					.sort()
					.join(","),
			);

			expect(indexColumns).toContain("user_id");
			expect(indexColumns).toContain("organization_id");
		});

		it("should define unique user + organization constraint", () => {
			const tableConfig = getTableConfig(membershipRequestsTable);

			const uniqueColumns = tableConfig.uniqueConstraints.map((uc) =>
				uc.columns
					.map((col) => col.name)
					.sort()
					.join(","),
			);

			expect(uniqueColumns).toContain("organization_id,user_id");
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

		it("should accept all valid status enum values", () => {
			for (const status of MembershipRequestStatusValues) {
				const result = membershipRequestsTableInsertSchema.safeParse({
					userId: faker.string.uuid(),
					organizationId: faker.string.uuid(),
					status,
				});
				expect(result.success).toBe(true);
			}
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

	describe("Relations", () => {
		it("should define expected relations", () => {
			const relations = membershipRequestsTableRelations;

			expect(relations.table).toBe(membershipRequestsTable);
			expect(typeof relations.config).toBe("function");
		});
	});

	describe("Database Operations", () => {
		it("should insert a membership request", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();

			const [inserted] = await server.drizzleClient
				.insert(membershipRequestsTable)
				.values({ userId, organizationId: orgId })
				.returning();

			if (!inserted) throw new Error("Insert failed");

			createdMembershipRequestIds.push(inserted.membershipRequestId);

			expect(inserted.userId).toBe(userId);
			expect(inserted.organizationId).toBe(orgId);
			expect(inserted.status).toBe("pending");
			expect(inserted.createdAt).toBeInstanceOf(Date);
		});

		it("should cascade delete on organization delete", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();

			const [inserted] = await server.drizzleClient
				.insert(membershipRequestsTable)
				.values({ userId, organizationId: orgId })
				.returning();

			if (!inserted) throw new Error("Insert failed");

			createdMembershipRequestIds.push(inserted.membershipRequestId);

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, orgId));

			const rows = await server.drizzleClient
				.select()
				.from(membershipRequestsTable)
				.where(
					eq(
						membershipRequestsTable.membershipRequestId,
						inserted.membershipRequestId,
					),
				);

			expect(rows.length).toBe(0);
		});

		it("should cascade delete on user delete", async () => {
			const orgId = await createTestOrganization();
			const userId = await createTestUser();

			const [inserted] = await server.drizzleClient
				.insert(membershipRequestsTable)
				.values({ userId, organizationId: orgId })
				.returning();

			if (!inserted) throw new Error("Insert failed");

			createdMembershipRequestIds.push(inserted.membershipRequestId);

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const rows = await server.drizzleClient
				.select()
				.from(membershipRequestsTable)
				.where(
					eq(
						membershipRequestsTable.membershipRequestId,
						inserted.membershipRequestId,
					),
				);

			expect(rows.length).toBe(0);
		});
	});
});
