// resolveCreator.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreator } from "~/src/graphql/types/ActionItem/creator";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

describe("resolveCreator", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock<() => Promise<Record<string, unknown> | undefined>>;

	const orgId = "org-xyz";
	const currentUserId = "user-abc";
	const otherUserId = "user-def";

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.usersTable.findFirst;
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
			resolveCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
	});

	it("throws unauthenticated if currentUser not found", async () => {
		findFirstMock.mockResolvedValueOnce(undefined);

		await expect(
			resolveCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
	});

	it("throws unauthorized_action if not admin by role or membership", async () => {
		findFirstMock.mockResolvedValueOnce({
			id: currentUserId,
			role: "regular",
			organizationMembershipsWhereMember: [],
		});

		await expect(
			resolveCreator(
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
		});

		const result = await resolveCreator(
			{ creatorId: null, organizationId: orgId },
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	it("returns currentUser when creatorId equals currentUserId", async () => {
		const currentUserRecord = {
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		findFirstMock.mockResolvedValueOnce(currentUserRecord);

		const result = await resolveCreator(
			{ creatorId: currentUserId, organizationId: orgId },
			{},
			ctx,
		);
		expect(result).toBe(currentUserRecord);
	});

	it("returns existingUser when creatorId is different and found", async () => {
		const currentUserRecord = {
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const existingUserRecord = { id: otherUserId, name: "Foo" };

		// First call for currentUser, second for the actual creator
		findFirstMock
			.mockResolvedValueOnce(currentUserRecord)
			.mockResolvedValueOnce(existingUserRecord);

		const result = await resolveCreator(
			{ creatorId: otherUserId, organizationId: orgId },
			{},
			ctx,
		);
		expect(result).toBe(existingUserRecord);
	});

	it("logs error and throws unexpected when existingUser not found", async () => {
		const currentUserRecord = {
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		// First call returns currentUser, second returns undefined
		findFirstMock
			.mockResolvedValueOnce(currentUserRecord)
			.mockResolvedValueOnce(undefined);

		await expect(
			resolveCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unexpected" } });

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an action item's creator id that isn't null.",
		);
	});
});
