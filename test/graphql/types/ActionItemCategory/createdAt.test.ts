// resolveCreatedAt.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreatedAt } from "~/src/graphql/types/ActionItemCategory/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock"; // adjust path as needed

// Fake ActionItemCategory shape for tests
interface FakeCategory {
	createdAt: Date;
	organizationId: string;
}

describe("resolveCreatedAt (ActionItemCategory)", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock<
		() => Promise<
			| { role: string; organizationMembershipsWhereMember: { role: string }[] }
			| undefined
		>
	>;
	const fakeDate = new Date("2025-01-01T00:00:00Z");
	const orgId = "org-123";
	const userId = "user-xyz";

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.usersTable.findFirst as Mock<
			() => Promise<
				| {
						role: string;
						organizationMembershipsWhereMember: { role: string }[];
				  }
				| undefined
			>
		>;

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: userId },
			},
			drizzleClient: mockDrizzle,
			log: {
				error: vi.fn(),
			},
		} as unknown as GraphQLContext;
	});

	it("throws unauthenticated when not signed in", async () => {
		ctx.currentClient.isAuthenticated = false;
		const parent: FakeCategory = { createdAt: fakeDate, organizationId: orgId };

		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthenticated when current user lookup returns undefined", async () => {
		findFirstMock.mockResolvedValue(undefined);

		const parent: FakeCategory = { createdAt: fakeDate, organizationId: orgId };
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthorized_action when user is not admin by role or membership", async () => {
		findFirstMock.mockResolvedValue({
			role: "regular",
			organizationMembershipsWhereMember: [],
		});

		const parent: FakeCategory = { createdAt: fakeDate, organizationId: orgId };
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("returns date when user has administrator role", async () => {
		findFirstMock.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const parent: FakeCategory = { createdAt: fakeDate, organizationId: orgId };
		const result = await resolveCreatedAt(parent, {}, ctx);
		expect(result).toBe(fakeDate);
	});

	it("returns date when user has administrator membership", async () => {
		findFirstMock.mockResolvedValue({
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const parent: FakeCategory = { createdAt: fakeDate, organizationId: orgId };
		const result = await resolveCreatedAt(parent, {}, ctx);
		expect(result).toBe(fakeDate);
	});
});
