import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { resolveUpdater } from "~/src/graphql/types/FundCampaignPledge/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

const mockDrizzleClient = {
	query: {
		usersTable: {
			findFirst: vi.fn(),
		},
		fundCampaignsTable: {
			findFirst: vi.fn(),
		},
	},
	_: vi.fn(),
	$with: vi.fn(),
	$count: vi.fn(),
	with: vi.fn(),
	select: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
};

const mockCtx = {
	currentClient: {
		isAuthenticated: true as const,
		user: { id: "user123", role: "member" },
	},
	drizzleClient: mockDrizzleClient,
	log: { error: vi.fn() },
	envConfig: {},
	jwt: {},
	miniots: {},
	minio: {},
} as unknown as ContextType;

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
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("throws an unauthenticated error if user is not authenticated or not found", async () => {
		const unauthenticatedCtx = {
			...mockCtx,
			currentClient: { isAuthenticated: false as const },
		};

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, unauthenticatedCtx),
		).rejects.toThrow(TalawaGraphQLError);

		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, mockCtx),
		).rejects.toThrow(TalawaGraphQLError);
	});

	test("throws an unexpected error if campaign does not exist", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, mockCtx),
		).rejects.toThrow(TalawaGraphQLError);
		expect(mockCtx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign pledge's campaign id that isn't null.",
		);
	});

	test("throws an unauthorized error if user is not an administrator", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});
		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: { membershipsWhereOrganization: [{ role: "member" }] },
			},
		});

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, mockCtx),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	test("returns null if updaterId is null", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, updaterId: null },
			{},
			mockCtx,
		);
		expect(result).toBeNull();
	});

	test("returns current user if they are the updater", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(
			{ ...mockFundCampaignPledge, updaterId: "user123" },
			{},
			mockCtx,
		);
		expect(result).toEqual({ id: "user123", role: "administrator" });
	});

	test("throws unexpected error if updater user does not exist", async () => {
		mockDrizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce(undefined);
		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(
			resolveUpdater(mockFundCampaignPledge, {}, mockCtx),
		).rejects.toThrow(TalawaGraphQLError);
		expect(mockCtx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign pledge's updater id that isn't null.",
		);
	});

	test("returns the existing user if updaterId is set and user exists", async () => {
		mockDrizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce({ id: "user456", role: "member" });
		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(mockFundCampaignPledge, {}, mockCtx);
		expect(result).toEqual({ id: "user456", role: "member" });
	});

	test("ensures usersTable query is called with correct user ID", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockImplementation(
			({ where }) => {
				return (
					where({ id: "user123" }, { eq: (a: string, b: string) => a === b }) &&
					Promise.resolve({ id: "user123" })
				);
			},
		);
		await resolveUpdater(mockFundCampaignPledge, {}, mockCtx);
		expect(mockDrizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
	});

	test("ensures fundCampaignsTable membership check uses correct member ID", async () => {
		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockImplementation(
			({ where }) => {
				return (
					where(
						{ id: "campaign1" },
						{ eq: (a: string, b: string) => a === b },
					) &&
					Promise.resolve({
						fund: {
							organization: {
								membershipsWhereOrganization: [
									{ role: "administrator", memberId: "user123" },
								],
							},
						},
					})
				);
			},
		);
		await resolveUpdater(mockFundCampaignPledge, {}, mockCtx);
		expect(
			mockDrizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();
	});

	test("allows user with organization membership role to proceed", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			currencyCode: "USD",
			fund: {
				isTaxDeductible: true,
				organization: {
					countryCode: "GB",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(mockFundCampaignPledge, {}, mockCtx);

		expect(result).toEqual({ id: "user123", role: "member" });
	});

	test("ensures where condition is applied correctly for membershipsWhereOrganization", async () => {
		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mockDrizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			currencyCode: "USD",
			fund: {
				isTaxDeductible: true,
				organization: {
					countryCode: "GB",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await resolveUpdater(mockFundCampaignPledge, {}, mockCtx);

		const callArgs =
			mockDrizzleClient.query.fundCampaignsTable.findFirst.mock.calls[0]?.[0];
		const whereFn =
			callArgs?.with?.fund?.with?.organization?.with
				?.membershipsWhereOrganization?.where;

		expect(whereFn).toBeDefined();

		if (whereFn) {
			const mockFields = { memberId: "someMemberId" };
			const mockOperators = { eq: vi.fn((a, b) => ({ field: a, value: b })) };

			whereFn(mockFields, mockOperators);

			expect(mockOperators.eq).toHaveBeenCalledWith(
				mockFields.memberId,
				"user123",
			);
		}
	});
});
