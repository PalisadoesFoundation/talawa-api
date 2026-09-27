import { faker } from "@faker-js/faker";
import type { GraphQLFieldResolver, GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { User as UserType } from "~/src/graphql/types/User/User";

// Extract the homePhoneNumber resolver from the built GraphQL schema
const userType = schema.getType("User") as GraphQLObjectType;
const homePhoneNumberResolver = userType.getFields().homePhoneNumber
	?.resolve as GraphQLFieldResolver<UserType, GraphQLContext>;

describe("User field homePhoneNumber resolver", () => {
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
			homePhoneNumber: "+15551234567",
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
			homePhoneNumberResolver(parent, {}, unauthCtx, {} as never),
		).rejects.toThrow(
			expect.objectContaining({
				message: expect.any(String),
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).not.toHaveBeenCalled();
	});

	it("throws unauthenticated error when authenticated user does not exist in database", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(
			homePhoneNumberResolver(parent, {}, ctx, {} as never),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
	});

	it("throws unauthorized_action when non-admin accesses another user's homePhoneNumber", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
		} as UserType;

		await expect(
			homePhoneNumberResolver(anotherUser, {}, ctx, {} as never),
		).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
	});

	it("returns homePhoneNumber when user accesses their own data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await homePhoneNumberResolver(parent, {}, ctx, {} as never);

		expect(result).toBe("+15551234567");
	});

	it("returns null when user accesses their own data and homePhoneNumber is not set", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const parentWithoutHomePhoneNumber = {
			...parent,
			homePhoneNumber: null,
		} as unknown as UserType;

		const result = await homePhoneNumberResolver(
			parentWithoutHomePhoneNumber,
			{},
			ctx,
			{} as never,
		);

		expect(result).toBeNull();
	});

	it("returns homePhoneNumber when administrator accesses another user's data", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
			homePhoneNumber: "+15557654321",
		} as UserType;

		const result = await homePhoneNumberResolver(anotherUser, {}, ctx, {} as never);

		expect(result).toBe("+15557654321");
	});

	it("passes correct query configuration including where clause to findFirst", async () => {
		const mockEq = vi.fn().mockReturnValue("eq-result");

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});

		const result = await homePhoneNumberResolver(parent, {}, ctx, {} as never);

		expect(result).toBe("+15551234567");
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();

		// Retrieve the config that was passed to findFirst (cast needed because the mock type has no params)
		const config = (
			mocks.drizzleClient.query.usersTable.findFirst.mock
				.calls as unknown as Record<string, unknown>[][]
		)[0]?.[0];

		expect(config?.columns).toEqual({ role: true });

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
});
