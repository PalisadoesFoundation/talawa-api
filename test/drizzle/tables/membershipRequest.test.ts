import { describe, expect, it } from "vitest";
import { MembershipRequestStatusValues } from "~/src/drizzle/enums/membershipRequestStatus";
import {
	membershipRequestsTable,
	membershipRequestsTableInsertSchema,
	membershipRequestsTableRelations,
} from "~/src/drizzle/tables/membershipRequests";

describe("membershipRequestsTable", () => {
	it("should define the table with correct name and columns", () => {
		expect(membershipRequestsTable._.name).toBe("membership_requests");

		expect(membershipRequestsTable.membershipRequestId).toBeDefined();
		expect(membershipRequestsTable.userId).toBeDefined();
		expect(membershipRequestsTable.organizationId).toBeDefined();
		expect(membershipRequestsTable.status).toBeDefined();
		expect(membershipRequestsTable.createdAt).toBeDefined();
	});

	it("should define indexes and unique constraints", () => {
		const tableInternals = membershipRequestsTable._ as any;

		const indexNames = tableInternals.indexes.map(
			(idx: { name: string }) => idx.name,
		);

		expect(indexNames).toContain("idx_membership_requests_user");
		expect(indexNames).toContain("idx_membership_requests_org");

		const constraintNames = tableInternals.constraints.map(
			(c: { name: string }) => c.name,
		);

		expect(constraintNames).toContain("unique_user_org");
	});

	it("should reject invalid insert data", () => {
		expect(() => membershipRequestsTableInsertSchema.parse({})).toThrow();

		expect(() =>
			membershipRequestsTableInsertSchema.parse({
				userId: "00000000-0000-0000-0000-000000000000",
				organizationId: "00000000-0000-0000-0000-000000000000",
				status: "INVALID_STATUS",
			}),
		).toThrow();
	});

	it("should accept valid insert data", () => {
		expect(() =>
			membershipRequestsTableInsertSchema.parse({
				userId: "00000000-0000-0000-0000-000000000000",
				organizationId: "00000000-0000-0000-0000-000000000000",
			}),
		).not.toThrow();

		expect(() =>
			membershipRequestsTableInsertSchema.parse({
				userId: "00000000-0000-0000-0000-000000000000",
				organizationId: "00000000-0000-0000-0000-000000000000",
				status: MembershipRequestStatusValues[0],
			}),
		).not.toThrow();
	});

	it("should accept all valid status values", () => {
		for (const status of MembershipRequestStatusValues) {
			expect(() =>
				membershipRequestsTableInsertSchema.parse({
					userId: "00000000-0000-0000-0000-000000000000",
					organizationId: "00000000-0000-0000-0000-000000000000",
					status,
				}),
			).not.toThrow();
		}
	});

	it("should define expected relations", () => {
		expect(membershipRequestsTableRelations).toBeDefined();

		const relationsInternals = membershipRequestsTableRelations as any;

		expect(relationsInternals.config).toBeDefined();
		expect(relationsInternals.config.user).toBeDefined();
		expect(relationsInternals.config.organization).toBeDefined();
		expect(relationsInternals.config.membership).toBeDefined();
	});
});
