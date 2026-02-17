import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { addressLine2Resolver } from "~/src/graphql/types/User/addressLine2";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";

describe("User field addressLine2 resolver (unit)", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let currentUserId: string;
	let parent: UserType;

	beforeEach(() => {
		currentUserId = faker.string.ulid();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			currentUserId,
		);
		ctx = context;
		mocks = newMocks;

		parent = {
			id: currentUserId,
			name: "Test User",
			emailAddress: "test@example.com",
			isEmailAddressVerified: true,
			role: "regular",
			addressLine2: "Apt 42",
			creatorId: null,
			createdAt: new Date("2025-01-01T10:00:00Z"),
			updatedAt: null,
			updaterId: null,
		} as UserType; // partial UserType for testing
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		const { context: unauthCtx } = createMockGraphQLContext(false);

		await expect(addressLine2Resolver(parent, {}, unauthCtx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws unauthenticated error when authenticated user does not exist in database", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(addressLine2Resolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws unauthorized_action when non-admin accesses another user's addressLine2", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
		} as UserType; // partial UserType for testing

		await expect(addressLine2Resolver(anotherUser, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthorized_action" }),
			}),
		);
	});

	it("returns escaped addressLine2 when user accesses own data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await addressLine2Resolver(parent, {}, ctx);

		expect(result).toBe("Apt 42");
	});

	it("returns null when addressLine2 is null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const parentWithNull = {
			...parent,
			addressLine2: null,
		} as UserType; // partial UserType for testing

		const result = await addressLine2Resolver(parentWithNull, {}, ctx);

		expect(result).toBeNull();
	});

	it("returns null when addressLine2 is undefined", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const parentWithUndefined = {
			...parent,
			addressLine2: undefined,
		} as UserType; // partial UserType for testing

		const result = await addressLine2Resolver(parentWithUndefined, {}, ctx);

		expect(result).toBeNull();
	});

	it("returns escaped addressLine2 when admin accesses another user's data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
			addressLine2: "Suite <b>100</b>",
		} as UserType; // partial UserType for testing

		const result = await addressLine2Resolver(anotherUser, {}, ctx);

		expect(result).toBe("Suite &lt;b&gt;100&lt;/b&gt;");
	});

	it("escapes HTML characters in addressLine2 to prevent XSS", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const parentWithHtml = {
			...parent,
			addressLine2: "<script>alert('xss')</script>",
		} as UserType; // partial UserType for testing

		const result = await addressLine2Resolver(parentWithHtml, {}, ctx);

		expect(result).not.toContain("<script>");
		expect(result).toContain("&lt;script&gt;");
	});

	it("rethrows TalawaGraphQLError without logging", async () => {
		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(addressLine2Resolver(parent, {}, ctx)).rejects.toBe(
			talawaError,
		);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("logs and wraps unknown errors as unexpected", async () => {
		const unknownError = new Error("DB crash");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			unknownError,
		);

		await expect(addressLine2Resolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(unknownError);
	});
});
