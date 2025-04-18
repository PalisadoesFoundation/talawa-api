import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCategory } from "~/src/graphql/types/ActionItem/categoryId";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("resolveCategory", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		const mockFindFirst = vi.fn();
		ctx = {
			currentClient: {
				isAuthenticated: true,
				user: { id: "test-user" },
			},
			drizzleClient: {
				query: {
					actionItemCategories: {
						findFirst: mockFindFirst as Mock,
					},
				},
			},
			log: {
				error: vi.fn(),
			},
		} as unknown as GraphQLContext;
	});

	it("returns null when parent.categoryId is null", async () => {
		const result = await resolveCategory({ categoryId: null }, {}, ctx);
		expect(result).toBeNull();
		expect(
			ctx.drizzleClient.query.actionItemCategories.findFirst,
		).not.toHaveBeenCalled();
	});

	it("throws TalawaGraphQLError with correct extensions when category not found", async () => {
		(
			ctx.drizzleClient.query.actionItemCategories.findFirst as Mock
		).mockResolvedValue(null);
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
		(
			ctx.drizzleClient.query.actionItemCategories.findFirst as Mock
		).mockResolvedValue(fakeCategory);

		const result = await resolveCategory({ categoryId: "cat-1" }, {}, ctx);
		expect(result).toBe(fakeCategory);
		expect(ctx.log.error).not.toHaveBeenCalled();
	});
});
