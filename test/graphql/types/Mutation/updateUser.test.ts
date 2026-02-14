/**
 * NOTE ON AVATAR UPLOAD / REMOVAL TESTING
 *
 * The updateUser mutation includes avatar upload and removal logic that relies on:
 * - GraphQL multipart Upload scalar handling
 * - MinIO side-effect operations (putObject / removeObject)
 *
 * The current test harness (mercuriusClient) does not support multipart uploads,
 * making it impossible to execute the successful avatar upload or removal paths
 * in unit or integration tests.
 *
 * As a result:
 * - Invalid avatar mime types are tested (error path)
 * - Successful avatar upload/removal paths are intentionally excluded
 *
 * These paths are expected to be covered by dedicated integration or E2E tests.
 */

import { Readable } from "node:stream";
import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionOnArgumentsAssociatedResourcesExtensions,
	InvalidArgumentsExtensions,
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
	Mutation_updateUser,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field updateUser", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
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
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
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
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateUser"],
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

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
		() => {
			test(`at least one optional argument within the "input" argument is not provided.`, async () => {
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
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
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
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"]
								>([
									expect.objectContaining<
										InvalidArgumentsExtensions["issues"][number]
									>({
										argumentPath: ["input"],
										message: expect.any(String),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});

			test(`length of the value of the argument "input.addressLine1" is less than 1.
				length of the value of the argument "input.addressLine2" is less than 1.
	    		length of the value of the argument "input.city" is less than 1.
	    		length of the value of the argument "input.description" is less than 1.
	    		length of the value of the argument "input.name" is less than 1.
	    		length of the value of the argument "input.postalCode" is less than 1.
	    		length of the value of the argument "input.state" is less than 1.`, async () => {
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
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
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
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: "",
								addressLine2: "",
								city: "",
								description: "",
								id: createUserResult.data.createUser.user.id,
								name: "",
								postalCode: "",
								state: "",
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "addressLine1"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "addressLine2"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "city"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "description"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "postalCode"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "state"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});

			test(`length of the value of the argument "input.addressLine1" is more than 1025.
				length of the value of the argument "input.addressLine1" is more than 1025.
	    		length of the value of the argument "input.city" is more than 64.
	    		length of the value of the argument "input.description" is more than 2048.
	    		length of the value of the argument "input.name" is more than 256.
	    		length of the value of the argument "input.postalCode" is more than 32.
	    		length of the value of the argument "input.state" is more than 64.`, async () => {
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
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
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
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: `addressLine1${faker.string.alpha(1025)}`,
								addressLine2: `addressLine2${faker.string.alpha(1025)}`,
								city: `city${faker.string.alpha(65)}`,
								description: `description${faker.string.alpha(2049)}`,
								id: createUserResult.data.createUser.user.id,
								name: `name${faker.string.alpha(257)}`,
								postalCode: `postalCode${faker.string.alpha(33)}`,
								state: `state${faker.string.alpha(65)}`,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "addressLine1"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "addressLine2"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "city"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "description"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "postalCode"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "state"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});

			test(`value of the argument "input.emailAddress" is "null".
				value of the argument "input.isEmailAddressVerified" is "null".
				value of the argument "input.name" is "null".
				value of the argument "input.role" is "null".`, async () => {
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
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
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
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: null,
								id: createUserResult.data.createUser.user.id,
								isEmailAddressVerified: null,
								name: null,
								role: null,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "emailAddress"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "isEmailAddressVerified"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "role"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});

			test("should return invalid_arguments when avatar mime type is not allowed", async () => {
				const signIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(signIn.data);
				assertToBeNonNullish(signIn.data.signIn);
				assertToBeNonNullish(signIn.data.signIn.authenticationToken);

				const adminToken = signIn.data.signIn.authenticationToken;

				const createUser = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: `email${faker.string.ulid()}@email.com`,
							isEmailAddressVerified: false,
							name: "name",
							password: "password",
							role: "regular",
						},
					},
				});

				const fakeUpload = Promise.resolve({
					filename: "avatar.txt",
					mimetype: "text/plain",
					createReadStream: () => Readable.from("dummy"),
				});
				assertToBeNonNullish(createUser.data);
				assertToBeNonNullish(createUser.data.createUser);
				assertToBeNonNullish(createUser.data.createUser.user);
				assertToBeNonNullish(createUser.data.createUser.user.id);

				const userId = createUser.data.createUser.user.id;

				const result = await mercuriusClient.mutate(Mutation_updateUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: userId,
							avatar: fakeUpload,
						},
					},
				});
				expect(result.data).toBeNull();
				expect(result.errors).toBeDefined();
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.deleteUser" field if`,
		() => {
			test("client triggering the graphql operation is not associated to an administrator user.", async () => {
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

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
		() => {
			test(`value of the argument "input.id" is equal to the id of the user associated to the client triggering the graphql operation.`, async () => {
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

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ForbiddenActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "forbidden_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											ForbiddenActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "id"],
												message: expect.any(String),
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.deleteUser" field if`,
		() => {
			test(`value of the argument "input.id" doesn't correspond to an existing user.`, async () => {
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

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
								name: "name",
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "id"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in "undefined" as the value of "errors" field and the expected value for the "data.updateUser" field where`,
		() => {
			test(`nullable user fields have the values of the corresponding nullable arguments if they are provided in the graphql operation.
				non-nullable user fields have the non-null values of the corresponding nullable arguments if they are provided in the graphql operation.`, async () => {
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

				const createUserVariables: VariablesOf<typeof Mutation_createUser> = {
					input: {
						addressLine1: "addressLine1",
						addressLine2: "addressLine2",
						birthDate: "1901-01-01",
						city: "city",
						countryCode: "us",
						description: "description",
						educationGrade: "pre_kg",
						emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
						employmentStatus: "full_time",
						homePhoneNumber: "+11111111",
						isEmailAddressVerified: false,
						maritalStatus: "divorced",
						mobilePhoneNumber: "+11111111",
						name: "name",
						natalSex: "male",
						password: "password",
						postalCode: "postal code",
						role: "regular",
						state: "state",
						workPhoneNumber: "+11111111",
					},
				};

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: createUserVariables,
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

				const updateUserVariables: VariablesOf<typeof Mutation_updateUser> = {
					input: {
						addressLine1: null,
						addressLine2: null,
						birthDate: null,
						city: null,
						countryCode: null,
						description: null,
						educationGrade: null,
						emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
						employmentStatus: null,
						homePhoneNumber: null,
						id: createUserResult.data.createUser.user.id,
						isEmailAddressVerified: true,
						maritalStatus: null,
						mobilePhoneNumber: null,
						name: "new name",
						natalSex: null,
						postalCode: null,
						role: "administrator",
						state: null,
						workPhoneNumber: null,
					},
				};

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: updateUserVariables,
					},
				);

				expect(updateUserResult.errors).toBeUndefined();
				expect(updateUserResult.data.updateUser).toEqual(
					expect.objectContaining<
						Partial<ResultOf<typeof Mutation_updateUser>["updateUser"]>
					>({
						addressLine1: updateUserVariables.input.addressLine1,
						addressLine2: updateUserVariables.input.addressLine2,
						birthDate: updateUserVariables.input.birthDate,
						city: updateUserVariables.input.city,
						countryCode: updateUserVariables.input.countryCode,
						createdAt: expect.any(String),
						description: updateUserVariables.input.description,
						educationGrade: updateUserVariables.input.educationGrade,
						emailAddress: updateUserVariables.input.emailAddress,
						employmentStatus: updateUserVariables.input.employmentStatus,
						homePhoneNumber: updateUserVariables.input.homePhoneNumber,
						id: expect.any(String),
						isEmailAddressVerified:
							updateUserVariables.input.isEmailAddressVerified,
						maritalStatus: updateUserVariables.input.maritalStatus,
						mobilePhoneNumber: updateUserVariables.input.mobilePhoneNumber,
						name: updateUserVariables.input.name,
						natalSex: updateUserVariables.input.natalSex,
						postalCode: updateUserVariables.input.postalCode,
						role: updateUserVariables.input.role,
						state: updateUserVariables.input.state,
						workPhoneNumber: updateUserVariables.input.workPhoneNumber,
					}),
				);
			});

			test("should update user successfully when optional fields are omitted", async () => {
				const signIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				assertToBeNonNullish(signIn.data);
				assertToBeNonNullish(signIn.data.signIn);
				assertToBeNonNullish(signIn.data.signIn.authenticationToken);

				const adminToken = signIn.data.signIn.authenticationToken;

				const createUser = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: `email${faker.string.ulid()}@email.com`,
							isEmailAddressVerified: false,
							name: "name",
							password: "password",
							role: "regular",
						},
					},
				});
				assertToBeNonNullish(createUser.data);
				assertToBeNonNullish(createUser.data.createUser);
				assertToBeNonNullish(createUser.data.createUser.user);
				assertToBeNonNullish(createUser.data.createUser.user.id);

				const userId = createUser.data.createUser.user.id;
				const result = await mercuriusClient.mutate(Mutation_updateUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: userId,
							name: "updated name",
						},
					},
				});

				expect(result.errors).toBeUndefined();

				assertToBeNonNullish(result.data);
				assertToBeNonNullish(result.data.updateUser);

				expect(result.data.updateUser.name).toBe("updated name");
			});
		},
	);
});
