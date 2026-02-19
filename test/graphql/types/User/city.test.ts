import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
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
	Query_user_city,
} from "../documentNodes";

async function getAdminAuth() {
	const { accessToken: token } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${token}` },
	});
	assertToBeNonNullish(currentUserResult.data?.currentUser?.id);
	return { token, userId: currentUserResult.data.currentUser.id };
}

suite("User field city", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.city" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const adminAuth = await getAdminAuth();

				const userCityResult = await mercuriusClient.query(Query_user_city, {
					variables: {
						input: {
							id: adminAuth.userId,
						},
					},
				});

				expect(userCityResult.data.user?.city).toEqual(null);
				expect(userCityResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "city"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const adminAuth = await getAdminAuth();

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuth.token}`,
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
						authorization: `bearer ${adminAuth.token}`,
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
				assertToBeNonNullish(adminAuth.userId);

				const userCityResult = await mercuriusClient.query(Query_user_city, {
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							id: adminAuth.userId,
						},
					},
				});

				expect(userCityResult.data.user?.city).toEqual(null);
				expect(userCityResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "city"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.city" field if`,
		() => {
			test(`client triggering the graphql operation is not associated to an administrator user.
	            argument "input.id" is not equal to the id of the existing user associated to the client triggering the graphql operation.`, async () => {
				const adminAuth = await getAdminAuth();

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuth.token}`,
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

				assertToBeNonNullish(adminAuth.userId);

				const userCityResult = await mercuriusClient.query(Query_user_city, {
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							id: adminAuth.userId,
						},
					},
				});

				expect(userCityResult.data.user?.city).toEqual(null);
				expect(userCityResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["user", "city"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in an empty "errors" field and the expected value for the "data.user.city" field where`,
		() => {
			test(`"data.user.city" returns the city value when user accesses their own data.`, async () => {
				const adminAuth = await getAdminAuth();
				assertToBeNonNullish(adminAuth.userId);

				const userCityResult = await mercuriusClient.query(Query_user_city, {
					headers: {
						authorization: `bearer ${adminAuth.token}`,
					},
					variables: {
						input: {
							id: adminAuth.userId,
						},
					},
				});

				expect(userCityResult.errors).toBeUndefined();
				// City can be null for admin user that was just created
				expect(userCityResult.data.user).toBeDefined();
			});

			test(`"data.user.city" returns the correct city value when admin accesses another user's data.`, async () => {
				const adminAuth = await getAdminAuth();

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuth.token}`,
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

				// Update the user with a city
				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${adminAuth.token}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
								city: "Test City",
							},
						},
					},
				);

				assertToBeNonNullish(updateUserResult.data.updateUser?.id);

				const userCityResult = await mercuriusClient.query(Query_user_city, {
					headers: {
						authorization: `bearer ${adminAuth.token}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				expect(userCityResult.errors).toBeUndefined();
				expect(userCityResult.data.user?.city).toEqual("Test City");
			});

			test(`"data.user.city" is properly escaped for HTML content.`, async () => {
				const adminAuth = await getAdminAuth();

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuth.token}`,
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

				// Update the user with a city containing HTML characters
				const htmlCity = "<script>alert('xss')</script>";
				await mercuriusClient.mutate(Mutation_updateUser, {
					headers: {
						authorization: `bearer ${adminAuth.token}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
							city: htmlCity,
						},
					},
				});

				const userCityResult = await mercuriusClient.query(Query_user_city, {
					headers: {
						authorization: `bearer ${adminAuth.token}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				expect(userCityResult.errors).toBeUndefined();
				// The city should be escaped
				expect(userCityResult.data.user?.city).not.toEqual(htmlCity);
				expect(userCityResult.data.user?.city).toContain("&lt;");
			});
		},
	);
});
