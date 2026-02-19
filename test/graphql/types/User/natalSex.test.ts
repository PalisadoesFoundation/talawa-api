import { faker } from "@faker-js/faker";
import { beforeAll, expect, suite, test } from "vitest";
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
	Query_currentUser,
	Query_user_natalSex,
} from "../documentNodes";

suite("User field natalSex", () => {
	let adminAuthToken: string;
	let adminUserId: string;

	beforeAll(async () => {
		const { accessToken } = await getAdminAuthViaRest(server);
		adminAuthToken = accessToken;
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${accessToken}` },
		});
		assertToBeNonNullish(currentUserResult.data?.currentUser?.id);
		adminUserId = currentUserResult.data.currentUser.id;
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.natalSex" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
					{
						variables: {
							input: {
								id: adminUserId,
							},
						},
					},
				);

				expect(userNatalSexResult.data.user?.natalSex).toEqual(null);
				expect(userNatalSexResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "natalSex"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
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
						authorization: `bearer ${adminAuthToken}`,
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

				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
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

				expect(userNatalSexResult.data.user?.natalSex).toEqual(null);
				expect(userNatalSexResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "natalSex"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.natalSex" field if`,
		() => {
			test(`client triggering the graphql operation is not associated to an administrator user.
	            argument "input.id" is not equal to the id of the existing user associated to the client triggering the graphql operation.`, async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
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

				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
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

				expect(userNatalSexResult.data.user?.natalSex).toEqual(null);
				expect(userNatalSexResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["user", "natalSex"],
						}),
					]),
				);

				// Cleanup: delete the created user
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});
			});
		},
	);

	suite(
		`results in an empty "errors" field and the expected value for the "data.user.natalSex" field where`,
		() => {
			test(`"data.user.natalSex" returns null when admin user accesses their own data (natalSex not set).`, async () => {
				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								id: adminUserId,
							},
						},
					},
				);

				expect(userNatalSexResult.errors).toBeUndefined();
				// Admin user has no natalSex set, so it should be null
				expect(userNatalSexResult.data.user?.natalSex).toBeNull();
			});

			test(`"data.user.natalSex" returns null when a regular user accesses their own data (natalSex not set).`, async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
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
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
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

				expect(userNatalSexResult.errors).toBeUndefined();
				// User was created without natalSex, so it should be null
				expect(userNatalSexResult.data.user?.natalSex).toBeNull();

				// Cleanup: delete the created user
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});
			});

			test(`"data.user.natalSex" returns the correct natalSex value when admin accesses another user's data.`, async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
								natalSex: "female",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(userNatalSexResult.errors).toBeUndefined();
				expect(userNatalSexResult.data.user?.natalSex).toEqual("female");

				// Cleanup: delete the created user
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});
			});

			test(`"data.user.natalSex" returns null when natalSex is not set.`, async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
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

				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(userNatalSexResult.errors).toBeUndefined();
				expect(userNatalSexResult.data.user?.natalSex).toBeNull();

				// Cleanup: delete the created user
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});
			});

			test(`"data.user.natalSex" returns correct value for male natalSex.`, async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
								natalSex: "male",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(userNatalSexResult.errors).toBeUndefined();
				expect(userNatalSexResult.data.user?.natalSex).toEqual("male");

				// Cleanup: delete the created user
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});
			});

			test(`"data.user.natalSex" returns correct value for intersex natalSex.`, async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
								natalSex: "intersex",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				const userNatalSexResult = await mercuriusClient.query(
					Query_user_natalSex,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(userNatalSexResult.errors).toBeUndefined();
				expect(userNatalSexResult.data.user?.natalSex).toEqual("intersex");

				// Cleanup: delete the created user
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});
			});
		},
	);
});
