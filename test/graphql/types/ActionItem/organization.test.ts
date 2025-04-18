import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveOrganization } from "~/src/graphql/types/ActionItem/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Fake ActionItem shape for testing
interface FakeActionItem {
	organizationId: string | null;
}

describe("resolveOrganization", () => {
	let ctx: GraphQLContext;
	let mockFindFirst: Mock;
	const fakeOrg = { id: "org-1", name: "Test Org" };
	const orgId = "org-1";

	beforeEach(() => {
		mockFindFirst = vi.fn();
		ctx = {
			drizzleClient: {
				query: {
					organizationsTable: { findFirst: mockFindFirst },
				},
			},
			log: { error: vi.fn() },
			currentClient: { isAuthenticated: true, user: { id: "user-xyz" } },
		} as unknown as GraphQLContext;
	});

	it("throws unexpected error when organizationId is null", async () => {
		const parent: FakeActionItem = { organizationId: null };
		await expect(resolveOrganization(parent, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
		await expect(resolveOrganization(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Action item is missing an organizationId.",
		);
		expect(mockFindFirst).not.toHaveBeenCalled();
	});

	it("throws unexpected error when organization not found", async () => {
		mockFindFirst.mockResolvedValue(null);
		const parent: FakeActionItem = { organizationId: orgId };

		await expect(resolveOrganization(parent, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
		await expect(resolveOrganization(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
		expect(ctx.log.error).toHaveBeenCalledWith(
			`Postgres select operation returned no row for action item's organizationId: ${orgId}.`,
		);
		expect(mockFindFirst).toHaveBeenCalled();
	});

	it("returns organization when found", async () => {
		mockFindFirst.mockResolvedValue(fakeOrg);
		const parent: FakeActionItem = { organizationId: orgId };

		const result = await resolveOrganization(parent, {}, ctx);
		expect(result).toBe(fakeOrg);
		expect(ctx.log.error).not.toHaveBeenCalled();
		expect(mockFindFirst).toHaveBeenCalledWith({
			where: expect.any(Function),
		});
	});
});
