import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "../../../../src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_maritalStatus,
} from "../documentNodes";

suite("User field maritalStatus", () => {
	let adminAuthToken: string;
	let adminUserId: string;
	const createdUserIds: string[] = [];

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

	afterEach(async () => {
		for (const userId of createdUserIds) {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: userId,
					},
				},
			});
		}
		createdUserIds.length = 0;
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.maritalStatus" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
					{
						variables: {
							input: {
								id: adminUserId,
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

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.maritalStatus" field if`,
		() => {
			test(`client triggering the graphql operation is not associated to an administrator user and argument "input.id" is not equal to the id of the existing user associated to the client triggering the graphql operation.`, async () => {
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

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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
		`results in an empty "errors" field and the expected value for the "data.user.maritalStatus" field where`,
		() => {
			test(`"data.user.maritalStatus" returns null when admin user accesses their own data (maritalStatus not set).`, async () => {
				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toBeNull();
			});

			test(`"data.user.maritalStatus" returns null when a regular user accesses their own data (maritalStatus not set).`, async () => {
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

			test(`"data.user.maritalStatus" returns the correct maritalStatus value when admin accesses another user's data.`, async () => {
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
								maritalStatus: "married",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
					"married",
				);
			});

			test(`"data.user.maritalStatus" returns correct value for single maritalStatus.`, async () => {
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
								maritalStatus: "single",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
					"single",
				);
			});

			test(`"data.user.maritalStatus" returns correct value for divorced maritalStatus.`, async () => {
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
								maritalStatus: "divorced",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
					"divorced",
				);
			});

			test(`"data.user.maritalStatus" returns correct value for engaged maritalStatus.`, async () => {
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
								maritalStatus: "engaged",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
					"engaged",
				);
			});

			test(`"data.user.maritalStatus" returns correct value for seperated maritalStatus.`, async () => {
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
								maritalStatus: "seperated",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
					"seperated",
				);
			});

			test(`"data.user.maritalStatus" returns correct value for widowed maritalStatus.`, async () => {
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
								maritalStatus: "widowed",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				createdUserIds.push(createUserResult.data.createUser.user.id);

				const userMaritalStatusResult = await mercuriusClient.query(
					Query_user_maritalStatus,
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

				expect(userMaritalStatusResult.errors).toBeUndefined();
				expect(userMaritalStatusResult.data.user?.maritalStatus).toEqual(
					"widowed",
				);
			});
		},
	);
});
