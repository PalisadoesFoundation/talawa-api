import { describe, expect, it } from "vitest";
import { MembershipRequestStatusValues } from "~/src/drizzle/enums/membershipRequestStatus";
import {
	membershipRequestsTable,
	membershipRequestsTableInsertSchema,
	membershipRequestsTableRelations,
} from "~/src/drizzle/tables/membershipRequests";

describe("membershipRequestsTable", () => {
	it("should expose expected columns", () => {
		expect(membershipRequestsTable).toHaveProperty("membershipRequestId");
		expect(membershipRequestsTable).toHaveProperty("userId");
		expect(membershipRequestsTable).toHaveProperty("organizationId");
		expect(membershipRequestsTable).toHaveProperty("status");
		expect(membershipRequestsTable).toHaveProperty("createdAt");
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

	it("should define relations", () => {
		expect(membershipRequestsTableRelations).toBeDefined();
	});
});
