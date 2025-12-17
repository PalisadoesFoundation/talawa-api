import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaignPledge as FundCampaignPledgeType } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
// Import to ensure the resolver is registered
import "~/src/graphql/types/FundCampaignPledge/campaign";

describe("FundCampaignPledge Resolver - campaign Field", () => {
	let ctx: GraphQLContext;
	let mockFundCampaignPledge: FundCampaignPledgeType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let campaignResolver: (
		parent: FundCampaignPledgeType,
		args: Record<string, unknown>,
		ctx: GraphQLContext,
	) => Promise<unknown>;

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user123",
		);
		ctx = context;
		mocks = newMocks;

		mockFundCampaignPledge = {
			id: "pledge123",
			amount: 10000,
			createdAt: new Date(),
			creatorId: "creator123",
			updatedAt: new Date(),
			updaterId: "updater123",
			campaignId: "campaign123",
			note: "Test Pledge",
			pledgerId: "pledger123",
		};

		// Extract the resolver from the builder's type configuration
		const typeConfig =
			builder.configStore.typeConfigs.get("FundCampaignPledge");

		if (
			typeConfig &&
			"pothosOptions" in typeConfig &&
			typeConfig.pothosOptions
		) {
			const pothosOptions = typeConfig.pothosOptions as {
				fields?: (t: never) => Record<string, { resolve?: unknown }>;
			};
			if (pothosOptions.fields && typeof pothosOptions.fields === "function") {
				const mockT = {
					field: (config: { resolve: unknown }) => config,
				};
				const fields = pothosOptions.fields(mockT as never);
				if (
					"campaign" in fields &&
					fields.campaign &&
					"resolve" in fields.campaign
				) {
					campaignResolver = fields.campaign.resolve as (
						parent: FundCampaignPledgeType,
						args: Record<string, unknown>,
						ctx: GraphQLContext,
					) => Promise<unknown>;
				}
			}
		}

		vi.clearAllMocks();
	});

	it("should return the fund campaign when it exists", async () => {
		const mockCampaign = {
			id: "campaign123",
			name: "Test Campaign",
			fundId: "fund123",
			goalAmount: 50000,
			currencyCode: "USD",
			startDate: new Date(),
			endDate: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			mockCampaign,
		);

		const result = await campaignResolver(mockFundCampaignPledge, {}, ctx);

		expect(result).toEqual(mockCampaign);
		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();
	});

	it("should throw unexpected error and log when fund campaign does not exist", async () => {
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			campaignResolver(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign pledge's campaign id that isn't null.",
		);
	});

	it("should query fundCampaignsTable with the correct campaignId", async () => {
		const mockCampaign = {
			id: "campaign123",
			name: "Test Campaign",
			fundId: "fund123",
			goalAmount: 50000,
			currencyCode: "USD",
			startDate: new Date(),
			endDate: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			mockCampaign,
		);

		await campaignResolver(mockFundCampaignPledge, {}, ctx);

		const calls = (
			mocks.drizzleClient.query.fundCampaignsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mock.calls;

		expect(calls.length).toBeGreaterThan(0);

		const whereClause = calls[0]?.[0]?.where;
		expect(whereClause).toBeDefined();

		if (typeof whereClause === "function") {
			const mockFields = {
				id: "mockIdField",
				campaignId: "mockCampaignIdField",
			};

			const mockOperators = {
				eq: vi.fn((field: unknown, value: unknown) => ({
					field,
					value,
				})),
			};

			whereClause(mockFields, mockOperators);

			expect(mockOperators.eq).toHaveBeenCalledWith(
				mockFields.id,
				mockFundCampaignPledge.campaignId,
			);
		}
	});

	it("should handle different campaign IDs correctly", async () => {
		const differentCampaignId = "different-campaign-456";
		const pledgeWithDifferentCampaign = {
			...mockFundCampaignPledge,
			campaignId: differentCampaignId,
		};

		const mockCampaign = {
			id: differentCampaignId,
			name: "Different Campaign",
			fundId: "fund456",
			goalAmount: 75000,
			currencyCode: "EUR",
			startDate: new Date(),
			endDate: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			mockCampaign,
		);

		const result = (await campaignResolver(
			pledgeWithDifferentCampaign,
			{},
			ctx,
		)) as typeof mockCampaign;

		expect(result).toEqual(mockCampaign);
		expect(result.id).toBe(differentCampaignId);
	});
});
