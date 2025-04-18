// resolveOrganization.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveOrganization } from "~/src/graphql/types/ActionItem/organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

interface FakeActionItem {
	organizationId: string | null;
}

type OrgRecord = { id: string; name: string };

describe("resolveOrganization", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock<() => Promise<OrgRecord | null | undefined>>;
	const fakeOrg: OrgRecord = { id: "org-1", name: "Test Org" };

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.organizationsTable.findFirst as Mock<
			() => Promise<OrgRecord | null | undefined>
		>;

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "user-xyz" },
			},
			drizzleClient: mockDrizzle,
			log: {
				error: vi.fn(),
			},
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
		expect(findFirstMock).not.toHaveBeenCalled();
	});

	it("throws unexpected error when organization not found", async () => {
		findFirstMock.mockResolvedValue(null);
		const parent: FakeActionItem = { organizationId: "org-1" };

		await expect(resolveOrganization(parent, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
		await expect(resolveOrganization(parent, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});

		expect(ctx.log.error).toHaveBeenCalledWith(
			`Postgres select operation returned no row for action item's organizationId: org-1.`,
		);
		expect(findFirstMock).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.any(Function) }),
		);
	});

	it("returns organization when found", async () => {
		findFirstMock.mockResolvedValue(fakeOrg);
		const parent: FakeActionItem = { organizationId: "org-1" };

		const result = await resolveOrganization(parent, {}, ctx);
		expect(result).toBe(fakeOrg);
		expect(ctx.log.error).not.toHaveBeenCalled();
		expect(findFirstMock).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.any(Function) }),
		);
	});
});
