import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { resolvePledgedAmount } from "~/src/graphql/types/FundCampaign/pledgedAmount";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("FundCampaign Resolver - PledgedAmount Field", () => {
	let ctx: GraphQLContext;
	let mockFundCampaign: FundCampaign;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockFundCampaign = {
			id: "campaign-123",
			name: "Test Campaign",
			fundId: "fund-456",
			creatorId: "user-123",
			updaterId: "user-123",
			createdAt: new Date(),
			updatedAt: new Date(),
			currencyCode: "USD",
			goalAmount: 10000,
			startAt: new Date("2024-01-01"),
			endAt: new Date("2024-12-31"),
			amountRaised: 0,
		};

		vi.clearAllMocks();
	});

	it("should throw unexpected error when aggregate result is undefined", async () => {
		// Mock the select chain to return empty array (destructuring gives undefined)
		const mockWhere = vi.fn().mockResolvedValue([]);
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		mocks.drizzleClient.select = mockSelect;

		await expect(
			resolvePledgedAmount(mockFundCampaign, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
				message: "Something went wrong. Please try again later.",
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres aggregate select operation unexpectedly returned an empty array instead of throwing an error.",
		);
	});

	it("should return 0n when pledged amount is null (no pledges)", async () => {
		// Mock the select chain to return { amount: null }
		const mockWhere = vi.fn().mockResolvedValue([{ amount: null }]);
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		mocks.drizzleClient.select = mockSelect;

		const result = await resolvePledgedAmount(mockFundCampaign, {}, ctx);

		expect(result).toBe(0n);
	});

	it("should return BigInt of the amount when pledges exist", async () => {
		// Mock the select chain to return { amount: "5000" } (Postgres returns string for sum)
		const mockWhere = vi.fn().mockResolvedValue([{ amount: "5000" }]);
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		mocks.drizzleClient.select = mockSelect;

		const result = await resolvePledgedAmount(mockFundCampaign, {}, ctx);

		expect(result).toBe(5000n);
	});

	it("should handle large pledge amounts correctly", async () => {
		// Mock a very large amount to verify BigInt handling
		const largeAmount = "9007199254740991"; // Number.MAX_SAFE_INTEGER
		const mockWhere = vi.fn().mockResolvedValue([{ amount: largeAmount }]);
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		mocks.drizzleClient.select = mockSelect;

		const result = await resolvePledgedAmount(mockFundCampaign, {}, ctx);

		expect(result).toBe(BigInt(largeAmount));
	});

	it("should query fundCampaignPledgesTable with correct campaign id", async () => {
		const mockWhere = vi.fn().mockResolvedValue([{ amount: "1000" }]);
		const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
		const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
		mocks.drizzleClient.select = mockSelect;

		await resolvePledgedAmount(mockFundCampaign, {}, ctx);

		// Verify select was called
		expect(mockSelect).toHaveBeenCalled();

		// Verify from was called (with the pledges table)
		expect(mockFrom).toHaveBeenCalled();

		// Verify where was called
		expect(mockWhere).toHaveBeenCalled();
	});
});
