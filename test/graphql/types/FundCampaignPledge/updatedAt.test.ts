import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { updatedAtResolver } from "~/src/graphql/types/FundCampaignPledge/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("FundCampaignPledge Resolver - updatedAt Field", () => {
	let ctx: GraphQLContext;
	let mockFundCampaignPledge: FundCampaignPledge;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	const setupAuthorizedMocks = () => {
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
	};

	const createMockOperators = () => {
		return {
			eq: vi.fn((field: unknown, value: unknown) => ({ field, value })),
		} as Record<string, (...args: unknown[]) => unknown>;
	};

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(true, "123");
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

		vi.clearAllMocks();
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	it("should throw unauthenticated error when user is undefined", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	it("should throw unauthorized_action error when user has no organization memberships", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [],
				},
			},
		});

		await expect(
			updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("should throw unauthorized_action when membershipsWhereOrganization.role is not an administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "member" }],
				},
			},
		});

		await expect(
			updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("should return updatedAt if current user is pledger", async () => {
		Object.assign(ctx.currentClient, {
			user: { id: "user123" },
			isAuthenticated: true,
		});

		await expect(
			updatedAtResolver(
				{ ...mockFundCampaignPledge, pledgerId: "user123" },
				{},
				ctx,
			),
		).resolves.toEqual(mockFundCampaignPledge.updatedAt);
	});

	it("should throw unexpected error when fund campaign does not exist", async () => {
		setupAuthorizedMocks();

		// Override to return undefined for fund campaign
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
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

	it("should return updatedAt when user is an organization administrator", async () => {
		setupAuthorizedMocks();

		await expect(
			updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
		).resolves.toEqual(mockFundCampaignPledge.updatedAt);
	});

	it("should return updatedAt when user is system administrator regardless of organization role", async () => {
		// User is system admin, but only a 'member' in the organization
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "member" }],
				},
			},
		});

		await expect(
			updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
		).resolves.toEqual(mockFundCampaignPledge.updatedAt);
	});

	it("should query fundCampaignsTable with campaignId", async () => {
		setupAuthorizedMocks();

		await updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext);

		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();

		const callArgs = mocks.drizzleClient.query.fundCampaignsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				where: (
					fields: Record<string, unknown>,
					operators: Record<string, (...args: unknown[]) => unknown>,
				) => unknown;
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		const whereFunction = callArgs[0].where;

		// Create mock fields and operators to test the where function
		const mockFields: Record<string, unknown> = { id: "mockField" };
		const mockOperators = createMockOperators();

		// Call the where function to see what it does
		whereFunction(mockFields, mockOperators);

		// Verify it was called with campaignId ("campaign123" from mockFundCampaignPledge)
		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "campaign123");

		// Verify it was not called with parent.id or any other value
		expect(mockOperators.eq).not.toHaveBeenCalledWith(
			"mockField",
			mockFundCampaignPledge.id,
		);
	});

	it("should query usersTable with currentUserId", async () => {
		setupAuthorizedMocks();

		await updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext);

		// Verify that usersTable.findFirst was called
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();

		const callArgs = mocks.drizzleClient.query.usersTable.findFirst.mock
			.calls[0] as unknown as [
			{
				where: (
					fields: Record<string, unknown>,
					operators: Record<string, (...args: unknown[]) => unknown>,
				) => unknown;
			},
		];
		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		const whereFunction = callArgs[0].where;

		const mockFields: Record<string, unknown> = { id: "mockField" };
		const mockOperators = createMockOperators();

		whereFunction(mockFields, mockOperators);

		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "123");
	});

	it("should query membershipsWhereOrganization with currentUserId as memberId", async () => {
		setupAuthorizedMocks();

		await updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext);

		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();

		const callArgs = mocks.drizzleClient.query.fundCampaignsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				with: {
					fund: {
						with: {
							organization: {
								with: {
									membershipsWhereOrganization: {
										where: (
											fields: Record<string, unknown>,
											operators: Record<
												string,
												(...args: unknown[]) => unknown
											>,
										) => unknown;
									};
								};
							};
						};
					};
				};
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		expect(callArgs[0].with).toBeDefined();
		expect(callArgs[0].with.fund).toBeDefined();
		expect(callArgs[0].with.fund.with).toBeDefined();
		expect(callArgs[0].with.fund.with.organization).toBeDefined();
		expect(callArgs[0].with.fund.with.organization.with).toBeDefined();
		expect(
			callArgs[0].with.fund.with.organization.with.membershipsWhereOrganization,
		).toBeDefined();

		const whereFunction =
			callArgs[0].with.fund.with.organization.with.membershipsWhereOrganization
				.where;

		const mockFields: Record<string, unknown> = { memberId: "mockField" };
		const mockOperators = createMockOperators();

		whereFunction(mockFields, mockOperators);

		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "123");
	});

	it("should select role column as true in membershipsWhereOrganization", async () => {
		setupAuthorizedMocks();

		await updatedAtResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext);

		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();

		//Get the call arguments and verify role column is selected
		const callArgs = mocks.drizzleClient.query.fundCampaignsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				with: {
					fund: {
						with: {
							organization: {
								with: {
									membershipsWhereOrganization: {
										columns: {
											role: boolean;
										};
									};
								};
							};
						};
					};
				};
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		expect(callArgs[0].with).toBeDefined();
		expect(callArgs[0].with.fund).toBeDefined();
		expect(callArgs[0].with.fund.with).toBeDefined();
		expect(callArgs[0].with.fund.with.organization).toBeDefined();
		expect(callArgs[0].with.fund.with.organization.with).toBeDefined();
		expect(
			callArgs[0].with.fund.with.organization.with.membershipsWhereOrganization,
		).toBeDefined();
		expect(
			callArgs[0].with.fund.with.organization.with.membershipsWhereOrganization
				.columns,
		).toBeDefined();

		// Verify that role column is set to true
		expect(
			callArgs[0].with.fund.with.organization.with.membershipsWhereOrganization
				.columns.role,
		).toBe(true);
	});
});
