import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Fund } from "~/src/graphql/types/Fund/Fund";
import { resolveUpdatedAt } from "~/src/graphql/types/Fund/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../../../src/graphql/context";

const mockFund: Fund = {
	createdAt: new Date(),
	name: "Student Fund",
	id: "fund-111",
	creatorId: "000",
	updatedAt: new Date(),
	updaterId: "id-222",
	organizationId: "org-01",
	isTaxDeductible: false,
	isDefault: false,
	isArchived: false,
	referenceNumber: null,
};

describe("Fund Resolver - UpdatedAt Field", () => {
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

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error when user is undefined", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthorized_action when user has no organization memberships", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
			organizationMembershipsWhereMember: [],
		});

		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("should return updatedAt if user is an admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});
		const result = await resolveUpdatedAt(mockFund, {}, ctx);
		expect(result).toEqual(mockFund.updatedAt);
	});

	it("should return updatedAt if user is an organization member", async () => {
		const eqSpy = vi.fn((field: string, value: string) => field === value);
		(
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(async (...funcArgs: unknown[]) => {
			const options = funcArgs[0] as {
				with?: {
					organizationMembershipsWhereMember?: {
						where?: (fields: unknown, operators: unknown) => boolean;
					};
				};
			};

			const whereClause =
				options.with?.organizationMembershipsWhereMember?.where;

			if (whereClause) {
				const mockFields = { organizationId: mockFund.organizationId };
				const mockOperators = {
					eq: eqSpy,
				};
				const result = whereClause(mockFields, mockOperators);
				expect(eqSpy).toHaveBeenCalledWith(
					mockFund.organizationId,
					mockFund.organizationId,
				);
				expect(result).toBe(true);
			}

			return {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "member" }],
			};
		});
		const result = await resolveUpdatedAt(mockFund, {}, ctx);
		expect(result).toEqual(mockFund.updatedAt);
	});

	it("should handle database connection error", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("ECONNREFUSED"),
		);
		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database timeout error", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("Query timeout"),
		);
		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database constraint violation", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("violates foreign key constraint"),
		);
		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database query syntax error", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("syntax error in SQL statement"),
		);
		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
		);
		expect(ctx.log.error).toHaveBeenCalled();
	});

	it("should handle database error during concurrent access", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValueOnce(
			new Error("Database lock timeout"),
		);

		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
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
		await expect(resolveUpdatedAt(mockFund, {}, ctx)).rejects.toThrow(
			originalError,
		);
		expect(ctx.log.error).not.toHaveBeenCalled();
	});
});
