import { faker } from "@faker-js/faker";
import type { GraphQLFieldResolver, GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Extract the birthDate resolver from the built GraphQL schema
const userType = schema.getType("User") as GraphQLObjectType;
const birthDateResolver = userType.getFields().birthDate
	?.resolve as GraphQLFieldResolver<UserType, GraphQLContext>;

describe("User field birthDate resolver", () => {
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
			birthDate: new Date("2000-01-15T00:00:00Z"),
			role: "regular",
			createdAt: new Date("2025-01-01T10:00:00Z"),
			updatedAt: null,
			creatorId: "creator-1",
			updaterId: null,
		} as UserType;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("throws unauthenticated error when client is not authenticated", async () => {
		const { context: unauthCtx } = createMockGraphQLContext(false);

		await expect(
			birthDateResolver(parent, {}, unauthCtx, {} as never),
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

		await expect(
			birthDateResolver(parent, {}, ctx, {} as never),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("throws unauthorized_action when non-admin accesses another user's birthDate", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
		} as UserType;

		await expect(
			birthDateResolver(anotherUser, {}, ctx, {} as never),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	it("returns birthDate when user accesses their own data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await birthDateResolver(parent, {}, ctx, {} as never);

		expect(result).toEqual(new Date("2000-01-15"));
	});

	it("returns null when user accesses their own data and birthDate is not set", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const parentWithoutBirthDate = {
			...parent,
			birthDate: null,
		} as unknown as UserType;

		const result = await birthDateResolver(
			parentWithoutBirthDate,
			{},
			ctx,
			{} as never,
		);

		expect(result).toBeNull();
	});

	it("returns birthDate when administrator accesses another user's data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
			birthDate: new Date("2000-01-15T00:00:00Z"),
		} as UserType;

		const result = await birthDateResolver(anotherUser, {}, ctx, {} as never);

		expect(result).toEqual(new Date("2000-01-15T00:00:00Z"));
	});

	it("returns null when administrator accesses another user's data and birthDate is not set", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
			birthDate: null,
		} as unknown as UserType;

		const result = await birthDateResolver(anotherUser, {}, ctx, {} as never);

		expect(result).toBeNull();
	});

	it("returns birthDate when administrator accesses their own data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const result = await birthDateResolver(parent, {}, ctx, {} as never);

		expect(result).toEqual(new Date("2000-01-15"));
	});

	it("returns null when administrator accesses their own data and birthDate is not set", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const parentWithoutBirthDate = {
			...parent,
			birthDate: null,
		} as unknown as UserType;

		const result = await birthDateResolver(
			parentWithoutBirthDate,
			{},
			ctx,
			{} as never,
		);

		expect(result).toBeNull();
	});

	it("passes correct query configuration including where clause to findFirst", async () => {
		const mockEq = vi.fn().mockReturnValue("eq-result");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await birthDateResolver(parent, {}, ctx, {} as never);

		expect(result).toEqual(new Date("2000-01-15T00:00:00Z"));
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();

		// Retrieve the config that was passed to findFirst (cast needed because the mock type has no params)
		const config = (
			mocks.drizzleClient.query.usersTable.findFirst.mock
				.calls as unknown as Record<string, unknown>[][]
		)[0]?.[0];

		// Verify columns config
		expect(config?.columns).toEqual({ role: true });

		// Exercise the where callback to cover the arrow function
		expect(config?.where).toBeTypeOf("function");
		const whereFn = config?.where as (
			fields: Record<string, unknown>,
			operators: Record<string, unknown>,
		) => unknown;
		const whereResult = whereFn({ id: "mock-field-id" }, { eq: mockEq });
		expect(whereResult).toBe("eq-result");

		// Verify the where callback called eq with the correct field and the current user's ID
		expect(mockEq).toHaveBeenCalledWith(
			"mock-field-id",
			ctx.currentClient.isAuthenticated ? ctx.currentClient.user.id : undefined,
		);
	});

	it("rethrows TalawaGraphQLError from database layer without logging", async () => {
		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(birthDateResolver(parent, {}, ctx, {} as never)).rejects.toBe(
			talawaError,
		);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("propagates unknown database errors as-is", async () => {
		const unknownError = new Error("DB crash");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			unknownError,
		);

		await expect(
			birthDateResolver(parent, {}, ctx, {} as never),
		).rejects.toThrow(unknownError);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});
});
