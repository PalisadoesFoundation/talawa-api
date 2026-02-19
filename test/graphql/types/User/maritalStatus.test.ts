import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "../../../../src/graphql/context";
import { maritalStatusResolver } from "../../../../src/graphql/types/User/maritalStatus";
import type { User as UserType } from "../../../../src/graphql/types/User/User";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "../../../../src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../../test/_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_currentUser,
	Query_user_maritalStatus,
} from "../documentNodes";
import "../../../../src/graphql/types/User/maritalStatus";
import "../../../../src/graphql/schema";

type MaritalStatusTestContext = {
	adminAuthToken: string;
	adminUserId: string;
	createdUserIds: string[];
};

describe("User field maritalStatus", () => {
	describe("maritalStatusResolver unit tests", () => {
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

		afterEach(() => {
			vi.restoreAllMocks();
			vi.clearAllMocks();
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
				expect(
					mocks.drizzleClient.query.usersTable.findFirst,
				).toHaveBeenCalledWith(
					expect.objectContaining({
						columns: { role: true },
						where: expect.any(Function),
					}),
				);
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
				expect(
					mocks.drizzleClient.query.usersTable.findFirst,
				).toHaveBeenCalledWith(
					expect.objectContaining({
						columns: { role: true },
						where: expect.any(Function),
					}),
				);
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
				expect(
					mocks.drizzleClient.query.usersTable.findFirst,
				).toHaveBeenCalledWith(
					expect.objectContaining({
						columns: { role: true },
						where: expect.any(Function),
					}),
				);
			});
		});

		describe("marital status enum values", () => {
			it.each([
				"single",
				"married",
				"divorced",
				"engaged",
				"separated",
				"widowed",
			])("returns '%s' maritalStatus", async (status) => {
				mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
					role: "regular",
				});

				const userWithStatus = {
					...parent,
					maritalStatus: status,
				} as UserType;

				const result = await maritalStatusResolver(
					userWithStatus,
					{} as Record<string, never>,
					ctx,
				);

				expect(result).toBe(status);
			});
		});
	});

	// Integration tests using mercuriusClient
	describe("integration tests", () => {
		beforeEach<MaritalStatusTestContext>(async (ctx) => {
			ctx.createdUserIds = [];
			const { accessToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${accessToken}` },
			});
			assertToBeNonNullish(currentUserResult.data?.currentUser?.id);
			ctx.adminAuthToken = accessToken;
			ctx.adminUserId = currentUserResult.data.currentUser.id;
		});

		afterEach<MaritalStatusTestContext>(async (ctx) => {
			for (const userId of ctx.createdUserIds) {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${ctx.adminAuthToken}`,
					},
					variables: {
						input: {
							id: userId,
						},
					},
				});
			}
			ctx.createdUserIds.length = 0;
			vi.restoreAllMocks();
			vi.clearAllMocks();
		});

		describe(`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.maritalStatus" field if`, () => {
			it("client triggering the graphql operation is not authenticated.", async (ctx: MaritalStatusTestContext) => {
				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
					{
						variables: {
							input: {
								id: ctx.adminUserId,
							},
						},
					},
				);

				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(null);
				expect(userMaritalStatusResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "maritalStatus"],
						}),
					]),
				);
			});

			it("client triggering the graphql operation has no existing user associated to their authentication context.", async (ctx: MaritalStatusTestContext) => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${ctx.adminAuthToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.uuid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				const createdUserId = createUserResult.data.createUser.user.id;

				// Delete the user to make their token invalid
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${ctx.adminAuthToken}`,
					},
					variables: {
						input: {
							id: createdUserId,
						},
					},
				});

				assertToBeNonNullish(
					createUserResult.data.createUser.authenticationToken,
				);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: ctx.adminUserId,
							},
						},
					},
				);

				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(null);
				expect(userMaritalStatusResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "maritalStatus"],
						}),
					]),
				);
			});
		});

		describe(`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.maritalStatus" field if`, () => {
			it(`client triggering the graphql operation is not associated to an administrator user and argument "input.id" is not equal to the id of the existing user associated to the client triggering the graphql operation.`, async (ctx: MaritalStatusTestContext) => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${ctx.adminAuthToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.uuid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);
				ctx.createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: ctx.adminUserId,
							},
						},
					},
				);

				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(null);
				expect(userMaritalStatusResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["user", "maritalStatus"],
						}),
					]),
				);
			});
		});

		describe(`results in an empty "errors" field and the expected value for the "data.user.maritalStatus" field where`, () => {
			it(`"data.user.maritalStatus" returns null when admin user accesses their own data (maritalStatus not set).`, async (ctx: MaritalStatusTestContext) => {
				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
					{
						headers: {
							authorization: `bearer ${ctx.adminAuthToken}`,
						},
						variables: {
							input: {
								id: ctx.adminUserId,
							},
						},
					},
				);

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toBeNull();
			});

			it(`"data.user.maritalStatus" returns null when a regular user accesses their own data (maritalStatus not set).`, async (ctx: MaritalStatusTestContext) => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${ctx.adminAuthToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.uuid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);
				ctx.createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toBeNull();
			});

			it(`"data.user.maritalStatus" returns the correct maritalStatus value when admin accesses another user's data.`, async (ctx: MaritalStatusTestContext) => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${ctx.adminAuthToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.uuid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
								maritalStatus: "married",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				ctx.createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
					{
						headers: {
							authorization: `bearer ${ctx.adminAuthToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
					"married",
				);
			});

			const statuses = [
				"single",
				"married",
				"divorced",
				"engaged",
				"separated",
				"widowed",
			] as const;

			for (const status of statuses) {
				it(`"data.user.maritalStatus" returns correct value for ${status} maritalStatus.`, async (ctx: MaritalStatusTestContext) => {
					const createUserResult = await mercuriusClient.mutate(
						Mutation_createUser,
						{
							headers: {
								authorization: `bearer ${ctx.adminAuthToken}`,
							},
							variables: {
								input: {
									emailAddress: `email${faker.string.uuid()}@email.com`,
									isEmailAddressVerified: false,
									name: "name",
									password: "password",
									role: "regular",
									maritalStatus: status,
								},
							},
						},
					);

					assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
					ctx.createdUserIds.push(createUserResult.data.createUser.user.id);

					const userMaritalStatusResult = await mercuriusClient.query(
						Query_user_maritalStatus,
						{
							headers: {
								authorization: `bearer ${ctx.adminAuthToken}`,
							},
							variables: {
								input: {
									id: createUserResult.data.createUser.user.id,
								},
							},
						},
					);

					expect(userMaritalStatusResult.errors).toBeUndefined();
					expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
						status,
					);
				});
			}
		});
	});
});
