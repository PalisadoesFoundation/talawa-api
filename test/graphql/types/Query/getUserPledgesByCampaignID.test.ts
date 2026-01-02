import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";

// Mock the GraphQL builder to track the queryField registration
vi.mock("~/src/graphql/builder", () => ({
	builder: {
		queryField: vi.fn((_name: string, fieldFn: (t: unknown) => unknown) => {
			// Mock the 't' object that provides field builder methods
			const mockT = {
				field: vi.fn().mockReturnValue(undefined),
				arg: vi.fn().mockReturnThis(),
			};
			// Call the field function to exercise the builder code
			fieldFn(mockT);
			return undefined;
		}),
		objectRef: vi.fn().mockReturnValue({
			implement: vi.fn(),
		}),
	},
}));

import { builder } from "~/src/graphql/builder";
// Import after mocking to ensure the builder registration is captured
import { resolveGetMyPledgesForCampaign } from "~/src/graphql/types/Query/getUserPledgesByCampaignID";

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
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});

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
			).rejects.toMatchObject({
				extensions: {
					code: "arguments_associated_resources_not_found",
				},
			});

			expect(
				mocks.drizzleClient.query.fundCampaignPledgesTable.findMany,
			).toHaveBeenCalledTimes(1);
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
					.findMany as ReturnType<typeof vi.fn>
			).mockImplementation(async (options) => {
				const { where } = (options ?? {}) as {
					where?: (...args: unknown[]) => unknown;
				};
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
					or: vi.fn((..._args: unknown[]) => orSentinel),
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
			});

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

	describe("GraphQL Builder Integration", () => {
		it("should register the GraphQL query field with correct configuration", () => {
			// Verify the builder.queryField was called during module import
			const queryFieldMock = builder.queryField as unknown as Mock;
			expect(queryFieldMock).toHaveBeenCalled();

			// Find the call for "getMyPledgesForCampaign"
			const queryFieldCall = queryFieldMock.mock.calls.find(
				(call: unknown[]) => call[0] === "getMyPledgesForCampaign",
			);

			expect(queryFieldCall).toBeDefined();
			expect(queryFieldCall?.[0]).toBe("getMyPledgesForCampaign");
			expect(typeof queryFieldCall?.[1]).toBe("function");

			// Verify the resolver function is properly exported
			expect(resolveGetMyPledgesForCampaign).toBeDefined();
			expect(typeof resolveGetMyPledgesForCampaign).toBe("function");
		});

		it("should configure the query field with correct arguments and types", () => {
			// Get the field configuration function
			const queryFieldMock = builder.queryField as unknown as Mock;
			const queryFieldCall = queryFieldMock.mock.calls.find(
				(call: unknown[]) => call[0] === "getMyPledgesForCampaign",
			);

			expect(queryFieldCall).toBeDefined();

			// Create a mock 't' object to capture the field configuration
			const mockT = {
				field: vi.fn(),
				arg: vi.fn().mockReturnValue({
					description: "Global id of the campaign.",
					required: true,
					type: "ID",
				}),
			};

			// Call the field configuration function
			const fieldConfigFn = queryFieldCall?.[1] as (t: typeof mockT) => void;
			fieldConfigFn(mockT);

			// Verify t.field was called with proper configuration
			expect(mockT.field).toHaveBeenCalledWith(
				expect.objectContaining({
					args: expect.any(Object),
					description:
						"Get pledges for the current user in a specific campaign.",
					resolve: resolveGetMyPledgesForCampaign,
					type: expect.any(Array),
				}),
			);
		});
	});
});
