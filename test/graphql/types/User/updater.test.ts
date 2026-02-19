import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Mutation_updateUser,
	Query_currentUser,
	Query_user_updater,
	Query_user_updater_simple,
} from "../documentNodes";

suite("User field updater", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.updater" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminUserId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminUserId);

				const userUpdaterResult = await mercuriusClient.query(
					Query_user_updater,
					{
						variables: {
							input: {
								id: adminUserId,
							},
						},
					},
				);

				expect(userUpdaterResult.data.user?.updater).toEqual(null);
				expect(userUpdaterResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "updater"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminUserId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminUserId);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
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
						authorization: `bearer ${adminToken}`,
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
				assertToBeNonNullish(adminUserId);

				const userUpdaterResult = await mercuriusClient.query(
					Query_user_updater,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: adminUserId,
							},
						},
					},
				);

				expect(userUpdaterResult.data.user?.updater).toEqual(null);
				expect(userUpdaterResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "updater"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.updater" field if`,
		() => {
			test(`client triggering the graphql operation is not associated to an administrator user.
	            argument "input.id" is not equal to the id of the existing user associated to the client triggering the graphql operation.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminUserId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminToken);
				assertToBeNonNullish(adminUserId);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
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
					createUserResult.data.createUser?.authenticationToken,
				);

				assertToBeNonNullish(adminUserId);

				const userUpdaterResult = await mercuriusClient.query(
					Query_user_updater,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: adminUserId,
							},
						},
					},
				);

				expect(userUpdaterResult.data.user?.updater).toEqual(null);
				expect(userUpdaterResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["user", "updater"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in an empty "errors" field and the expected value for the "data.user.updater" field where`,
		() => {
			test(`"data.user.updater" is "null" when the user has not been updated at least once after its creation.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminUserId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminToken);
				assertToBeNonNullish(adminUserId);

				const userUpdaterResult = await mercuriusClient.mutate(
					Query_user_updater,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: adminUserId,
							},
						},
					},
				);

				expect(userUpdaterResult.errors).toBeUndefined();
				expect(userUpdaterResult.data.user?.updater).toEqual(null);
			});

			test(`"data.user.updater" is non-null when the user has been updated at least once after its creation.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminUserId = currentUserResult.data?.currentUser?.id;
				const adminUser = currentUserResult.data?.currentUser;
				assertToBeNonNullish(adminToken);
				assertToBeNonNullish(adminUserId);
				assertToBeNonNullish(adminUser);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
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

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				assertToBeNonNullish(updateUserResult.data.updateUser?.id);

				const userUpdaterResult = await mercuriusClient.mutate(
					Query_user_updater,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: updateUserResult.data.updateUser.id,
							},
						},
					},
				);

				expect(userUpdaterResult.errors).toBeUndefined();
				expect(userUpdaterResult.data.user?.updater).toEqual(adminUser);
			});
		},
	);

	suite(
		`results in the expected value for "data.user.updater" field where`,
		() => {
			test(`"data.user.updater" returns the updater user when accessed by a different user (database lookup path).`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminUserId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminToken);
				assertToBeNonNullish(adminUserId);

				// 1. Create a regular user
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
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
				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);

				// 2. Admin updates the user (so updaterId = Admin)
				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								addressLine1: "New Address",
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				assertToBeNonNullish(updateUserResult.data.updateUser?.id);

				// 3. The regular user queries their own updater (currentUserId = User, updaterId = Admin)
				// This forces the code path where updaterId != currentUserId, triggering the DB lookup
				// We use a simple query requesting only 'id' to avoid authorization errors that would occur
				// when a regular user tries to fetch sensitive fields of the admin user.
				const userUpdaterResult = await mercuriusClient.query(
					Query_user_updater_simple,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: updateUserResult.data.updateUser.id,
							},
						},
					},
				);

				expect(userUpdaterResult.errors).toBeUndefined();
				expect(userUpdaterResult.data.user?.updater).toBeDefined();
				expect(userUpdaterResult.data.user?.updater?.id).toEqual(adminUserId);
			});

			test("throws an error when the updater user is not found (database corruption scenario).", async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				const currentUserResult = await mercuriusClient.query(
					Query_currentUser,
					{ headers: { authorization: `bearer ${adminToken}` } },
				);
				const adminUserId = currentUserResult.data?.currentUser?.id;
				assertToBeNonNullish(adminToken);
				assertToBeNonNullish(adminUserId);

				// 1. Create a regular user
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
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

				// 2. Admin updates the user (so updaterId = Admin)
				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								addressLine1: "New Address",
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				assertToBeNonNullish(updateUserResult.data.updateUser?.id);

				// 3. Spy on drizzleClient to return undefined for the updater lookup (3rd call)
				// Call 1: Query.user fetches the user (Regular) -> Success
				// Call 2: User.updater fetches current user (Regular) for authz -> Success
				// Call 3: User.updater fetches updater user (Admin) -> Fail (Simulated Corruption)

				const originalFindFirst =
					server.drizzleClient.query.usersTable.findFirst;
				let callCount = 0;

				const spy = vi
					.spyOn(server.drizzleClient.query.usersTable, "findFirst")
					// @ts-expect-error Mocking complex Drizzle return type
					.mockImplementation((args) => {
						callCount++;
						if (callCount === 3) {
							return Promise.resolve(undefined);
						}
						return originalFindFirst.call(
							server.drizzleClient.query.usersTable,
							args,
						);
					});

				try {
					// 4. The regular user queries their own updater
					const userUpdaterResult = await mercuriusClient.query(
						Query_user_updater_simple,
						{
							headers: {
								authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
							},
							variables: {
								input: {
									id: updateUserResult.data.updateUser.id,
								},
							},
						},
					);

					// 5. Verify correct error response
					expect(userUpdaterResult.data.user?.updater).toBeNull();
					const errors = userUpdaterResult.errors;
					expect(errors).toBeDefined();
					expect(errors?.length).toBeGreaterThan(0);

					const firstError = errors?.[0];
					expect(firstError).toBeDefined();
					expect(firstError?.message).toContain(
						"Something went wrong. Please try again later.",
					);
				} finally {
					// 6. Restore the spy
					spy.mockRestore();
				}
			});
		},
	);
});
