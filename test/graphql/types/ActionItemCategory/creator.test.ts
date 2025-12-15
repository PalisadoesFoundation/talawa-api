import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory as ActionItemCategoryType } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { resolveCreator } from "~/src/graphql/types/ActionItemCategory/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("ActionItemCategory Resolver - Creator Field", () => {
	let ctx: GraphQLContext;
	let mockActionItemCategory: ActionItemCategoryType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockActionItemCategory = {
			id: "category-123",
			organizationId: "org-123",
			creatorId: "user-456",
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
			resolveCreator(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		ctx.currentClient.isAuthenticated = true;
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			resolveCreator(mockActionItemCategory, {}, ctx),
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
			resolveCreator(mockActionItemCategory, {}, ctx),
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
			resolveCreator(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if creatorId is null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		});

		mockActionItemCategory.creatorId = null;

		const result = await resolveCreator(mockActionItemCategory, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if creatorId matches current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);
		mockActionItemCategory.creatorId = "user-123";

		const result = await resolveCreator(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(currentUser);
	});

	it("should throw unexpected error if creator user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			}) // First call: current user
			.mockResolvedValueOnce(undefined); // Second call: creator does not exist

		mockActionItemCategory.creatorId = "user-456";

		await expect(
			resolveCreator(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an action item category's creator id that isn't null.",
		);
	});

	it("should resolve successfully with global administrator", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "member" }],
		};

		const creatorUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser) // First call: current user
			.mockResolvedValueOnce(creatorUser); // Second call: creator user

		const result = await resolveCreator(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(creatorUser);
	});

	it("should resolve successfully with organization administrator", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		const creatorUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser) // First call: current user
			.mockResolvedValueOnce(creatorUser); // Second call: creator user

		const result = await resolveCreator(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(creatorUser);
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
		mockActionItemCategory.creatorId = "user-123";

		await resolveCreator(mockActionItemCategory, {}, ctx);

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
			resolveCreator(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should handle edge case where organization membership array is empty", async () => {
		const currentUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		await expect(
			resolveCreator(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should verify correct error message for missing creator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			}) // First call: current user
			.mockResolvedValueOnce(undefined); // Second call: creator does not exist

		mockActionItemCategory.creatorId = "non-existent-user";

		try {
			await resolveCreator(mockActionItemCategory, {}, ctx);
		} catch (error) {
			expect(ctx.log.error).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an action item category's creator id that isn't null.",
			);
			expect(error).toBeInstanceOf(TalawaGraphQLError);
			expect((error as TalawaGraphQLError).extensions.code).toBe("unexpected");
		}
	});

	it("should handle both global admin and org admin permissions correctly", async () => {
		// Test global admin with non-admin org role
		const globalAdminUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "member" }],
		};

		const creatorUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(globalAdminUser)
			.mockResolvedValueOnce(creatorUser);

		let result = await resolveCreator(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(creatorUser);

		// Reset mocks
		mocks.drizzleClient.query.usersTable.findFirst.mockClear();

		// Test org admin with non-admin global role
		const orgAdminUser = {
			id: "user-789",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};

		// Create new context with different authenticated user
		const { context: newCtx, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-789",
		);

		newMocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(orgAdminUser)
			.mockResolvedValueOnce(creatorUser);

		result = await resolveCreator(mockActionItemCategory, {}, newCtx);
		expect(result).toEqual(creatorUser);
	});
});
