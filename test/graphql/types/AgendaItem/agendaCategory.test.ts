import { describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveCategory } from "~/src/graphql/types/AgendaItem/agendaCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.category resolver (resolveCategory)", () => {
	const baseAgendaItem = {
		categoryId: "123e4567-e89b-12d3-a456-426614174000",
	} as AgendaItemType;

	function createMockContext(overrides?: { categoryResult?: unknown }) {
		return {
			drizzleClient: {
				query: {
					agendaCategoriesTable: {
						findFirst: vi.fn().mockResolvedValue(overrides?.categoryResult),
					},
				},
			},
			log: {
				error: vi.fn(),
			},
		} as unknown as GraphQLContext;
	}

	it("returns agenda category when it exists", async () => {
		const mockCategory = {
			id: baseAgendaItem.categoryId,
			name: "Category",
		};

		const ctx = createMockContext({
			categoryResult: mockCategory,
		});

		const result = await resolveCategory(baseAgendaItem, {}, ctx);

		expect(result).toBe(mockCategory);
		expect(
			ctx.drizzleClient.query.agendaCategoriesTable.findFirst,
		).toHaveBeenCalledOnce();
		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("throws unexpected error when agenda category does not exist", async () => {
		const ctx = createMockContext({
			categoryResult: undefined,
		});

		await expect(
			resolveCategory(baseAgendaItem, {}, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);

		expect(ctx.log.error).toHaveBeenCalledWith(
			expect.stringContaining(
				"Postgres select operation returned an empty array",
			),
		);
	});
});
