import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaign as FundCampaignType } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { fundCampaignFundResolver } from "~/src/graphql/types/FundCampaign/fund";

describe("FundCampaign Resolver - Fund Field", () => {
	let ctx: GraphQLContext;
	let mockFundCampaign: FundCampaignType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const createMockOperators = () => {
		return {
			eq: vi.fn((field: unknown, value: unknown) => ({ field, value })),
		} as Record<string, (...args: unknown[]) => unknown>;
	};

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockFundCampaign = {
			id: "campaign-111",
			fundId: "fund-456",
		} as FundCampaignType;

		vi.clearAllMocks();
	});

	it("should return the fund when it exists", async () => {
		const mockFund = { id: "fund-456", name: "Test Fund" };
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);

		const result = await fundCampaignFundResolver(mockFundCampaign, {}, ctx);

		expect(result).toEqual(mockFund);
	});

	it("should query fundsTable with the correct fundId from parent", async () => {
		const mockFund = { id: "fund-456" };
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);

		await fundCampaignFundResolver(mockFundCampaign, {}, ctx);

		expect(
			mocks.drizzleClient.query.fundsTable.findFirst,
		).toHaveBeenCalledTimes(1);

		const callArgs = mocks.drizzleClient.query.fundsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				where: (
					fields: Record<string, unknown>,
					operators: Record<string, (...args: unknown[]) => unknown>,
				) => unknown;
			},
		];
		const whereFn = callArgs[0].where;

		const mockFields = { id: "id_field" };
		const mockOperators = createMockOperators();

		whereFn(mockFields, mockOperators);

		expect(mockOperators.eq).toHaveBeenCalledWith(
			"id_field",
			mockFundCampaign.fundId,
		);
	});

	it("should throw unexpected error and log when fund does not exist", async () => {
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(undefined);

		await expect(
			fundCampaignFundResolver(mockFundCampaign, {}, ctx),
		).rejects.toMatchObject({
			extensions: { code: "unexpected" },
		});

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign's fund id that isn't null.",
		);
	});

	it("should propagate database errors", async () => {
		const dbError = new Error("DB Connection Error");
		mocks.drizzleClient.query.fundsTable.findFirst.mockRejectedValue(dbError);

		await expect(
			fundCampaignFundResolver(mockFundCampaign, {}, ctx),
		).rejects.toThrow(dbError);
	});
});
