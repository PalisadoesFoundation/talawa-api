// resolveCategory.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCategory } from "~/src/graphql/types/ActionItem/actionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";

describe("resolveCategory", () => {
	let ctx: GraphQLContext;
	let findFirstMock: Mock<
		() => Promise<
			{ id: string; name: string; isDisabled: boolean } | null | undefined
		>
	>;

	beforeEach(() => {
		const mockDrizzle = createMockDrizzleClient();
		findFirstMock = mockDrizzle.query.actionItemCategories.findFirst as Mock<
			() => Promise<
				{ id: string; name: string; isDisabled: boolean } | null | undefined
			>
		>;
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "test-user" },
			},
			drizzleClient: mockDrizzle,
			log: {
				error: vi.fn(),
			},
		} as unknown as GraphQLContext;
	});

	it("returns null when parent.categoryId is null", async () => {
		const result = await resolveCategory({ categoryId: null }, {}, ctx);
		expect(result).toBeNull();
		expect(findFirstMock).not.toHaveBeenCalled();
	});

	it("throws arguments_associated_resources_not_found when category not found", async () => {
		findFirstMock.mockResolvedValue(null);

		const parent = { categoryId: "nonexistent-id" };
		await expect(resolveCategory(parent, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);

		try {
			await resolveCategory(parent, {}, ctx);
		} catch (err) {
			expect(err).toMatchObject({
				message: "Category not found",
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [{ argumentPath: ["categoryId"] }],
				},
			});
			expect(ctx.log.error).toHaveBeenCalledWith(
				`Category with ID ${parent.categoryId} not found for ActionItem.`,
			);
		}
	});

	it("returns the category when found", async () => {
		const fakeCategory = {
			id: "cat-1",
			name: "Test Category",
			isDisabled: false,
		};
		findFirstMock.mockResolvedValue(fakeCategory);

		const result = await resolveCategory({ categoryId: "cat-1" }, {}, ctx);
		expect(result).toEqual(fakeCategory);
		expect(ctx.log.error).not.toHaveBeenCalled();
	});
});
