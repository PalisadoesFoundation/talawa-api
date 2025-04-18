// resolveCategoryOrganization.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCategoryOrganization } from "~/src/graphql/types/ActionItemCategory/organization";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

// Fake shape for parent in tests
interface FakeCategory {
	organizationId: string | null;
}

describe("resolveCategoryOrganization", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock<() => Promise<Organization | null>>;
	const fakeOrg: Organization = { id: "org-1", name: "My Org" } as Organization;

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.organizationsTable.findFirst as Mock<
			() => Promise<Organization | null>
		>;

		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "user-1" },
			},
			drizzleClient: mockDrizzle,
			log: {
				error: vi.fn(),
			},
		} as unknown as GraphQLContext;
	});

	it("throws unexpected when organizationId is null", async () => {
		const parent: FakeCategory = { organizationId: null };
		await expect(
			resolveCategoryOrganization(parent, {}, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
		await expect(
			resolveCategoryOrganization(parent, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Action item category is missing an organizationId.",
		);
		expect(findFirstMock).not.toHaveBeenCalled();
	});

	it("throws unexpected when organization not found", async () => {
		findFirstMock.mockResolvedValue(null);
		const parent: FakeCategory = { organizationId: "org-1" };

		await expect(
			resolveCategoryOrganization(parent, {}, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
		await expect(
			resolveCategoryOrganization(parent, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});
		expect(ctx.log.error).toHaveBeenCalledWith(
			`Postgres select operation returned no row for action item category's organizationId: org-1.`,
		);
		expect(findFirstMock).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.any(Function) }),
		);
	});

	it("returns the organization when found", async () => {
		findFirstMock.mockResolvedValue(fakeOrg);
		const parent: FakeCategory = { organizationId: "org-1" };

		const result = await resolveCategoryOrganization(parent, {}, ctx);
		expect(result).toBe(fakeOrg);
		expect(ctx.log.error).not.toHaveBeenCalled();
		expect(findFirstMock).toHaveBeenCalledWith(
			expect.objectContaining({ where: expect.any(Function) }),
		);
	});
});
