import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { isEmailAddressVerifiedResolver } from "~/src/graphql/types/User/isEmailAddressVerified";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("isEmailAddressVerifiedResolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let mockParentUser: UserType;
	let authenticatedUserId: string;

	beforeEach(() => {
		authenticatedUserId = faker.string.uuid();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			authenticatedUserId,
		);
		ctx = context;
		mocks = newMocks;
		mockParentUser = {
			id: faker.string.uuid(),
			isEmailAddressVerified: faker.datatype.boolean(),
		} as UserType;
	});

	describe("Authentication check", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				isEmailAddressVerifiedResolver(mockParentUser, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error when current user does not exist in database", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				isEmailAddressVerifiedResolver(mockParentUser, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Authorization checks", () => {
		it("should throw unauthorized_action when regular user queries another user's isEmailAddressVerified", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			await expect(
				isEmailAddressVerifiedResolver(mockParentUser, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should return value when administrator queries any user's isEmailAddressVerified", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			const result = await isEmailAddressVerifiedResolver(
				mockParentUser,
				{},
				ctx,
			);
			expect(result).toBe(mockParentUser.isEmailAddressVerified);
		});

		it("should return value when user queries their own isEmailAddressVerified", async () => {
			const parentAsSelf = {
				...mockParentUser,
				id: authenticatedUserId,
				isEmailAddressVerified: true,
			} as UserType;
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const result = await isEmailAddressVerifiedResolver(
				parentAsSelf,
				{},
				ctx,
			);
			expect(result).toBe(true);
		});
	});

	describe("Successful data retrieval", () => {
		it("should return true when isEmailAddressVerified is true", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			const parentVerified = {
				...mockParentUser,
				isEmailAddressVerified: true,
			} as UserType;

			const result = await isEmailAddressVerifiedResolver(
				parentVerified,
				{},
				ctx,
			);
			expect(result).toBe(true);
		});

		it("should return false when isEmailAddressVerified is false", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			const parentUnverified = {
				...mockParentUser,
				isEmailAddressVerified: false,
			} as UserType;

			const result = await isEmailAddressVerifiedResolver(
				parentUnverified,
				{},
				ctx,
			);
			expect(result).toBe(false);
		});
	});

	describe("Concurrent test safety", () => {
		it("should use unique parent and context per test without shared state", async () => {
			const parentId = faker.string.uuid();
			const currentUserId = faker.string.uuid();
			const { context, mocks: testMocks } = createMockGraphQLContext(
				true,
				currentUserId,
			);
			testMocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			const parent = {
				id: parentId,
				isEmailAddressVerified: true,
			} as UserType;

			const result = await isEmailAddressVerifiedResolver(parent, {}, context);
			expect(result).toBe(true);
		});
	});
});
