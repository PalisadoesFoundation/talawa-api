import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaignPledge } from "~/src/graphql/types/FundCampaignPledge/FundCampaignPledge";
import { pledgerResolver } from "~/src/graphql/types/FundCampaignPledge/pledger";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("FundCampaignPledge Resolver - pledger Field", () => {
	let ctx: GraphQLContext;
	let mockFundCampaignPledge: FundCampaignPledge;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

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
			pledgerResolver(mockFundCampaignPledge, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	it("should return the current user when pledgerId equals currentUserId", async () => {
		if (!ctx.currentClient.user) return;
		mockFundCampaignPledge.pledgerId = ctx.currentClient.user.id;
		const currentUser = { id: "123", role: "member" };
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);
		const result = await pledgerResolver(mockFundCampaignPledge, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should throw unauthenticated error when current user is not found", async () => {
		if (!ctx.currentClient.user) return;
		mockFundCampaignPledge.pledgerId = ctx.currentClient.user.id;
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);
		await expect(
			pledgerResolver(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	it("should throw unexpected error when fund campaign does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			pledgerResolver(mockFundCampaignPledge, {}, ctx),
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

	it("should throw unauthorized_action error when user has no organization memberships", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
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
			pledgerResolver(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("should return existing user when user is administrator without organization membership", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "123", role: "administrator" })
			.mockResolvedValueOnce({ id: "pledger123", role: "member" });
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [],
				},
			},
		});

		const result = await pledgerResolver(mockFundCampaignPledge, {}, ctx);
		expect(result).toEqual({ id: "pledger123", role: "member" });
	});

	it("should return existing user when membership exists even if not administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ role: "member" })
			.mockResolvedValueOnce({ id: "pledger123", role: "member" });
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "member" }],
				},
			},
		});

		const result = await pledgerResolver(mockFundCampaignPledge, {}, ctx);
		expect(result).toEqual({ id: "pledger123", role: "member" });
	});

	it("should throw unexpected error when pledger user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ role: "member" })
			.mockResolvedValueOnce(undefined);
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(
			pledgerResolver(mockFundCampaignPledge, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign pledge's pledger id that isn't null.",
		);
	});

	it("should query fundCampaignsTable with campaignId", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});
		await pledgerResolver(mockFundCampaignPledge, {}, ctx);

		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();

		const calls = (
			mocks.drizzleClient.query.fundCampaignsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mock.calls;
		const callArgs = calls[0]?.[0];
		const whereFunction = callArgs?.where;
		const mockFields: Record<string, unknown> = { id: "mockField" };
		const mockOperators = createMockOperators();

		whereFunction(mockFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(
			mockFields.id,
			mockFundCampaignPledge.campaignId,
		);
	});

	it("should query usersTable with currentUserId", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});
		await pledgerResolver(mockFundCampaignPledge, {}, ctx);

		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();

		const calls = (
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mock.calls;
		const callArgs = calls[0]?.[0];
		const whereFunction = callArgs?.where;

		const mockFields: Record<string, unknown> = { id: "mockField" };
		const mockOperators = createMockOperators();

		whereFunction(mockFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(
			mockFields.id,
			ctx.currentClient.user?.id,
		);
	});

	it("should query membershipsWhereOrganization with currentUserId as memberId", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});
		await pledgerResolver(mockFundCampaignPledge, {}, ctx);

		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();

		const calls = (
			mocks.drizzleClient.query.fundCampaignsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mock.calls;
		const callArgs = calls[0]?.[0];
		const whereFunction =
			callArgs?.with?.fund?.with?.organization?.with
				?.membershipsWhereOrganization?.where;

		const mockFields: Record<string, unknown> = { memberId: "mockField" };
		const mockOperators = createMockOperators();

		whereFunction(mockFields, mockOperators);
		if (!ctx.currentClient.user) return;
		expect(mockOperators.eq).toHaveBeenCalledWith(
			mockFields.memberId,
			ctx.currentClient.user.id,
		);
	});

	it("should select role column as true in membershipsWhereOrganization", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});
		await pledgerResolver(mockFundCampaignPledge, {}, ctx);

		expect(
			mocks.drizzleClient.query.fundCampaignsTable.findFirst,
		).toHaveBeenCalled();

		const calls = (
			mocks.drizzleClient.query.fundCampaignsTable.findFirst as ReturnType<
				typeof vi.fn
			>
		).mock.calls;
		const callArgs = calls[0]?.[0];
		const membershipsConfig =
			callArgs?.with?.fund?.with?.organization?.with
				?.membershipsWhereOrganization;

		expect(membershipsConfig).toBeDefined();
		expect(
			(membershipsConfig as { columns: { role: boolean } }).columns.role,
		).toBe(true);
	});

	it("should query usersTable with pledgerId", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ role: "member" })
			.mockResolvedValueOnce({ id: "pledger123", role: "member" });
		mocks.drizzleClient.query.fundCampaignsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await pledgerResolver(mockFundCampaignPledge, {}, ctx);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(2);

		const calls = (
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mock.calls;
		const callArgs = calls[1]?.[0];
		const whereFunction = callArgs?.where;
		const mockFields: Record<string, unknown> = { id: "idField" };
		const mockOperators = createMockOperators();

		whereFunction(mockFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(
			mockFields.id,
			mockFundCampaignPledge.pledgerId,
		);
	});
});
