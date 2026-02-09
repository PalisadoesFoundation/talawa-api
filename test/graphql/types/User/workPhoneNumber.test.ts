import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { workPhoneNumberResolver } from "~/src/graphql/types/User/workPhoneNumber";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import "~/src/graphql/types/User/workPhoneNumber";
import { faker } from "@faker-js/faker";

describe("User field workPhoneNumber resolver", () => {
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
			workPhoneNumber: "123-456-7890",
			role: "regular",
			createdAt: new Date("2025-01-01T10:00:00Z"),
			updatedAt: null,
			creatorId: "creator-1",
			updaterId: null,
		} as UserType;
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		const { context: unauthCtx } = createMockGraphQLContext(false);

		await expect(
			workPhoneNumberResolver(parent, {}, unauthCtx),
		).rejects.toThrow(
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

		await expect(workPhoneNumberResolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("throws unauthorized_action when non-admin accesses another user's work phone number", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const anotherUser = {
			...parent,
			id: "user-999",
		} as UserType;

		await expect(workPhoneNumberResolver(anotherUser, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	it("returns work phone number when user accesses their own data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await workPhoneNumberResolver(parent, {}, ctx);

		expect(result).toBe("123-456-7890");
	});

	it("returns work phone number when administrator accesses another user's data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const anotherUser = {
			...parent,
			id: "user-999",
			workPhoneNumber: "987-654-3210",
		} as UserType;

		const result = await workPhoneNumberResolver(anotherUser, {}, ctx);

		expect(result).toBe("987-654-3210");
	});

	it("rethrows TalawaGraphQLError from database layer without logging", async () => {
		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(workPhoneNumberResolver(parent, {}, ctx)).rejects.toBe(
			talawaError,
		);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("wraps unknown database errors as unexpected", async () => {
		const dbError = new Error("DB crashed");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

		await expect(workPhoneNumberResolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
				}),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(dbError);
	});
});
