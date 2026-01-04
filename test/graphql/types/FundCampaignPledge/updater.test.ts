import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import {
	type Mock,
	afterEach,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { resolveUpdater } from "~/src/graphql/types/FundCampaignPledge/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mockFundCampaignPledge = {
	amount: 100,
	createdAt: new Date(),
	id: "pledge123",
	creatorId: "creator123",
	updatedAt: new Date(),
	updaterId: "user456",
	campaignId: "campaign1",
	note: "Sample pledge",
	pledgerId: "pledger123",
};

describe("resolveUpdater", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user123",
		);
		ctx = context;
		mocks = newMocks;
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated or not found", async () => {
		const { context: unauthenticatedCtx } = createMockGraphQLContext(false);

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, unauthenticatedCtx),
		).rejects.toThrow(TalawaGraphQLError);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("throws an unexpected error if campaign does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(TalawaGraphQLError);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign pledge's campaign id that isn't null.",
		);
	});

	test("throws an unauthorized error if user is not an administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: { membershipsWhereOrganization: [{ role: "regular" }] },
			},
		});

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	test("returns null if updaterId is null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, updaterId: null },
			{},
			ctx,
		);
		expect(result).toBeNull();
	});

	test("returns current user if they are the updater", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, updaterId: "user123" },
			{},
			ctx,
		);
		expect(result).toEqual({ id: "user123", role: "administrator" });
	});

	test("throws unexpected error if updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce(undefined);
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(TalawaGraphQLError);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign pledge's updater id that isn't null.",
		);
	});

	test("returns the existing user if updaterId is set and user exists", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce({ id: "user456", role: "member" });
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(mockFundCampaignPledge, {}, ctx);
		expect(result).toEqual({ id: "user456", role: "member" });
	});

	test("ensures usersTable query is called with correct user ID", async () => {
		(mocks.drizzleClient.query.usersTable.findFirst as Mock).mockImplementation(
			({ where }) => {
				// Ensure `where` is a function and execute it
				if (typeof where === "function") {
					const fakeQueryInput = { id: "user123" };
					const fakeQueryOperators = {
						eq: (columnValue: string, expectedValue: string) =>
							columnValue === expectedValue,
					};

					// Ensure the function behaves correctly
					if (where(fakeQueryInput, fakeQueryOperators)) {
						return Promise.resolve({ id: "user123" });
					}
				}

				return Promise.resolve(null);
			},
		);
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await resolveUpdater(mockFundCampaignPledge, {}, ctx);

		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.any(Function),
			}),
		);
	});

	test("ensures fundCampaignsTable membership check uses correct member ID", async () => {
		const currentUserId = "user123";
		const campaignId = "campaign1";

		const { context: ctx, mocks } = createMockGraphQLContext(
			true,
			currentUserId,
		);

		const mockPledge = {
			campaignId: campaignId,
			updaterId: currentUserId,
		} as FundCampaignPledge;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user123",
			role: "administrator",
		});

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});
		const result = await resolveUpdater(mockPledge, {}, ctx);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			{
				where: expect.any(Function),
			},
		);

		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalledWith({
			columns: { currencyCode: true },
			with: expect.objectContaining({
				fund: expect.objectContaining({
					columns: { isTaxDeductible: true },
					with: expect.objectContaining({
						organization: expect.objectContaining({
							columns: { countryCode: true },
							with: expect.objectContaining({
								membershipsWhereOrganization: expect.objectContaining({
									columns: { role: true },
									where: expect.any(Function),
								}),
							}),
						}),
					}),
				}),
			}),
			where: expect.any(Function),
		});

		expect(result).toEqual({
			id: currentUserId,
			role: "administrator",
		});
	});

	test("allows user with organization membership role to proceed", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			currencyCode: "USD",
			fund: {
				isTaxDeductible: true,
				organization: {
					countryCode: "GB",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(mockFundCampaignPledge, {}, ctx);

		expect(result).toEqual({ id: "user123", role: "member" });
	});

	test("tests the where clause in fundCampaignsTable query", async () => {
		const currentUserId = "user123";
		const campaignId = "campaign1";

		const { context: ctx, mocks } = createMockGraphQLContext(
			true,
			currentUserId,
		);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: currentUserId,
			role: "administrator",
		});

		const mockOperators = {
			eq: vi.fn().mockReturnValue(true),
		};

		const mockFields = {
			id: "id",
			memberId: "memberId",
		};

		//for compile time type assertion
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ where }) => {
			// Execute the `where` function
			where(mockFields, mockOperators);

			// Verify `eq` is called correctly
			expect(mockOperators.eq).toHaveBeenCalledWith("id", currentUserId);

			return Promise.resolve({
				id: currentUserId,
				role: "member",
			});
		});

		(
			ctx.drizzleClient.query.fundCampaignsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mockImplementation(({ where }) => {
			// Execute the `where` function
			where(mockFields, mockOperators);

			// Verify `eq` is called correctly
			expect(mockOperators.eq).toHaveBeenCalledWith("id", campaignId);

			return Promise.resolve({
				id: campaignId,
				currencyCode: "USD",
				fund: {
					isTaxDeductible: true,
					organization: {
						countryCode: "US",
						membershipsWhereOrganization: [
							{ role: "administrator", memberId: currentUserId },
						],
					},
				},
			});
		});

		const mockPledge = {
			campaignId: campaignId,
			updaterId: currentUserId,
		} as FundCampaignPledge;

		await resolveUpdater(mockPledge, {}, ctx);

		expect(
			ctx.drizzleClient.query.fundCampaignsTable.findFirst as ReturnType<
				typeof vi.fn
			>,
		).toHaveBeenCalled();
	});

	test("ensures where condition is applied correctly for fundCampaignsTable", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
		});

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			currencyCode: "USD",
			fund: {
				isTaxDeductible: true,
				organization: {
					countryCode: "GB",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await resolveUpdater(mockFundCampaignPledge, {}, ctx);
		const calls = (
			mocks.drizzleClient.query.fundCampaignsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mock.calls;

		if (calls.length > 0) {
			const callArgs = calls[0]?.[0];

			const whereFn =
				callArgs?.with?.fund?.with?.organization?.with
					?.membershipsWhereOrganization?.where;
			expect(whereFn).toBeDefined();

			if (whereFn) {
				const mockFields = { memberId: "user123" };
				const mockOperators = { eq: vi.fn((a, b) => ({ field: a, value: b })) };

				whereFn(mockFields, mockOperators);

				expect(mockOperators.eq).toHaveBeenCalledWith(
					mockFields.memberId,
					"user123",
				);
			}
		}
	});

	test("returns null when pledger views own pledge with null updaterId", async () => {
		const pledgerId = "user123";

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, pledgerId, updaterId: null },
			{},
			ctx,
		);

		expect(result).toBeNull();
	});

	test("returns current user when pledger is also the updater", async () => {
		const pledgerId = "user123";
		const updaterId = "user123";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "regular",
		});

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, pledgerId, updaterId },
			{},
			ctx,
		);

		expect(result).toEqual({ id: "user123", role: "regular" });
	});

	test("throws unauthenticated error when pledger is updater but user no longer exists", async () => {
		const pledgerId = "user123";
		const updaterId = "user123";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdater(
				{ ...mockFundCampaignPledge, pledgerId, updaterId },
				{},
				ctx,
			),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	test("returns existing updater when pledger views own pledge with different updater", async () => {
		const pledgerId = "user123";
		const updaterId = "updater456";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: updaterId,
			role: "regular",
		});

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, pledgerId, updaterId },
			{},
			ctx,
		);

		expect(result).toEqual({ id: updaterId, role: "regular" });
	});

	test("throws unexpected error when pledger's pledge has non-existent updater", async () => {
		const pledgerId = "user123";
		const updaterId = "updater456";

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdater(
				{ ...mockFundCampaignPledge, pledgerId, updaterId },
				{},
				ctx,
			),
		).rejects.toThrow(TalawaGraphQLError);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign pledge's updater id that isn't null.",
		);
	});

	test("allows system administrator without org membership to view updater", async () => {
		const currentUserId = "user123";
		const updaterId = "updater456";

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: currentUserId, role: "administrator" })
			.mockResolvedValueOnce({ id: updaterId, role: "regular" });

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			currencyCode: "USD",
			fund: {
				isTaxDeductible: true,
				organization: {
					countryCode: "US",
					membershipsWhereOrganization: [],
				},
			},
		});

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, updaterId },
			{},
			ctx,
		);

		expect(result).toEqual({ id: updaterId, role: "regular" });
	});
});
