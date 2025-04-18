import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreator } from "~/src/graphql/types/ActionItem/creator";

describe("resolveCreator", () => {
	let ctx: GraphQLContext;
	const orgId = "org-xyz";
	const currentUserId = "user-abc";
	const otherUserId = "user-def";
	let mockFindFirst: Mock;

	beforeEach(() => {
		mockFindFirst = vi.fn();
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: currentUserId },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst,
					},
				},
			},
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
		mockFindFirst.mockResolvedValueOnce(undefined);
		await expect(
			resolveCreator(
				{ creatorId: otherUserId, organizationId: orgId },
				{},
				ctx,
			),
		).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
	});

	it("throws unauthorized_action if not admin by role or membership", async () => {
		mockFindFirst.mockResolvedValue({
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
		mockFindFirst.mockResolvedValue({
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
		const currentUser = {
			id: currentUserId,
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};
		mockFindFirst.mockResolvedValueOnce(currentUser).mockResolvedValueOnce({}); // second call unused except to satisfy type

		const result = await resolveCreator(
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
		};
		const existingUser = { id: otherUserId, name: "Foo" };
		mockFindFirst
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(existingUser);

		const result = await resolveCreator(
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
		};
		mockFindFirst
			.mockResolvedValueOnce(currentUser)
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
