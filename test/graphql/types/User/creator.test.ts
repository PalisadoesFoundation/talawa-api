import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	suite,
	test,
	vi,
} from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { creatorResolver } from "~/src/graphql/types/User/creator";
import type { User as UserType } from "~/src/graphql/types/User/User";
import {
	TalawaGraphQLError,
	type TalawaGraphQLFormattedError,
	type UnauthenticatedExtensions,
	type UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_creator,
} from "../documentNodes";

suite("User field creator", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.creator" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.user?.id,
				);

				const userCreatorResult = await mercuriusClient.query(
					Query_user_creator,
					{
						variables: {
							input: {
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(userCreatorResult.data.user?.creator).toEqual(null);
				expect(userCreatorResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "creator"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				assertToBeNonNullish(
					createUserResult.data.createUser.authenticationToken,
				);
				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn.user?.id,
				);

				const userCreatorResult = await mercuriusClient.query(
					Query_user_creator,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(userCreatorResult.data.user?.creator).toEqual(null);
				expect(userCreatorResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "creator"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.creator" field if`,
		() => {
			test(`client triggering the graphql operation is not associated to an administrator user.
	            argument "input.id" is not equal to the id of the existing user associated to the client triggering the graphql operation.`, async () => {
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);

				const [createUserResult0, createUserResult1] = await Promise.all([
					mercuriusClient.mutate(Mutation_createUser, {
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					}),
					mercuriusClient.mutate(Mutation_createUser, {
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					}),
				]);

				assertToBeNonNullish(
					createUserResult1.data.createUser?.authenticationToken,
				);

				assertToBeNonNullish(createUserResult0.data.createUser?.user?.id);

				const userCreatorResult = await mercuriusClient.query(
					Query_user_creator,
					{
						headers: {
							authorization: `bearer ${createUserResult1.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: createUserResult0.data.createUser.user.id,
							},
						},
					},
				);

				expect(userCreatorResult.data.user?.creator).toEqual(null);
				expect(userCreatorResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["user", "creator"],
						}),
					]),
				);

				assertToBeNonNullish(createUserResult0.data.createUser?.user?.id);
				assertToBeNonNullish(createUserResult1.data.createUser?.user?.id);

				await Promise.all([
					mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: { id: createUserResult0.data.createUser.user.id },
						},
					}),
					mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: { id: createUserResult1.data.createUser.user.id },
						},
					}),
				]);
			});
		},
	);

	suite(
		`results in an empty "errors" field and the expected value for the "data.user.creator" field where`,
		() => {
			test(`"data.user.creator" is "null" when the creator of the user no longer exists.`, async () => {
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);

				const administratorUser0CreateUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "administrator",
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUser0CreateUserResult.data.createUser
						?.authenticationToken,
				);

				const regularUser0CreateUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${
								administratorUser0CreateUserResult.data.createUser
									.authenticationToken
							}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUser0CreateUserResult.data.createUser.user?.id,
				);

				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							id: administratorUser0CreateUserResult.data.createUser.user.id,
						},
					},
				});

				assertToBeNonNullish(
					regularUser0CreateUserResult.data.createUser?.user?.id,
				);

				const userCreatorResult = await mercuriusClient.query(
					Query_user_creator,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: regularUser0CreateUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(userCreatorResult.errors).toBeUndefined();
				expect(userCreatorResult.data.user?.creator).toEqual(null);

				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							id: regularUser0CreateUserResult.data.createUser.user.id,
						},
					},
				});
			});

			test(`"data.user.creator" is non-null when the creator of the user still exists.`, async () => {
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);
				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn.user?.id,
				);

				const userCreatorResult = await mercuriusClient.query(
					Query_user_creator,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(userCreatorResult.errors).toBeUndefined();
				expect(userCreatorResult.data.user?.creator).toEqual(
					administratorUserSignInResult.data.signIn.user,
				);
			});
		},
	);
});

describe("User field creator resolver (unit)", () => {
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

		await expect(creatorResolver(parent, {}, unauthCtx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws unauthenticated error when authenticated user does not exist in database", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(creatorResolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthenticated" }),
			}),
		);
	});

	it("throws unauthorized_action when non-admin accesses another user's creator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: currentUserId,
			role: "regular",
		});

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
		} as UserType;

		await expect(creatorResolver(anotherUser, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unauthorized_action" }),
			}),
		);
	});

	it("returns null when parent creatorId is null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: currentUserId,
			role: "regular",
		});

		const result = await creatorResolver(
			{ ...parent, creatorId: null } as UserType,
			{},
			ctx,
		);

		expect(result).toBeNull();
	});

	it("returns currentUser when parent creatorId equals currentUserId", async () => {
		const currentUser = { id: currentUserId, role: "regular" };

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser,
		);

		const result = await creatorResolver(
			{ ...parent, creatorId: currentUserId } as UserType,
			{},
			ctx,
		);

		expect(result).toBe(currentUser);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(1);
	});

	it("returns existingUser when admin accesses another user and creatorId differs from currentUserId", async () => {
		const creatorId = faker.string.ulid();
		const currentUser = { id: currentUserId, role: "administrator" };
		const existingUser = { id: creatorId, role: "regular" };

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(existingUser);

		const anotherUser = {
			...parent,
			id: faker.string.ulid(),
			creatorId,
		} as UserType;

		const result = await creatorResolver(anotherUser, {}, ctx);

		expect(result).toBe(existingUser);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(2);
	});

	it("logs error and throws unexpected when creatorId is set but creator user not found in database", async () => {
		const creatorId = faker.string.ulid();
		const currentUser = { id: currentUserId, role: "regular" };

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(undefined);

		const parentWithCreator = { ...parent, creatorId } as UserType;

		await expect(creatorResolver(parentWithCreator, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a user's creator id that isn't null.",
		);
	});

	it("rethrows TalawaGraphQLError from currentUser lookup without logging", async () => {
		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			talawaError,
		);

		await expect(creatorResolver(parent, {}, ctx)).rejects.toBe(talawaError);

		expect(ctx.log.error).not.toHaveBeenCalled();
	});

	it("rethrows TalawaGraphQLError from creator lookup without logging", async () => {
		const creatorId = faker.string.ulid();
		const talawaError = new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce({ id: currentUserId, role: "administrator" })
			.mockRejectedValueOnce(talawaError);

		const parentWithCreator = {
			...parent,
			id: faker.string.ulid(),
			creatorId,
		} as UserType; // partial UserType for testing

		await expect(creatorResolver(parentWithCreator, {}, ctx)).rejects.toBe(
			talawaError,
		);

		expect(ctx.log.error).not.toHaveBeenCalled();
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(2);
	});

	it("logs and wraps unknown database errors as unexpected", async () => {
		const unknownError = new Error("DB crash");

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			unknownError,
		);

		await expect(creatorResolver(parent, {}, ctx)).rejects.toThrow(
			expect.objectContaining({
				extensions: expect.objectContaining({ code: "unexpected" }),
			}),
		);

		expect(ctx.log.error).toHaveBeenCalledWith(unknownError);
	});
});
