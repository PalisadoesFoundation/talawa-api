import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { updaterResolver } from "~/src/graphql/types/FundCampaign/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../../../src/graphql/context";

describe("FundCampaign Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockFundCampaign: FundCampaign;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(true, "123");
		ctx = context;
		mocks = newMocks;
		mockFundCampaign = {
			createdAt: new Date(),
			name: "Annual Fundraiser",
			id: "campaign-111",
			fundId: "fund-456",
			creatorId: "000",
			updatedAt: new Date(),
			updaterId: "id-222",
			currencyCode: "USD",
			goalAmount: 50000,
			startAt: new Date("2024-01-01T00:00:00Z"),
			endAt: new Date("2024-12-31T23:59:59Z"),
		};

		vi.clearAllMocks();
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("should throw unauthenticated error when user is undefined", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("should throw unauthorized_action when user is not an administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("should throw unauthorized_action when user has no organization memberships", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
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

		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("returns null if updaterId is null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);
		expect(result).toBeNull();
	});

	it("returns current user if they are the updater", async () => {
		Object.assign(ctx.currentClient, {
			user: { id: "user123" },
			isAuthenticated: true,
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(
			updaterResolver({ ...mockFundCampaign, updaterId: "user123" }, {}, ctx),
		).resolves.toEqual({ id: "user123", role: "administrator" });
	});

	it("throws unexpected error if updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce(undefined);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign's updater id that isn't null.",
		);
	});

	it("returns the existing user if updaterId is set and user exists", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce({ id: "user456", role: "member" });
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		const result = await updaterResolver(
			mockFundCampaign,
			{},
			ctx as GraphQLContext,
		);
		expect(result).toEqual({ id: "user456", role: "member" });
	});

	it("should throw unexpected error when fund does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});

		// Mock fund as undefined
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(undefined);

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund campaign's fund id that isn't null.",
		);
	});

	it("should query fundsTable with currentUserId", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: false,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// Verify that fundsTable.findFirst was called
		expect(mocks.drizzleClient.query.fundsTable.findFirst).toHaveBeenCalled();

		// Get the where function that was passed
		const callArgs = mocks.drizzleClient.query.fundsTable.findFirst.mock
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
		const mockOperators: Record<string, (...args: unknown[]) => unknown> = {
			eq: vi.fn((field: unknown, value: unknown) => ({ field, value })),
		};

		// Call the where function to see what it does
		whereFunction(mockFields, mockOperators);

		// Verify it was called with currentUserId (which is "123" from createMockGraphQLContext)
		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "123");

		// Verify it was NOT called with parent.fundId or any other value
		expect(mockOperators.eq).not.toHaveBeenCalledWith(
			"mockField",
			mockFundCampaign.fundId,
		);
	});
});
