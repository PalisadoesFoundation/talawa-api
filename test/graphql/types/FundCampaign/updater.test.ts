import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { updaterResolver } from "~/src/graphql/types/FundCampaign/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("FundCampaign Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockFundCampaign: FundCampaign;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	// Helper function to setup common authorized user and fund mocks
	const setupAuthorizedMocks = () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "administrator",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		});
	};

	// Helper function to create mock operators for testing where clauses
	const createMockOperators = () => {
		return {
			eq: vi.fn((field: unknown, value: unknown) => ({ field, value })),
		} as Record<string, (...args: unknown[]) => unknown>;
	};

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
			amountRaised: 0,
		};

		vi.clearAllMocks();
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
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
			updaterResolver(mockFundCampaign, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});

	it("should throw unauthorized_action when user has no organization memberships", async () => {
		setupAuthorizedMocks();

		// Override to make user a member and remove organization memberships
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
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
		setupAuthorizedMocks();

		// Override to make user a member with non-admin organization role
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
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
		setupAuthorizedMocks();

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

		setupAuthorizedMocks();

		await expect(
			updaterResolver({ ...mockFundCampaign, updaterId: "user123" }, {}, ctx),
		).resolves.toEqual({ id: "user123", role: "administrator" });
	});

	it("throws unexpected error if updater user does not exist", async () => {
		setupAuthorizedMocks();

		// Override to return undefined for the second call (updater user)
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce(undefined);

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
		setupAuthorizedMocks();

		// Override to return different users for current user and updater user
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce({ id: "user456", role: "member" });

		const result = await updaterResolver(
			mockFundCampaign,
			{},
			ctx as GraphQLContext,
		);
		expect(result).toEqual({ id: "user456", role: "member" });
	});

	it("should throw unexpected error when fund does not exist", async () => {
		setupAuthorizedMocks();

		// Override to return undefined for fund
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
		setupAuthorizedMocks();

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
		const mockOperators = createMockOperators();

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

	it("should query usersTable with currentUserId", async () => {
		setupAuthorizedMocks();

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// Verify that usersTable.findFirst was called
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();

		// Get the where function that was passed
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

		// Create mock fields and operators to test the where function
		const mockFields: Record<string, unknown> = { id: "mockField" };
		const mockOperators = createMockOperators();

		// Call the where function to see what it does
		whereFunction(mockFields, mockOperators);

		// Verify it was called with currentUserId (which is "123" from createMockGraphQLContext)
		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "123");
	});

	it("should query membershipsWhereOrganization with currentUserId as memberId", async () => {
		setupAuthorizedMocks();

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// Verify that fundsTable.findFirst was called with the correct structure
		expect(mocks.drizzleClient.query.fundsTable.findFirst).toHaveBeenCalled();

		// Get the call arguments
		const callArgs = mocks.drizzleClient.query.fundsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				with: {
					organization: {
						with: {
							membershipsWhereOrganization: {
								where: (
									fields: Record<string, unknown>,
									operators: Record<string, (...args: unknown[]) => unknown>,
								) => unknown;
							};
						};
					};
				};
			},
		];
		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		expect(callArgs[0].with).toBeDefined();
		expect(callArgs[0].with.organization).toBeDefined();
		expect(callArgs[0].with.organization.with).toBeDefined();
		expect(
			callArgs[0].with.organization.with.membershipsWhereOrganization,
		).toBeDefined();
		const whereFunction =
			callArgs[0].with.organization.with.membershipsWhereOrganization.where;

		// Create mock fields and operators to test the where function
		const mockFields: Record<string, unknown> = { memberId: "mockField" };
		const mockOperators = createMockOperators();

		// Call the where function to see what it does
		whereFunction(mockFields, mockOperators);

		// Verify it was called with currentUserId (which is "123" from createMockGraphQLContext)
		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "123");
	});

	it("should select role column in membershipsWhereOrganization", async () => {
		setupAuthorizedMocks();

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// Verify that fundsTable.findFirst was called with the correct structure
		expect(mocks.drizzleClient.query.fundsTable.findFirst).toHaveBeenCalled();

		// Get the call arguments and verify role column is selected
		const callArgs = mocks.drizzleClient.query.fundsTable.findFirst.mock
			.calls[0] as unknown as [
			{
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
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		expect(callArgs[0].with).toBeDefined();
		expect(callArgs[0].with.organization).toBeDefined();
		expect(callArgs[0].with.organization.with).toBeDefined();
		expect(
			callArgs[0].with.organization.with.membershipsWhereOrganization,
		).toBeDefined();
		expect(
			callArgs[0].with.organization.with.membershipsWhereOrganization.columns,
		).toBeDefined();

		// Verify that role column is set to true (included in the query)
		expect(
			callArgs[0].with.organization.with.membershipsWhereOrganization.columns
				.role,
		).toBe(true);
	});

	it("should select isTaxDeductible column as true in fundsTable query", async () => {
		setupAuthorizedMocks();

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// Verify that fundsTable.findFirst was called
		expect(mocks.drizzleClient.query.fundsTable.findFirst).toHaveBeenCalled();

		// Get the call arguments and verify isTaxDeductible column is set to true
		const callArgs = mocks.drizzleClient.query.fundsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				columns: {
					isTaxDeductible: boolean;
				};
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		expect(callArgs[0].columns).toBeDefined();

		// Verify that isTaxDeductible column is set to true (excluded from the query)
		expect(callArgs[0].columns.isTaxDeductible).toBe(true);
	});

	it("should select countryCode column in organization", async () => {
		setupAuthorizedMocks();

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// Verify that fundsTable.findFirst was called
		expect(mocks.drizzleClient.query.fundsTable.findFirst).toHaveBeenCalled();

		// Get the call arguments and verify countryCode column is selected
		const callArgs = mocks.drizzleClient.query.fundsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				with: {
					organization: {
						columns: {
							countryCode: boolean;
						};
					};
				};
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();
		expect(callArgs[0].with).toBeDefined();
		expect(callArgs[0].with.organization).toBeDefined();
		expect(callArgs[0].with.organization.columns).toBeDefined();

		// Verify that countryCode column is set to true (included in the query)
		expect(callArgs[0].with.organization.columns.countryCode).toBe(true);
	});

	it("should have correct nested with structure for organization and memberships", async () => {
		setupAuthorizedMocks();

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// Verify that fundsTable.findFirst was called
		expect(mocks.drizzleClient.query.fundsTable.findFirst).toHaveBeenCalled();

		// Get the call arguments and verify the complete nested structure
		const callArgs = mocks.drizzleClient.query.fundsTable.findFirst.mock
			.calls[0] as unknown as [
			{
				with: {
					organization: {
						columns: Record<string, boolean>;
						with: {
							membershipsWhereOrganization: {
								columns: Record<string, boolean>;
								where: (
									fields: Record<string, unknown>,
									operators: Record<string, (...args: unknown[]) => unknown>,
								) => unknown;
							};
						};
					};
				};
			},
		];

		expect(callArgs).toBeDefined();
		expect(callArgs[0]).toBeDefined();

		// Verify the with structure exists
		expect(callArgs[0].with).toBeDefined();
		expect(callArgs[0].with.organization).toBeDefined();

		// Verify organization has both columns and nested with
		expect(callArgs[0].with.organization.columns).toBeDefined();
		expect(callArgs[0].with.organization.with).toBeDefined();

		// Verify membershipsWhereOrganization has both columns and where clause
		expect(
			callArgs[0].with.organization.with.membershipsWhereOrganization,
		).toBeDefined();
		expect(
			callArgs[0].with.organization.with.membershipsWhereOrganization.columns,
		).toBeDefined();
		expect(
			callArgs[0].with.organization.with.membershipsWhereOrganization.where,
		).toBeDefined();
		expect(
			typeof callArgs[0].with.organization.with.membershipsWhereOrganization
				.where,
		).toBe("function");
	});

	it("should allow access when user is system administrator regardless of organization role", async () => {
		setupAuthorizedMocks();

		// Override to set non-admin organization role (but user is still system admin)
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		});

		const result = await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// System administrator should bypass organization role checks
		expect(result).toBeNull();
	});

	it("should allow access when user is system administrator with no organization membership", async () => {
		setupAuthorizedMocks();

		// Override to remove organization memberships (but user is still system admin)
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		});

		const result = await updaterResolver(
			{ ...mockFundCampaign, updaterId: null },
			{},
			ctx as GraphQLContext,
		);

		// System administrator should bypass organization membership requirement
		expect(result).toBeNull();
	});

	it("should query usersTable with updaterId when fetching updater user", async () => {
		setupAuthorizedMocks();

		// Override to return different users for current user and updater user
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce({ id: "updater-456", name: "Updater User" });

		await updaterResolver(
			{ ...mockFundCampaign, updaterId: "updater-456" },
			{},
			ctx as GraphQLContext,
		);

		// Verify that usersTable.findFirst was called twice (once for currentUser, once for updater)
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(2);

		// Get the second call (for the updater user)
		const secondCallArgs = mocks.drizzleClient.query.usersTable.findFirst.mock
			.calls[1] as unknown as [
			{
				where: (
					fields: Record<string, unknown>,
					operators: Record<string, (...args: unknown[]) => unknown>,
				) => unknown;
			},
		];

		expect(secondCallArgs).toBeDefined();
		expect(secondCallArgs[0]).toBeDefined();
		const whereFunction = secondCallArgs[0].where;

		// Create mock fields and operators to test the where function
		const mockFields: Record<string, unknown> = { id: "mockField" };
		const mockOperators = createMockOperators();

		// Call the where function to see what it does
		whereFunction(mockFields, mockOperators);

		// Verify it was called with updaterId (which is "updater-456")
		expect(mockOperators.eq).toHaveBeenCalledWith("mockField", "updater-456");

		// Verify it was NOT called with currentUserId
		expect(mockOperators.eq).not.toHaveBeenCalledWith("mockField", "123");
	});
});
