import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveGetMyPledgesForCampaign } from "~/src/graphql/types/Query/getUserPledgesByCampaignID";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Query Resolver - getMyPledgesForCampaign", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	const campaignId = "campaign-123";
	const currentUserId = "user-123";

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			currentUserId,
		);
		ctx = context;
		mocks = newMocks;
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			// Create a fresh unauthenticated context instead of toggling flag
			const { context: unauthCtx, mocks: unauthMocks } =
				createMockGraphQLContext(false);

			await expect(
				resolveGetMyPledgesForCampaign({}, { campaignId }, unauthCtx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);

			expect(
				unauthMocks.drizzleClient.query.fundCampaignPledgesTable.findMany,
			).not.toHaveBeenCalled();
		});
	});

	describe("Success Cases", () => {
		it("should return pledges where user is the pledger", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "USD",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId },
				ctx,
			);

			expect(result).toEqual(mockPledges);
			expect(
				mocks.drizzleClient.query.fundCampaignPledgesTable.findMany,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
				with: {
					pledger: {
						columns: { id: true, name: true, avatarName: true },
					},
					campaign: {
						columns: {
							id: true,
							name: true,
							startAt: true,
							endAt: true,
							currencyCode: true,
						},
					},
				},
			});
		});

		it("should return pledges where user is the creator", async () => {
			const mockPledges = [
				{
					id: "pledge-2",
					campaignId,
					pledgerId: "other-user",
					creatorId: currentUserId,
					amount: 200,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: "other-user",
						name: "Other User",
						avatarName: "other-avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "EUR",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId },
				ctx,
			);

			expect(result).toEqual(mockPledges);
		});

		it("should return multiple pledges for the same user", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: currentUserId,
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "USD",
					},
				},
				{
					id: "pledge-2",
					campaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 200,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "USD",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId },
				ctx,
			);

			expect(result).toHaveLength(2);
			expect(result).toEqual(mockPledges);
		});
	});

	describe("Error Cases", () => {
		it("should throw error when no pledges found (campaign not found or no user pledges)", async () => {
			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				resolveGetMyPledgesForCampaign({}, { campaignId }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["campaignId"] }],
					},
				}),
			);
		});
	});

	describe("Database Query Logic", () => {
		it("should correctly construct where clause with AND and OR operators", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "USD",
					},
				},
			];

			(
				mocks.drizzleClient.query.fundCampaignPledgesTable
					.findMany as unknown as ReturnType<typeof vi.fn>
			).mockImplementation(
				async (options: { where?: (...args: unknown[]) => unknown }) => {
					const { where } = options ?? {};
					// Validate the where clause is called with the correct structure
					expect(where).toBeDefined();
					expect(typeof where).toBe("function");

					// Create sentinel objects to track the nesting structure
					const eqCampaignSentinel = { type: "eq", field: "campaignId" };
					const eqPledgerSentinel = { type: "eq", field: "pledgerId" };
					const eqCreatorSentinel = { type: "eq", field: "creatorId" };
					const orSentinel = { type: "or" };

					const mockOperators = {
						and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
						or: vi.fn((...args: unknown[]) => orSentinel),
						eq: vi.fn((field: unknown, value: unknown) => {
							if (field === "campaignId") return eqCampaignSentinel;
							if (field === "pledgerId") return eqPledgerSentinel;
							if (field === "creatorId") return eqCreatorSentinel;
							return { type: "eq", field, value };
						}),
					};

					const mockPledgesTable = {
						campaignId: "campaignId",
						pledgerId: "pledgerId",
						creatorId: "creatorId",
					};

					if (where) {
						where(mockPledgesTable, mockOperators);
					}

					// Verify the structure: AND( eq(campaignId), OR(eq(pledgerId), eq(creatorId)) )
					expect(mockOperators.and).toHaveBeenCalledTimes(1);
					expect(mockOperators.or).toHaveBeenCalledTimes(1);
					expect(mockOperators.eq).toHaveBeenCalledTimes(3);

					// Verify eq was called with correct arguments
					expect(mockOperators.eq).toHaveBeenCalledWith(
						mockPledgesTable.campaignId,
						campaignId,
					);
					expect(mockOperators.eq).toHaveBeenCalledWith(
						mockPledgesTable.pledgerId,
						currentUserId,
					);
					expect(mockOperators.eq).toHaveBeenCalledWith(
						mockPledgesTable.creatorId,
						currentUserId,
					);

					// Verify OR was called with the two eq sentinels for pledgerId and creatorId
					expect(mockOperators.or).toHaveBeenCalledWith(
						eqPledgerSentinel,
						eqCreatorSentinel,
					);

					// Verify AND was called with eq(campaignId) and the OR result
					const andCallArgs = mockOperators.and.mock.calls[0];
					if (andCallArgs) {
						expect(andCallArgs).toHaveLength(2);
						expect(andCallArgs[0]).toBe(eqCampaignSentinel);
						expect(andCallArgs[1]).toBe(orSentinel);
					}

					return mockPledges;
				},
			);

			await resolveGetMyPledgesForCampaign({}, { campaignId }, ctx);
		});

		it("should include correct relations in the query", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: currentUserId,
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "USD",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			await resolveGetMyPledgesForCampaign({}, { campaignId }, ctx);

			expect(
				mocks.drizzleClient.query.fundCampaignPledgesTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					with: {
						pledger: {
							columns: { id: true, name: true, avatarName: true },
						},
						campaign: {
							columns: {
								id: true,
								name: true,
								startAt: true,
								endAt: true,
								currencyCode: true,
							},
						},
					},
				}),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different campaign IDs correctly", async () => {
			const differentCampaignId = "different-campaign-456";
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId: differentCampaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: differentCampaignId,
						name: "Different Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "USD",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId: differentCampaignId },
				ctx,
			);

			expect(result).toEqual(mockPledges);
			expect(result[0]?.campaignId).toBe(differentCampaignId);
		});

		it("should handle pledges with different currency codes", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "EUR",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId },
				ctx,
			);

			expect(result[0]?.campaign.currencyCode).toBe("EUR");
		});

		it("should handle pledges with zero amount", async () => {
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 0,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Test Campaign",
						startAt: new Date("2025-01-01"),
						endAt: new Date("2025-12-31"),
						currencyCode: "USD",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId },
				ctx,
			);

			expect(result[0]?.amount).toBe(0);
		});

		it("should handle pledges with past campaign dates", async () => {
			const pastDate = new Date("2020-01-01");
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Past Campaign",
						startAt: pastDate,
						endAt: new Date("2020-12-31"),
						currencyCode: "USD",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId },
				ctx,
			);

			expect(result[0]?.campaign.startAt).toEqual(pastDate);
		});

		it("should handle pledges with future campaign dates", async () => {
			const futureStartDate = new Date("2030-01-01");
			const futureEndDate = new Date("2030-12-31");
			const mockPledges = [
				{
					id: "pledge-1",
					campaignId,
					pledgerId: currentUserId,
					creatorId: "other-user",
					amount: 100,
					note: null,
					createdAt: new Date(),
					updatedAt: null,
					updaterId: null,
					pledger: {
						id: currentUserId,
						name: "Test User",
						avatarName: "avatar.jpg",
					},
					campaign: {
						id: campaignId,
						name: "Future Campaign",
						startAt: futureStartDate,
						endAt: futureEndDate,
						currencyCode: "USD",
					},
				},
			];

			mocks.drizzleClient.query.fundCampaignPledgesTable.findMany.mockResolvedValue(
				mockPledges,
			);

			const result = await resolveGetMyPledgesForCampaign(
				{},
				{ campaignId },
				ctx,
			);

			expect(result[0]?.campaign.startAt).toEqual(futureStartDate);
			expect(result[0]?.campaign.endAt).toEqual(futureEndDate);
		});
	});
});
