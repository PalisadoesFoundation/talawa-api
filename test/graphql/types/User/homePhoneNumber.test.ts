import { faker } from "@faker-js/faker";
import type { GraphQLFieldResolver, GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { User as UserType } from "~/src/graphql/types/User/User";

const userType = schema.getType("User") as GraphQLObjectType;
const homePhoneNumberResolver = userType.getFields().homePhoneNumber
	?.resolve as GraphQLFieldResolver<UserType, GraphQLContext>;

describe("homePhoneNumberResolver", () => {
	const DEFAULT_PHONE = "1234567890";
	const ROLE_REGULAR = "regular";
	const ROLE_ADMIN = "administrator";

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const runResolver = (parent: UserType, context: GraphQLContext) =>
		homePhoneNumberResolver(parent, {}, context, {} as never);

	const createSetup = (
		isAuthenticated: boolean,
		targetPhone: string | null | undefined,
		isSelfAccess: boolean,
	) => {
		const currentUserId = faker.string.uuid();
		const targetUserId = isSelfAccess ? currentUserId : faker.string.uuid();
		const { context, mocks } = createMockGraphQLContext(
			isAuthenticated,
			currentUserId,
		);

		const parent = {
			id: targetUserId,
			homePhoneNumber: targetPhone,
		} as unknown as UserType;

		return { context, mocks, parent, currentUserId, targetUserId };
	};

	it("throws unauthenticated error when client is not authenticated", async () => {
		const { context, mocks, parent } = createSetup(false, DEFAULT_PHONE, false);

		await expect(runResolver(parent, context)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).not.toHaveBeenCalled();
	});

	it("throws unauthenticated error when current user cannot be found in database", async () => {
		const { context, mocks, parent } = createSetup(true, DEFAULT_PHONE, false);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(runResolver(parent, context)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthenticated",
				}),
			}),
		);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("throws unauthorized_action error when regular user accesses another user's data", async () => {
		const { context, mocks, parent } = createSetup(true, DEFAULT_PHONE, false);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: ROLE_REGULAR,
		});

		await expect(runResolver(parent, context)).rejects.toThrowError(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "unauthorized_action",
				}),
			}),
		);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("returns homePhoneNumber when user accesses their own data", async () => {
		const expectedPhone = faker.phone.number();
		const { context, mocks, parent } = createSetup(true, expectedPhone, true);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: ROLE_REGULAR,
		});

		const result = await runResolver(parent, context);
		expect(result).toBe(expectedPhone);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("returns homePhoneNumber when administrator accesses another user's data", async () => {
		const expectedPhone = faker.phone.number();
		const { context, mocks, parent } = createSetup(true, expectedPhone, false);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: ROLE_ADMIN,
		});

		const result = await runResolver(parent, context);
		expect(result).toBe(expectedPhone);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("returns null when homePhoneNumber is null", async () => {
		const { context, mocks, parent } = createSetup(true, null, true);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: ROLE_REGULAR,
		});

		const result = await runResolver(parent, context);
		expect(result).toBeNull();
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("returns empty string when homePhoneNumber is empty string", async () => {
		const { context, mocks, parent } = createSetup(true, "", true);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: ROLE_REGULAR,
		});

		const result = await runResolver(parent, context);
		expect(result).toBe("");
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});

	it("returns undefined when homePhoneNumber is undefined", async () => {
		const { context, mocks, parent } = createSetup(true, undefined, true);

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: ROLE_REGULAR,
		});

		const result = await runResolver(parent, context);
		expect(result).toBeUndefined();
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledOnce();
	});
});
