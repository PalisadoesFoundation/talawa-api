import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_birthDate,
} from "../documentNodes";

suite("User field birthDate", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	const createdUserIds: string[] = [];

	// Extract the repeated admin sign-in into a beforeAll block
	beforeAll(async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data.signIn?.authenticationToken,
		);
		assertToBeNonNullish(administratorUserSignInResult.data.signIn.user?.id);

		adminAuthToken =
			administratorUserSignInResult.data.signIn.authenticationToken;
		adminUserId = administratorUserSignInResult.data.signIn.user.id;
	});

	afterAll(async () => {
		for (const userId of createdUserIds) {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: { id: userId },
				},
			});
		}
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.birthDate" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
					{
						variables: {
							input: {
								id: adminUserId,
							},
						},
					},
				);

				expect(userBirthDateResult.data.user?.birthDate).toEqual(null);
				expect(userBirthDateResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "birthDate"],
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

				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
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

				expect(userBirthDateResult.data.user?.birthDate).toEqual(null);
				expect(userBirthDateResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "birthDate"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.birthDate" field if`,
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
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
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

				expect(userBirthDateResult.data.user?.birthDate).toEqual(null);
				expect(userBirthDateResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["user", "birthDate"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in an empty "errors" field and the expected value for the "data.user.birthDate" field where`,
		() => {
			test(`"data.user.birthDate" returns null when admin user accesses their own data (birthDate not set).`, async () => {
				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
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

				expect(userBirthDateResult.errors).toBeUndefined();
				// Admin user has no birthDate set, so it should be null
				expect(userBirthDateResult.data.user?.birthDate).toBeNull();
			});

			test(`"data.user.birthDate" returns null when a regular user accesses their own data (birthDate not set).`, async () => {
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
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
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

				expect(userBirthDateResult.errors).toBeUndefined();
				// User was created without birthDate, so it should be null
				expect(userBirthDateResult.data.user?.birthDate).toBeNull();
			});

			test(`"data.user.birthDate" returns the correct birthDate value when admin accesses another user's data.`, async () => {
				const testBirthDate = "2000-01-15";

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
								birthDate: testBirthDate,
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
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

				expect(userBirthDateResult.errors).toBeUndefined();
				expect(userBirthDateResult.data.user?.birthDate).toEqual(testBirthDate);
			});

			test(`"data.user.birthDate" returns null when admin accesses another user's data (birthDate not set).`, async () => {
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
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
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

				expect(userBirthDateResult.errors).toBeUndefined();
				expect(userBirthDateResult.data.user?.birthDate).toBeNull();
			});

			test(`"data.user.birthDate" returns the correct value when a regular user accesses their own data (birthDate set).`, async () => {
				const testBirthDate = "1995-06-20";

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
								birthDate: testBirthDate,
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userBirthDateResult = await mercuriusClient.query(
					Query_user_birthDate,
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

				expect(userBirthDateResult.errors).toBeUndefined();
				expect(userBirthDateResult.data.user?.birthDate).toEqual(testBirthDate);
			});
		},
	);
});
