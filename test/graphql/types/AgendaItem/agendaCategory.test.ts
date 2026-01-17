import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaItem as AgendaItemType } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { resolveCategory } from "~/src/graphql/types/AgendaItem/agendaCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("AgendaItem.category resolver (resolveCategory)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	const baseAgendaItem = {
		categoryId: "123e4567-e89b-12d3-a456-426614174000",
	} as AgendaItemType;

	it("returns agenda category when it exists", async () => {
		const { context, mocks } = createMockGraphQLContext();

		const mockCategory = {
			id: baseAgendaItem.categoryId,
			name: "Category",
		};

		mocks.drizzleClient.query.agendaCategoriesTable.findFirst.mockResolvedValueOnce(
			mockCategory,
		);

		const result = await resolveCategory(baseAgendaItem, {}, context);

		expect(result).toBe(mockCategory);
		expect(
			mocks.drizzleClient.query.agendaCategoriesTable.findFirst,
		).toHaveBeenCalledOnce();
		expect(context.log.error).not.toHaveBeenCalled();
	});

	it("throws unexpected error when agenda category does not exist", async () => {
		const { context, mocks } = createMockGraphQLContext();

		mocks.drizzleClient.query.agendaCategoriesTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(resolveCategory(baseAgendaItem, {}, context)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(context.log.error).toHaveBeenCalledWith(
			expect.stringContaining(
				"Postgres select operation returned an empty array",
			),
		);
	});
});
