import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Fund } from "~/src/graphql/types/Fund/Fund";
import { resolveUpdater } from "~/src/graphql/types/Fund/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../../../src/graphql/context";

describe("Fund Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockFund: Fund;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(true, "123");
		ctx = context;
		mocks = newMocks;
		mockFund = {
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

		vi.clearAllMocks();
	});

	it("should throw unauthenticated error when user is not authenticated", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			resolveUpdater(mockFund, {}, ctx as GraphQLContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("should throw unauthenticated error when user is undefined", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdater(mockFund, {}, ctx as GraphQLContext),
		).rejects.toThrow(TalawaGraphQLError);
	});

	it("should throw unauthorized_action when user is not an administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user123",
			role: "member",
		});

		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			fund: {
				organization: { membershipsWhereOrganization: [{ role: "member" }] },
			},
		});

		await expect(
			resolveUpdater(mockFund, {}, ctx as GraphQLContext),
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
			fund: {
				organization: { membershipsWhereOrganization: undefined },
			},
		});

		await expect(
			resolveUpdater(mockFund, {}, ctx as GraphQLContext),
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
			organizationMembershipsWhereMember: [
				{
					role: "member",
				},
			],
		});

		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			fund: {
				organization: { membershipsWhereOrganization: [{ role: "member" }] },
			},
		});

		await expect(
			resolveUpdater(mockFund, {}, ctx as GraphQLContext),
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
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(
			{ ...mockFund, updaterId: null },
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

		await expect(
			resolveUpdater({ ...mockFund, updaterId: "user123" }, {}, ctx),
		).resolves.toEqual({ id: "user123", role: "administrator" });
	});

	it("throws unexpected error if updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce(undefined);
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		await expect(
			resolveUpdater(mockFund, {}, ctx as GraphQLContext),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);
		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a fund's updater id that isn't null.",
		);
	});

	it("returns the existing user if updaterId is set and user exists", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: "user123", role: "administrator" })
			.mockResolvedValueOnce({ id: "user456", role: "member" });
		mocks.drizzleClient.query.fundsTable.findFirst.mockResolvedValue({
			fund: {
				organization: {
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			},
		});

		const result = await resolveUpdater(mockFund, {}, ctx as GraphQLContext);
		expect(result).toEqual({ id: "user456", role: "member" });
	});
});
