import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { actionItemCategoryUpdatedAtResolver } from "~/src/graphql/types/ActionItemCategory/updatedAt";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

describe("actionItemCategoryUpdatedAtResolver", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock;
	const fakeDate = new Date("2025-01-01T00:00:00Z");
	const orgId = "org-123";
	const userId = "user-xyz";

	const fullMockCategory = {
		id: "cat-001",
		name: "Test Category",
		description: null,
		creatorId: null,
		createdAt: fakeDate,
		updatedAt: fakeDate,
		updaterId: null,
		isDisabled: false,
		organizationId: orgId,
	};

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.usersTable.findFirst as Mock;

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

	it("throws unauthenticated if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(
			actionItemCategoryUpdatedAtResolver(fullMockCategory, {}, ctx),
		).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
	});

	it("throws unauthenticated if user lookup fails", async () => {
		findFirstMock.mockResolvedValue(undefined);
		await expect(
			actionItemCategoryUpdatedAtResolver(fullMockCategory, {}, ctx),
		).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
	});

	it("throws unauthorized_action if user is not admin", async () => {
		findFirstMock.mockResolvedValue({
			role: "regular",
			organizationMembershipsWhereMember: [],
		});
		await expect(
			actionItemCategoryUpdatedAtResolver(fullMockCategory, {}, ctx),
		).rejects.toMatchObject({ extensions: { code: "unauthorized_action" } });
	});

	it("returns updatedAt if user is global administrator", async () => {
		findFirstMock.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});
		const result = await actionItemCategoryUpdatedAtResolver(
			fullMockCategory,
			{},
			ctx,
		);
		expect(result).toBe(fakeDate);
	});

	it("returns updatedAt if user is admin by membership", async () => {
		findFirstMock.mockResolvedValue({
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});
		const result = await actionItemCategoryUpdatedAtResolver(
			fullMockCategory,
			{},
			ctx,
		);
		expect(result).toBe(fakeDate);
	});

	it("throws internal error for unknown errors", async () => {
		findFirstMock.mockRejectedValue(new Error("DB exploded"));
		await expect(
			actionItemCategoryUpdatedAtResolver(fullMockCategory, {}, ctx),
		).rejects.toMatchObject({ extensions: { code: "unexpected" } });
	});
});
