import { vi } from "vitest";
import { beforeEach, describe, expect, it } from "vitest";
import type { CurrentClient, GraphQLContext } from "~/src/graphql/context";
import type { FundCampaign } from "~/src/graphql/types/FundCampaign/FundCampaign";
import { updatedAtResolver } from "~/src/graphql/types/FundCampaign/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mockFundCampaign: FundCampaign = {
	id: "fund-123",
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

const createMockContext = () => {
	const mockContext = {
		currentClient: {
			isAuthenticated: true,
			user: { id: "user-123" },
		} as CurrentClient,
		drizzleClient: {
			query: {
				usersTable: { findFirst: vi.fn() },
				fundsTable: { findFirst: vi.fn() },
			},
		},
		log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		envConfig: { API_BASE_URL: "mock url" },
		jwt: { sign: vi.fn() },
		minio: { presignedUrl: vi.fn(), putObject: vi.fn(), getObject: vi.fn() },
	};
	return mockContext as unknown as GraphQLContext;
};

describe("updatedAtResolver", () => {
	let ctx: GraphQLContext;

	beforeEach(() => {
		ctx = createMockContext();
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user does not exist", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unexpected error if fund does not exist", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue({ role: "member" });
		(
			ctx.drizzleClient.query.fundsTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
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
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockUser);
		(
			ctx.drizzleClient.query.fundsTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockFund);
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return updatedAt if user is an admin", async () => {
		const mockUser = { role: "administrator" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockUser);
		(
			ctx.drizzleClient.query.fundsTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockFund);
		const result = await updatedAtResolver(mockFundCampaign, {}, ctx);
		expect(result).toEqual(mockFundCampaign.updatedAt);
	});

	it("should return updatedAt if user is an organization admin", async () => {
		const mockUser = { role: "member" };
		const mockFund = {
			isTaxDeductible: true,
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		};
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockUser);
		(
			ctx.drizzleClient.query.fundsTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockFund);
		const result = await updatedAtResolver(mockFundCampaign, {}, ctx);
		expect(result).toEqual(mockFundCampaign.updatedAt);
	});

	it("should handle database connection error", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValue(new Error("ECONNREFUSED"));
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database timeout error", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValue(new Error("Query timeout"));
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database constraint violation", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValue(new Error("violates foreign key constraint"));
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database query syntax error", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValue(new Error("syntax error in SQL statement"));
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle concurrent updates to the same fund", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValueOnce(new Error("Database lock timeout"));

		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database error during concurrent access", async () => {
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValueOnce(
			new Error("Database error during concurrent access"),
		);

		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should pass through TalawaGraphQLError without wrapping", async () => {
		const originalError = new TalawaGraphQLError({
			message: "Custom error",
			extensions: { code: "unexpected" },
		});
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockRejectedValue(originalError);
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
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
		(
			ctx.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockUser);
		(
			ctx.drizzleClient.query.fundsTable.findFirst as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockFund);
		await expect(updatedAtResolver(mockFundCampaign, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});
});
