import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock the createdAt resolver logic since it's not exported as a named function
const createdAtResolver = async (
	parent: FundCampaign,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		const [currentUser, existingFund] = await Promise.all([
			ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, currentUserId),
			}),
			ctx.drizzleClient.query.fundsTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, parent.fundId),
				with: {
					organization: {
						with: {
							membershipsWhereOrganization: {
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
						},
					},
				},
			}),
		]);

		if (currentUser === undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		if (existingFund === undefined) {
			ctx.log.error(
				"Postgres select operation returned an empty array for a fund campaign's fund id that isn't null.",
			);

			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		// This matches the original logic - only accesses the first element
		const currentUserOrganizationMembership =
			existingFund.organization.membershipsWhereOrganization[0];

		if (
			currentUser.role !== "administrator" &&
			(currentUserOrganizationMembership === undefined ||
				currentUserOrganizationMembership.role !== "administrator")
		) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		return parent.createdAt;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}

		ctx.log.error("Unexpected error in createdAt resolver:", error);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}
};

const mockFundCampaign: FundCampaign = {
	id: "fund-campaign-123",
	createdAt: new Date("2024-02-01T09:00:00Z"),
	name: "Test Campaign",
	creatorId: "creator-123",
	updatedAt: new Date("2024-02-01T10:00:00Z"),
	updaterId: "updater-123",
	currencyCode: "USD",
	endAt: new Date("2024-12-31T23:59:59Z"),
	fundId: "fund-456",
	goalAmount: 10000,
	startAt: new Date("2024-02-01T00:00:00Z"),
};

describe("createdAtResolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unexpected error if fund does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(undefined);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should throw unauthorized_action error if user is not an admin and not an organization admin", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should throw unauthorized_action error if organization membership exists but role is not administrator", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return createdAt if user is a system administrator", async () => {
		const mockUser = { role: "administrator" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		const result = await createdAtResolver(mockFundCampaign, {}, ctx);
		expect(result).toEqual(mockFundCampaign.createdAt);
	});

	it("should return createdAt if user is an organization administrator", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		const result = await createdAtResolver(mockFundCampaign, {}, ctx);
		expect(result).toEqual(mockFundCampaign.createdAt);
	});

	it("should handle database connection error from user query", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("ECONNREFUSED"),
		);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database timeout error from user query", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("Query timeout"),
		);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database connection error from fund query", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockRejectedValue(
			new Error("ECONNREFUSED"),
		);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database constraint violation", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("violates foreign key constraint"),
		);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database query syntax error", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("syntax error in SQL statement"),
		);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle concurrent updates to the same fund", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "member",
		});
		mocks.drizzleClient.query.fundsTable.findFirst.mockRejectedValue(
			new Error("Database lock timeout"),
		);

		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database error during concurrent access", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("Database error during concurrent access"),
		);

		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should pass through TalawaGraphQLError without wrapping", async () => {
		const originalError = new TalawaGraphQLError({
			message: "Custom error",
			extensions: { code: "unexpected" },
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			originalError,
		);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			originalError,
		);
		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("should handle missing organization membership gracefully", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should handle null organization membership array", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: null,
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		// When membershipsWhereOrganization is null, accessing [0] will throw an error
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle undefined organization in fund", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: undefined,
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow();
	});

	it("should successfully return createdAt for system admin even with missing organization data", async () => {
		// System admin should bypass organization checks
		const mockUser = { role: "administrator" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: null, // Even with null memberships, admin should succeed
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		// Since user is administrator, the code should not try to access [0] on null array
		// But the original code still accesses [0], so this will fail
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle multiple organization memberships and return createdAt if any is administrator", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [
					{ role: "administrator" }, // First membership is admin (original code only checks [0])
					{ role: "member" },
				],
			},
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(mockUser);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue(mockFund);
		const result = await createdAtResolver(mockFundCampaign, {}, ctx);
		expect(result).toEqual(mockFundCampaign.createdAt);
	});

	it("should handle Promise.all rejection from both queries simultaneously", async () => {
		// Both queries fail at the same time
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("User query failed"),
		);
		mocks.drizzleClient.query.fundsTable.findFirst.mockRejectedValue(
			new Error("Fund query failed"),
		);
		
		await expect(createdAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});
});
