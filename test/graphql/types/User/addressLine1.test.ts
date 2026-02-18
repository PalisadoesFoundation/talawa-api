import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { addressLine1Resolver } from "~/src/graphql/types/User/addressLine1";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("user field addressLine1 resolver", () => {
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let parent: UserType;
	let ctx: GraphQLContext;
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
			role: "regular",
			addressLine1: "123 Main St",
		} as UserType;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		const { context: unauthCtx } = createMockGraphQLContext(false);

		await expect(addressLine1Resolver(parent, {}, unauthCtx)).rejects.toThrow(
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

		await expect(addressLine1Resolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("throws unauthorized_action when non-admin accesses another user's addressLine1", async () => {
		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
		} as UserType;

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});
		await expect(addressLine1Resolver(anotherUser, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	it("returns addressLine1 when user accesses their own data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});
		const result = await addressLine1Resolver(parent, {}, ctx);
		expect(result).toBe("123 Main St");
	});

	it("returns null when addressLine1 is null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const userwithNull = {
			...parent,
			addressLine1: null,
		};

		const result = await addressLine1Resolver(userwithNull, {}, ctx);
		expect(result).toBeNull();
	});

	it("returns undefined when addressLine1 is undefined", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const userwithUndefined = {
			...parent,
			addressLine1: undefined,
		} as unknown as UserType;

		const result = await addressLine1Resolver(userwithUndefined, {}, ctx);
		expect(result).toBeUndefined();
	});

	it("returns empty string when addressLine1 is empty string", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const userwithEmptystring = {
			...parent,
			addressLine1: "",
		};

		const result = await addressLine1Resolver(userwithEmptystring, {}, ctx);
		expect(result).toBe("");
	});

	it("returns addressLine1 when admin accesses another user's data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
			addressLine1: "345 Main St",
		};

		const result = await addressLine1Resolver(anotherUser, {}, ctx);
		expect(result).toBe("345 Main St");
	});

	it("escapes HTML characters in addressLine1 to prevent XSS", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const UserWithHtml = {
			...parent,
			addressLine1: "<script>alert('xss')</script>",
		} as UserType;

		const result = await addressLine1Resolver(UserWithHtml, {}, ctx);

		expect(result).not.toContain("<script>");
		expect(result).toContain("&lt;script&gt;");
	});

	it("rethrows TalawaGraphQLError from database layer without logging", async () => {
		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(addressLine1Resolver(parent, {}, ctx)).rejects.toBe(
			talawaError,
		);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("logs and wraps unknown database errors", async () => {
		const unknownError = new Error("DB crash");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			unknownError,
		);

		await expect(addressLine1Resolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unexpected",
				}),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(unknownError);
	});
});
