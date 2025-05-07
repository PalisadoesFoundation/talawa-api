import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveUpdater } from "~/src/graphql/types/ActionItem/updater";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

describe("resolveUpdater", () => {
	let ctx: GraphQLContext;
	let usersFindFirstMock: Mock;
	let updaterFindFirstMock: Mock;
	const orgId = "org-123";
	const updaterId = "user-123";
	const currentUserId = "user-456";
	const fakeItem = {
		updaterId,
		organizationId: orgId,
	};

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		usersFindFirstMock = mockDrizzle.query.usersTable.findFirst as Mock;
		updaterFindFirstMock = vi.fn();
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: currentUserId },
			},
			drizzleClient: mockDrizzle,
			log: { error: vi.fn() },
		} as unknown as GraphQLContext;
	});

	it("throws unauthenticated if not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(resolveUpdater(fakeItem, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthenticated if user lookup fails", async () => {
		usersFindFirstMock.mockResolvedValue(undefined);
		await expect(resolveUpdater(fakeItem, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthorized if user is not admin or org admin", async () => {
		usersFindFirstMock.mockResolvedValue({
			role: "regular",
			organizationMembershipsWhereMember: [],
		});
		await expect(resolveUpdater(fakeItem, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("returns null if updaterId is null", async () => {
		usersFindFirstMock.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});
		const result = await resolveUpdater(
			{ ...fakeItem, updaterId: null },
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	it("returns current user if updaterId is same as current user", async () => {
		if (ctx.currentClient.user) {
			ctx.currentClient.user.id = updaterId;
		}
		usersFindFirstMock.mockResolvedValue({
			id: updaterId,
			name: "SameUser",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});
		const result = await resolveUpdater(fakeItem, {}, ctx);
		expect(result).toEqual(expect.objectContaining({ id: updaterId }));
	});

	it("fetches updater user if updaterId is different from current user", async () => {
		usersFindFirstMock.mockResolvedValue({
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		const updaterUser = {
			id: updaterId,
			name: "Updater User",
			role: "regular",
		};

		updaterFindFirstMock.mockResolvedValue(updaterUser);
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementationOnce(usersFindFirstMock) // first call for current user
			.mockImplementationOnce(updaterFindFirstMock); // second call for updater

		const result = await resolveUpdater(fakeItem, {}, ctx);
		expect(result).toEqual(updaterUser);
	});
	it("throws unexpected if updater lookup fails", async () => {
		usersFindFirstMock.mockResolvedValue({
			id: currentUserId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});

		updaterFindFirstMock.mockResolvedValue(undefined);
		ctx.drizzleClient.query.usersTable.findFirst = vi
			.fn()
			.mockImplementationOnce(usersFindFirstMock) // first call for current user
			.mockImplementationOnce(updaterFindFirstMock); // second call for updater

		await expect(resolveUpdater(fakeItem, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
	});
});
