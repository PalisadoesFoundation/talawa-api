// resolveCategoryCreator.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCategoryCreator } from "~/src/graphql/types/ActionItemCategory/creator";
import type { User } from "~/src/graphql/types/User/User";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

describe("resolveCategoryCreator", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock<() => Promise<User | undefined>>;

	const orgId = "org-abc";
	const currentUserId = "user-1";
	const otherUserId = "user-2";

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.usersTable.findFirst as Mock<
			() => Promise<User | undefined>
		>;

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: currentUserId },
			},
			drizzleClient: mockDrizzle,
			log: {
				error: vi.fn(),
			},
		} as unknown as GraphQLContext;
	});

	it("throws unauthenticated if not signed in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			resolveCategoryCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
	});

	it("throws unauthenticated if currentUser not found", async () => {
		findFirstMock.mockResolvedValueOnce(undefined);

		await expect(
			resolveCategoryCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
	});

	it("throws unauthorized_action if not administrator by role or membership", async () => {
		findFirstMock.mockResolvedValueOnce({
			id: currentUserId,
			role: "regular",
			organizationMembershipsWhereMember: [],
		} as unknown as User);

		await expect(
			resolveCategoryCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unauthorized_action" } });
	});

	it("returns null when creatorId is null", async () => {
		findFirstMock.mockResolvedValueOnce({
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		} as unknown as User);

		const result = await resolveCategoryCreator(
			{ creatorId: null, organizationId: orgId },
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	it("returns currentUser when creatorId equals currentUserId", async () => {
		const currentUser = {
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		} as unknown as User;
		findFirstMock.mockResolvedValueOnce(currentUser);

		const result = await resolveCategoryCreator(
			{ creatorId: currentUserId, organizationId: orgId },
			{},
			ctx,
		);
		expect(result).toBe(currentUser);
	});

	it("returns existingUser when creatorId is different and found", async () => {
		const currentUser = {
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		} as unknown as User;
		const existingUser = { id: otherUserId, name: "Foo" } as unknown as User;

		// first call for currentUser, second for the actual creator
		findFirstMock
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(existingUser);

		const result = await resolveCategoryCreator(
			{ creatorId: otherUserId, organizationId: orgId },
			{},
			ctx,
		);
		expect(result).toBe(existingUser);
	});

	it("logs error and throws unexpected when existingUser not found", async () => {
		const currentUser = {
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		} as unknown as User;

		findFirstMock
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(undefined);

		await expect(
			resolveCategoryCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unexpected" } });

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an action item category's creator id that isn't null.",
		);
	});
});
