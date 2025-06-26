import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory as ActionItemCategoryType } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { resolveUpdater } from "~/src/graphql/types/ActionItemCategory/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("ActionItemCategory Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockActionItemCategory: ActionItemCategoryType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockActionItemCategory = {
			id: "category-123",
			organizationId: "org-123",
			updaterId: "user-456",
			name: "Test Category",
			description: "Test Description",
			isDisabled: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as ActionItemCategoryType;

		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(
			resolveUpdater(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		ctx.currentClient.isAuthenticated = true;
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveUpdater(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthorized_action error if user is not an administrator and not an org admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "member" }],
		});

		await expect(
			resolveUpdater(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unauthorized_action error if user has no organization membership", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [],
		});

		await expect(
			resolveUpdater(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if updaterId is null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		mockActionItemCategory.updaterId = null;

		const result = await resolveUpdater(mockActionItemCategory, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if updaterId matches current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);
		mockActionItemCategory.updaterId = "user-123";

		const result = await resolveUpdater(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			}) // First call: current user
			.mockResolvedValueOnce(undefined); // Second call: updater does not exist

		mockActionItemCategory.updaterId = "user-456";

		await expect(
			resolveUpdater(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an action item category's updater id that isn't null.",
		);
	});

	it("should resolve successfully with global administrator", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "member" }],
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser) // First call: current user
			.mockResolvedValueOnce(updaterUser); // Second call: updater user

		const result = await resolveUpdater(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("should resolve successfully with organization administrator", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser) // First call: current user
			.mockResolvedValueOnce(updaterUser); // Second call: updater user

		const result = await resolveUpdater(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("should test database query with correct organization ID filter", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);
		mockActionItemCategory.updaterId = "user-123";

		await resolveUpdater(mockActionItemCategory, {}, ctx);

		// Verify that the query was called with the correct parameters
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			{
				with: {
					organizationMembershipsWhereMember: {
						columns: {
							role: true,
						},
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			},
		);
	});

	it("should handle edge case where organization membership is undefined", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: undefined,
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		await expect(
			resolveUpdater(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});
});
