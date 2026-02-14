import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "../../../../src/graphql/context";
import { maritalStatusResolver } from "../../../../src/graphql/types/User/maritalStatus";
import type { User as UserType } from "../../../../src/graphql/types/User/User";
import { createMockGraphQLContext } from "../../../../test/_Mocks_/mockContextCreator/mockContextCreator";
import "../../../../src/graphql/types/User/maritalStatus";
import "../../../../src/graphql/schema";

describe("User field maritalStatus resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let parent: UserType;

	beforeEach(() => {
		const _userId = faker.string.uuid();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			_userId,
		);
		ctx = context;
		mocks = newMocks;

		parent = {
			id: _userId,
			name: "Test User",
			maritalStatus: null,
			role: "regular",
			createdAt: new Date("2025-01-01T10:00:00Z"),
			updatedAt: null,
			creatorId: "creator-1",
			updaterId: null,
		} as UserType;
	});

	describe("authentication checks", () => {
		it("throws unauthenticated error when client is not authenticated", async () => {
			const { context: unauthCtx } = createMockGraphQLContext(false);

			await expect(
				maritalStatusResolver(parent, {} as Record<string, never>, unauthCtx),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});

		it("throws unauthenticated error when authenticated user does not exist in database", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				maritalStatusResolver(parent, {} as Record<string, never>, ctx),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			);
		});
	});

	describe("authorization checks", () => {
		it("throws unauthorized_action when non-admin accesses another user's maritalStatus", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const anotherUser = {
				...parent,
				id: faker.string.uuid(),
			} as UserType;

			await expect(
				maritalStatusResolver(anotherUser, {} as Record<string, never>, ctx),
			).rejects.toThrow(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
				}),
			);
		});
	});

	describe("successful data retrieval", () => {
		it("returns null when maritalStatus is not set", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const result = await maritalStatusResolver(
				parent,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBeNull();
		});

		it("returns maritalStatus when user accesses their own data", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const userWithMaritalStatus = {
				...parent,
				maritalStatus: "married",
			} as UserType;

			const result = await maritalStatusResolver(
				userWithMaritalStatus,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("married");
		});

		it("returns maritalStatus when administrator accesses another user's data", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			const anotherUser = {
				...parent,
				id: faker.string.uuid(),
				maritalStatus: "single",
			} as UserType;

			const result = await maritalStatusResolver(
				anotherUser,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("single");
		});
	});

	describe("marital status enum values", () => {
		it("returns 'single' maritalStatus", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const userWithStatus = {
				...parent,
				maritalStatus: "single",
			} as UserType;

			const result = await maritalStatusResolver(
				userWithStatus,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("single");
		});

		it("returns 'married' maritalStatus", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const userWithStatus = {
				...parent,
				maritalStatus: "married",
			} as UserType;

			const result = await maritalStatusResolver(
				userWithStatus,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("married");
		});

		it("returns 'divorced' maritalStatus", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const userWithStatus = {
				...parent,
				maritalStatus: "divorced",
			} as UserType;

			const result = await maritalStatusResolver(
				userWithStatus,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("divorced");
		});

		it("returns 'engaged' maritalStatus", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const userWithStatus = {
				...parent,
				maritalStatus: "engaged",
			} as UserType;

			const result = await maritalStatusResolver(
				userWithStatus,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("engaged");
		});

		it("returns 'seperated' maritalStatus", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const userWithStatus = {
				...parent,
				maritalStatus: "seperated",
			} as UserType;

			const result = await maritalStatusResolver(
				userWithStatus,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("seperated");
		});

		it("returns 'widowed' maritalStatus", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const userWithStatus = {
				...parent,
				maritalStatus: "widowed",
			} as UserType;

			const result = await maritalStatusResolver(
				userWithStatus,
				{} as Record<string, never>,
				ctx,
			);

			expect(result).toBe("widowed");
		});
	});
});
