import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { emailAddressResolver } from "~/src/graphql/types/User/emailAddress";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import "~/src/graphql/types/User/emailAddress";
import { faker } from "@faker-js/faker";

describe("User field emailAddress resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let parent: UserType;

	beforeEach(() => {
		const _userId = faker.string.ulid();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			_userId,
		);
		ctx = context;
		mocks = newMocks;

		parent = {
			id: _userId,
			name: "Test User",
			emailAddress: "test@example.com",
			role: "regular",
			createdAt: new Date("2025-01-01T10:00:00Z"),
			updatedAt: null,
			creatorId: "creator-1",
			updaterId: null,
		} as UserType;
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		const { context: unauthCtx } = createMockGraphQLContext(false);

		await expect(emailAddressResolver(parent, {}, unauthCtx)).rejects.toThrow(
			expect.objectContaining({
				message: expect.any(String),
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("throws unauthenticated error when authenticated user does not exist in database", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(emailAddressResolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("throws unauthorized_action when non-admin accesses another user's email", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const anotherUser = {
			...parent,
			id: "user-999",
		} as UserType;

		await expect(emailAddressResolver(anotherUser, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	it("returns email when user accesses their own email", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await emailAddressResolver(parent, {}, ctx);

		expect(result).toBe("test@example.com");
	});

	it("returns email when administrator accesses another user's email", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const anotherUser = {
			...parent,
			id: "user-999",
			emailAddress: "other@example.com",
		} as UserType;

		const result = await emailAddressResolver(anotherUser, {}, ctx);

		expect(result).toBe("other@example.com");
	});
	it("rethrows TalawaGraphQLError from database layer without logging", async () => {
		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(emailAddressResolver(parent, {}, ctx)).rejects.toBe(
			talawaError,
		);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("logs and wraps unknown database errors", async () => {
		const unknownError = new Error("DB crash");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			unknownError,
		);

		await expect(emailAddressResolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
				}),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(unknownError);
	});

	it("wraps unknown database errors as unexpected", async () => {
		const dbError = new Error("DB crashed");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

		await expect(emailAddressResolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
				}),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(dbError);
	});
});
