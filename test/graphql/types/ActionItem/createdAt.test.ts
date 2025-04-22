// resolveCreatedAt.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreatedAt } from "~/src/graphql/types/ActionItem/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock"; // adjust path as needed

// Fake ActionItem shape
interface FakeActionItem {
	createdAt: Date;
	organizationId: string;
}

describe("resolveCreatedAt", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock<
		() => Promise<
			| {
					role: string;
					organizationMembershipsWhereMember: { role: string }[];
			  }
			| undefined
		>
	>;
	const fakeDate = new Date("2025-01-01T12:00:00Z");
	const orgId = "org-123";
	const userId = "user-abc";

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.usersTable.findFirst;
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

	it("throws unauthenticated when not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;
		const parent: FakeActionItem = {
			createdAt: fakeDate,
			organizationId: orgId,
		};

		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthenticated when user not found", async () => {
		findFirstMock.mockResolvedValue(undefined);

		const parent: FakeActionItem = {
			createdAt: fakeDate,
			organizationId: orgId,
		};
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthorized_action when not admin and no membership", async () => {
		findFirstMock.mockResolvedValue({
			role: "regular",
			organizationMembershipsWhereMember: [],
		});

		const parent: FakeActionItem = {
			createdAt: fakeDate,
			organizationId: orgId,
		};
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("returns date when user role is administrator", async () => {
		findFirstMock.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const parent: FakeActionItem = {
			createdAt: fakeDate,
			organizationId: orgId,
		};
		const result = await resolveCreatedAt(parent, {}, ctx);
		expect(result).toBe(fakeDate);
	});

	it("returns date when membership role is administrator", async () => {
		findFirstMock.mockResolvedValue({
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		const parent: FakeActionItem = {
			createdAt: fakeDate,
			organizationId: orgId,
		};
		const result = await resolveCreatedAt(parent, {}, ctx);
		expect(result).toBe(fakeDate);
	});
});
