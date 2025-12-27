import { Readable } from "node:stream";
import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import type { Client } from "minio";
import { afterEach, expect, suite, test, vi } from "vitest";

import type {
	ForbiddenActionOnArgumentsAssociatedResourcesExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Mutation_updateCurrentUser,
	Query_signIn,
} from "../documentNodes";

// Extract the return type of putObject from the minio Client
type UploadedObjectInfo = Awaited<ReturnType<Client["putObject"]>>;

suite("Mutation field updateCurrentUser", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.updateCurrentUser" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						variables: {
							input: {},
						},
					},
				);

				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
				expect(updateCurrentUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateCurrentUser"],
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

				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
							},
						},
					},
				);

				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
				expect(updateCurrentUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateCurrentUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.updateCurrentUser" field if`,
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

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);

				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {},
						},
					},
				);

				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
				expect(updateCurrentUserResult.errors).toEqual(
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
							path: ["updateCurrentUser"],
						}),
					]),
				);
			});

			test(`length of the value of the argument "input.addressLine1" is less than 1.
		length of the value of the argument "input.addressLine2" is less than 1.
	    length of the value of the argument "input.city" is less than 1.
	    length of the value of the argument "input.description" is less than 1.
	    length of the value of the argument "input.name" is less than 1.
	    length of the value of the argument "input.password" is less than 1.
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

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);

				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: "",
								addressLine2: "",
								city: "",
								description: "",
								name: "",
								password: "",
								postalCode: "",
								state: "",
							},
						},
					},
				);

				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
				expect(updateCurrentUserResult.errors).toEqual(
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
										argumentPath: ["input", "password"],
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
							path: ["updateCurrentUser"],
						}),
					]),
				);
			});

			test(`length of the value of the argument "input.addressLine1" is more than 1025.
		length of the value of the argument "input.addressLine2" is more than 1025.
        length of the value of the argument "input.city" is more than 64.
        length of the value of the argument "input.description" is more than 2048.
        length of the value of the argument "input.name" is more than 256.
        length of the value of the argument "input.password" is more than 64.
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

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);

				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: `addressLine1${faker.string.alpha(1025)}`,
								addressLine2: `addressLine2${faker.string.alpha(1025)}`,
								city: `city${faker.string.alpha(65)}`,
								description: `description${faker.string.alpha(2049)}`,
								name: `name${faker.string.alpha(257)}`,
								password: `password${faker.string.alpha(65)}`,
								postalCode: `postalCode${faker.string.alpha(33)}`,
								state: `state${faker.string.alpha(65)}`,
							},
						},
					},
				);

				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
				expect(updateCurrentUserResult.errors).toEqual(
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
										argumentPath: ["input", "password"],
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
							path: ["updateCurrentUser"],
						}),
					]),
				);
			});

			test(`value of th optional argument "input.emailAddress" is "null".
        value of the optional argument "input.name" is "null".
        value of the optional argument "input.password" is "null".`, async () => {
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

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);

				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: null,
								name: null,
								password: null,
							},
						},
					},
				);

				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
				expect(updateCurrentUserResult.errors).toEqual(
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
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "password"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["updateCurrentUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.updateCurrentUser" field if`,
		() => {
			test(`value of the optional argument "input.emailAddress" corresponds to an existing user.`, async () => {
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

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);

				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							},
						},
					},
				);

				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
				expect(updateCurrentUserResult.errors).toEqual(
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
												argumentPath: ["input", "emailAddress"],
												message: expect.any(String),
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["updateCurrentUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in "undefined" as the value of "errors" field and the expected value for the "data.updateCurrentUser" field where`,
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

				const updateCurrentUserVariables: VariablesOf<
					typeof Mutation_updateCurrentUser
				> = {
					input: {
						addressLine1: "addressLine1",
						addressLine2: "addressLine2",
						birthDate: null,
						city: null,
						countryCode: null,
						description: null,
						educationGrade: null,
						emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
						employmentStatus: null,
						homePhoneNumber: null,
						maritalStatus: null,
						mobilePhoneNumber: null,
						name: "new name",
						natalSex: null,
						password: "new password",
						postalCode: null,
						state: null,
						workPhoneNumber: null,
					},
				};

				const updateCurrentUserResult = await mercuriusClient.mutate(
					Mutation_updateCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: updateCurrentUserVariables,
					},
				);

				expect(updateCurrentUserResult.errors).toBeUndefined();
				expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
					expect.objectContaining<
						Partial<
							ResultOf<typeof Mutation_updateCurrentUser>["updateCurrentUser"]
						>
					>({
						addressLine1: updateCurrentUserVariables.input.addressLine1,
						addressLine2: updateCurrentUserVariables.input.addressLine2,
						birthDate: updateCurrentUserVariables.input.birthDate,
						city: updateCurrentUserVariables.input.city,
						countryCode: updateCurrentUserVariables.input.countryCode,
						createdAt: expect.any(String),
						description: updateCurrentUserVariables.input.description,
						educationGrade: updateCurrentUserVariables.input.educationGrade,
						emailAddress: updateCurrentUserVariables.input.emailAddress,
						employmentStatus: updateCurrentUserVariables.input.employmentStatus,
						homePhoneNumber: updateCurrentUserVariables.input.homePhoneNumber,
						id: expect.any(String),
						isEmailAddressVerified: false,
						maritalStatus: updateCurrentUserVariables.input.maritalStatus,
						mobilePhoneNumber:
							updateCurrentUserVariables.input.mobilePhoneNumber,
						name: updateCurrentUserVariables.input.name,
						natalSex: updateCurrentUserVariables.input.natalSex,
						postalCode: updateCurrentUserVariables.input.postalCode,
						role: "regular",
						state: updateCurrentUserVariables.input.state,
						workPhoneNumber: updateCurrentUserVariables.input.workPhoneNumber,
					}),
				);
			});
		},
	);

	suite("Avatar handling", () => {
		test("should handle invalid avatar mime type", async () => {
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

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			// Mock invalid avatar file
			const invalidAvatar = Promise.resolve({
				filename: `${faker.system.fileName()}.txt`,
				mimetype: "text/plain", // Invalid mime type
				encoding: "7bit",
				createReadStream: vi
					.fn()
					.mockReturnValue(Readable.from("test content")),
			});

			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							avatar: invalidAvatar,
						},
					},
				},
			);

			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
			expect(updateCurrentUserResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["avatar"],
									message: expect.stringContaining("not allowed"),
								}),
							]),
						}),
						message: expect.any(String),
						path: ["updateCurrentUser"],
					}),
				]),
			);
		});

		test("should successfully upload new avatar", async () => {
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

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			// Mock valid avatar file
			const validAvatar = Promise.resolve({
				filename: `${faker.system.fileName()}.jpg`,
				mimetype: "image/jpeg",
				encoding: "7bit",
				createReadStream: vi
					.fn()
					.mockReturnValue(Readable.from("test content")),
			});

			// Mock minio putObject
			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

			const updatedName = faker.person.fullName();
			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							avatar: validAvatar,
							name: updatedName,
						},
					},
				},
			);

			expect(updateCurrentUserResult.errors).toBeUndefined();
			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					name: updatedName,
					avatarMimeType: "image/jpeg",
					avatarURL: expect.stringContaining("/objects/"),
				}),
			);
			expect(putObjectSpy).toHaveBeenCalled();

			// Verify avatar fields are properly set and valid
			expect(
				updateCurrentUserResult.data.updateCurrentUser?.avatarMimeType,
			).toBe("image/jpeg");
			expect(updateCurrentUserResult.data.updateCurrentUser?.avatarURL).toMatch(
				/\/objects\/[a-zA-Z0-9]+$/,
			);
		});

		test("should remove existing avatar when avatar is set to null", async () => {
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

			// Create user with avatar
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

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			// First, add an avatar
			const validAvatar = Promise.resolve({
				filename: "test.jpg",
				mimetype: "image/jpeg",
				encoding: "7bit",
				createReadStream: vi
					.fn()
					.mockReturnValue(Readable.from("test content")),
			});

			vi.spyOn(server.minio.client, "putObject").mockResolvedValue({
				etag: "mock-etag",
			} as UploadedObjectInfo);

			const initialAvatarUploadResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							avatar: validAvatar,
						},
					},
				},
			);

			// Verify the avatar upload succeeded before testing removal
			expect(initialAvatarUploadResult.errors).toBeUndefined();
			expect(initialAvatarUploadResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					avatarMimeType: "image/jpeg",
					avatarURL: expect.stringContaining("/objects/"),
				}),
			);
			expect(
				initialAvatarUploadResult.data.updateCurrentUser?.avatarURL,
			).toBeDefined();
			expect(
				initialAvatarUploadResult.data.updateCurrentUser?.avatarURL,
			).toBeTypeOf("string");
			expect(
				initialAvatarUploadResult.data.updateCurrentUser?.avatarURL,
			).not.toBe("");
			// Verify putObject was called for the upload
			expect(server.minio.client.putObject).toHaveBeenCalled();

			// Mock removeObject
			const removeObjectSpy = vi
				.spyOn(server.minio.client, "removeObject")
				.mockResolvedValue();

			// Now remove the avatar by setting it to null
			const updatedNameWithoutAvatar = faker.person.fullName();
			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							avatar: null,
							name: updatedNameWithoutAvatar,
						},
					},
				},
			);

			expect(updateCurrentUserResult.errors).toBeUndefined();
			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					name: updatedNameWithoutAvatar,
					avatarMimeType: null,
					avatarURL: null,
				}),
			);
			expect(removeObjectSpy).toHaveBeenCalled();
		});

		test("should handle avatar upload with existing avatar name", async () => {
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

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			// First upload
			const firstAvatar = Promise.resolve({
				filename: `${faker.system.fileName()}.jpg`,
				mimetype: "image/jpeg",
				encoding: "7bit",
				createReadStream: vi
					.fn()
					.mockReturnValue(Readable.from("test content")),
			});

			vi.spyOn(server.minio.client, "putObject").mockResolvedValue({
				etag: "mock-etag",
			} as UploadedObjectInfo);

			const firstAvatarUploadResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							avatar: firstAvatar,
						},
					},
				},
			);

			// Verify the first avatar upload succeeded before testing replacement
			expect(firstAvatarUploadResult.errors).toBeUndefined();
			expect(firstAvatarUploadResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					avatarMimeType: "image/jpeg",
					avatarURL: expect.stringContaining("/objects/"),
				}),
			);
			expect(
				firstAvatarUploadResult.data.updateCurrentUser?.avatarURL,
			).toBeDefined();

			// Second upload replaces existing avatar using same storage key
			const secondAvatar = Promise.resolve({
				filename: `${faker.system.fileName()}.jpg`,
				mimetype: "image/png",
				encoding: "7bit",
				createReadStream: vi
					.fn()
					.mockReturnValue(Readable.from("test content")),
			});

			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

			const secondUpdatedName = faker.person.fullName();
			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							avatar: secondAvatar,
							name: secondUpdatedName,
						},
					},
				},
			);

			expect(updateCurrentUserResult.errors).toBeUndefined();
			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					name: secondUpdatedName,
					avatarMimeType: "image/png",
					avatarURL: expect.stringContaining("/objects/"),
				}),
			);
			expect(putObjectSpy).toHaveBeenCalled();
		});
	});

	suite("Transaction and database error handling", () => {
		test("should handle transaction failure when user update returns undefined", async () => {
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

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			// Mock the transaction to simulate database update failure
			vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
				async (callback) => {
					const mockTx = {
						...server.drizzleClient,
						update: vi.fn().mockReturnValue({
							set: vi.fn().mockReturnValue({
								where: vi.fn().mockReturnValue({
									returning: vi.fn().mockResolvedValue([]), // Empty array indicates no user was found/updated
								}),
							}),
						}),
					};

					return callback(mockTx as unknown as Parameters<typeof callback>[0]);
				},
			);

			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							name: faker.person.fullName(),
						},
					},
				},
			);

			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(null);
			expect(updateCurrentUserResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["updateCurrentUser"],
					}),
				]),
			);
		});
	});

	suite("Password hashing", () => {
		test("should hash password when provided", async () => {
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

			const originalPassword = faker.internet.password();
			const userEmail = `emailAddress${faker.string.ulid()}@email.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							emailAddress: userEmail,
							isEmailAddressVerified: false,
							name: faker.person.fullName(),
							password: originalPassword,
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			const newPassword = faker.internet.password();
			const passwordTestName = faker.person.fullName();
			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							password: newPassword,
							name: passwordTestName,
						},
					},
				},
			);

			expect(updateCurrentUserResult.errors).toBeUndefined();
			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					name: passwordTestName,
				}),
			);

			// Verify password hashing: new password should work for sign in
			const signInWithNewPasswordResult = await mercuriusClient.query(
				Query_signIn,
				{
					variables: {
						input: {
							emailAddress: userEmail,
							password: newPassword,
						},
					},
				},
			);

			expect(signInWithNewPasswordResult.errors).toBeUndefined();
			expect(
				signInWithNewPasswordResult.data.signIn?.authenticationToken,
			).toBeDefined();

			// Verify old password no longer works
			const signInWithOldPasswordResult = await mercuriusClient.query(
				Query_signIn,
				{
					variables: {
						input: {
							emailAddress: userEmail,
							password: originalPassword,
						},
					},
				},
			);

			expect(signInWithOldPasswordResult.data.signIn).toEqual(null);
			expect(signInWithOldPasswordResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("should not hash password when not provided", async () => {
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

			const originalPassword = faker.internet.password();
			const userEmail = `emailAddress${faker.string.ulid()}@email.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							emailAddress: userEmail,
							isEmailAddressVerified: false,
							name: faker.person.fullName(),
							password: originalPassword,
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			const nameOnlyTestName = faker.person.fullName();
			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							name: nameOnlyTestName,
						},
					},
				},
			);

			expect(updateCurrentUserResult.errors).toBeUndefined();
			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					name: nameOnlyTestName,
				}),
			);

			// Verify password was not changed: original password should still work
			const signInWithOriginalPasswordResult = await mercuriusClient.query(
				Query_signIn,
				{
					variables: {
						input: {
							emailAddress: userEmail,
							password: originalPassword,
						},
					},
				},
			);

			expect(signInWithOriginalPasswordResult.errors).toBeUndefined();
			expect(
				signInWithOriginalPasswordResult.data.signIn?.authenticationToken,
			).toBeDefined();
		});
	});

	suite("Natural language code handling", () => {
		test("should update natural language code", async () => {
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

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			const languageTestName = faker.person.fullName();
			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							naturalLanguageCode: "es",
							name: languageTestName,
						},
					},
				},
			);

			expect(updateCurrentUserResult.errors).toBeUndefined();
			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					name: languageTestName,
					naturalLanguageCode: "es",
				}),
			);

			// Verify naturalLanguageCode field was actually updated and returned
			expect(
				updateCurrentUserResult.data.updateCurrentUser?.naturalLanguageCode,
			).toBeDefined();
			expect(
				updateCurrentUserResult.data.updateCurrentUser?.naturalLanguageCode,
			).toBe("es");
		});
	});

	suite("Edge cases and comprehensive field updates", () => {
		test("should handle all possible field updates simultaneously", async () => {
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

			assertToBeNonNullish(
				createUserResult.data.createUser?.authenticationToken,
			);

			const validAvatar = Promise.resolve({
				filename: `${faker.system.fileName()}.jpg`,
				mimetype: "image/jpeg",
				encoding: "7bit",
				createReadStream: vi
					.fn()
					.mockReturnValue(Readable.from("test content")),
			});

			vi.spyOn(server.minio.client, "putObject").mockResolvedValue({
				etag: "mock-etag",
			} as UploadedObjectInfo);

			const comprehensiveTestData = {
				addressLine1: faker.location.streetAddress(),
				addressLine2: faker.location.secondaryAddress(),
				birthDate: faker.date.birthdate().toISOString().split("T")[0],
				city: faker.location.city(),
				countryCode: "ca" as const,
				description: faker.lorem.paragraph(),
				educationGrade: "graduate" as const,
				emailAddress: `${faker.internet.userName()}${faker.string.ulid()}@email.com`,
				employmentStatus: "part_time" as const,
				homePhoneNumber: faker.phone.number(),
				maritalStatus: "married" as const,
				mobilePhoneNumber: faker.phone.number(),
				name: faker.person.fullName(),
				natalSex: "female" as const,
				naturalLanguageCode: "fr" as const,
				password: faker.internet.password(),
				postalCode: faker.location.zipCode(),
				state: faker.location.state(),
				workPhoneNumber: faker.phone.number(),
			};

			const updateCurrentUserResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							...comprehensiveTestData,
							avatar: validAvatar,
						},
					},
				},
			);

			expect(updateCurrentUserResult.errors).toBeUndefined();
			expect(updateCurrentUserResult.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					addressLine1: comprehensiveTestData.addressLine1,
					addressLine2: comprehensiveTestData.addressLine2,
					avatarMimeType: "image/jpeg",
					avatarURL: expect.stringContaining("/objects/"),
					birthDate: comprehensiveTestData.birthDate,
					city: comprehensiveTestData.city,
					countryCode: comprehensiveTestData.countryCode,
					description: comprehensiveTestData.description,
					educationGrade: comprehensiveTestData.educationGrade,
					emailAddress: comprehensiveTestData.emailAddress,
					employmentStatus: comprehensiveTestData.employmentStatus,
					homePhoneNumber: comprehensiveTestData.homePhoneNumber,
					maritalStatus: comprehensiveTestData.maritalStatus,
					mobilePhoneNumber: comprehensiveTestData.mobilePhoneNumber,
					name: comprehensiveTestData.name,
					natalSex: comprehensiveTestData.natalSex,
					naturalLanguageCode: comprehensiveTestData.naturalLanguageCode,
					postalCode: comprehensiveTestData.postalCode,
					state: comprehensiveTestData.state,
					workPhoneNumber: comprehensiveTestData.workPhoneNumber,
				}),
			);

			// Additional explicit assertions for naturalLanguageCode and avatar persistence
			expect(
				updateCurrentUserResult.data.updateCurrentUser?.naturalLanguageCode,
			).toBe(comprehensiveTestData.naturalLanguageCode);

			// Verify avatar fields are properly set and valid
			expect(
				updateCurrentUserResult.data.updateCurrentUser?.avatarMimeType,
			).toBe("image/jpeg");
			expect(
				updateCurrentUserResult.data.updateCurrentUser?.avatarURL,
			).toBeDefined();
			expect(updateCurrentUserResult.data.updateCurrentUser?.avatarURL).toMatch(
				/\/objects\/[a-zA-Z0-9]+$/,
			);

			// Verify minio putObject was called for avatar upload
			expect(server.minio.client.putObject).toHaveBeenCalled();
		});
	});
});
