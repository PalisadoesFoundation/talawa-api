import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreatedAt } from "~/src/graphql/types/ActionItem/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Fake ActionItem shape
interface FakeActionItem {
	createdAt: Date;
	organizationId: string;
}

describe("resolveCreatedAt", () => {
	let ctx: GraphQLContext;
	const fakeDate = new Date("2025-01-01T12:00:00Z");
	const orgId = "org-123";
	const userId = "user-abc";

	beforeEach(() => {
		const mockFindFirst = vi.fn();
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: userId },
			},
			drizzleClient: {
				query: {
					usersTable: {
						findFirst: mockFindFirst as Mock,
					},
				},
			},
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
		(ctx.drizzleClient.query.usersTable.findFirst as Mock).mockResolvedValue(
			undefined,
		);
		const parent: FakeActionItem = {
			createdAt: fakeDate,
			organizationId: orgId,
		};
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthorized_action when not admin and no membership", async () => {
		(ctx.drizzleClient.query.usersTable.findFirst as Mock).mockResolvedValue({
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
		(ctx.drizzleClient.query.usersTable.findFirst as Mock).mockResolvedValue({
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
		(ctx.drizzleClient.query.usersTable.findFirst as Mock).mockResolvedValue({
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
