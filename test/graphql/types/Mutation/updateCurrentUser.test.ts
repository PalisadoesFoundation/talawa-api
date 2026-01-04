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

			const userToken = createUserResult.data.createUser?.authenticationToken;
			assertToBeNonNullish(userToken);

			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

			const operations = JSON.stringify({
				query: `
				mutation Mutation_updateCurrentUser($input: MutationUpdateCurrentUserInput!) {
					updateCurrentUser(input: $input) {
						id
						avatarMimeType
					}
				}
				`,
				variables: {
					input: {
						avatar: null,
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const fileContent = "fake content";

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.txt"',
				"Content-Type: text/plain",
				"",
				fileContent,
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${userToken}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);

			expect(result.data?.updateCurrentUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "avatar"],
									message: 'Mime type "text/plain" is not allowed.',
								}),
							]),
						}),
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

			const userToken = createUserResult.data.createUser?.authenticationToken;
			assertToBeNonNullish(userToken);

			// Mock minio putObject
			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

			const updatedName = faker.person.fullName();
			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

			const operations = JSON.stringify({
				query: `
				mutation Mutation_updateCurrentUser($input: MutationUpdateCurrentUserInput!) {
					updateCurrentUser(input: $input) {
						id
						name
						avatarMimeType
						avatarURL
					}
				}
				`,
				variables: {
					input: {
						name: updatedName,
						avatar: null,
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const fileContent = "test content";

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.jpg"',
				"Content-Type: image/jpeg",
				"",
				fileContent,
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${userToken}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);

			expect(result.errors).toBeUndefined();
			expect(result.data.updateCurrentUser).toEqual(
				expect.objectContaining({
					name: updatedName,
					avatarMimeType: "image/jpeg",
					avatarURL: expect.stringContaining("/objects/"),
				}),
			);
			expect(putObjectSpy).toHaveBeenCalled();

			// Verify avatar fields are properly set and valid
			expect(result.data.updateCurrentUser?.avatarMimeType).toBe("image/jpeg");
			expect(result.data.updateCurrentUser?.avatarURL).toMatch(
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

			const userToken = createUserResult.data.createUser?.authenticationToken;
			assertToBeNonNullish(userToken);

			// Mock minio putObject
			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

			// 1. Upload Avatar first
			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const uploadOperations = JSON.stringify({
				query: `
				mutation Mutation_updateCurrentUser($input: MutationUpdateCurrentUserInput!) {
					updateCurrentUser(input: $input) {
						id
						avatarMimeType
						avatarURL
					}
				}
				`,
				variables: {
					input: {
						avatar: null, // placeholder for map
					},
				},
			});

			const uploadMap = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const uploadBody = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				uploadOperations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				uploadMap,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.jpg"',
				"Content-Type: image/jpeg",
				"",
				"test content",
				`--${boundary}--`,
			].join("\r\n");

			const uploadResponse = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${userToken}`,
				},
				payload: uploadBody,
			});

			const uploadResult = JSON.parse(uploadResponse.body);
			expect(uploadResult.errors).toBeUndefined();
			expect(uploadResult.data.updateCurrentUser.avatarMimeType).toBe(
				"image/jpeg",
			);
			expect(uploadResult.data.updateCurrentUser.avatarURL).toBeTruthy();
			expect(putObjectSpy).toHaveBeenCalled();

			// Remove Avatar
			// Mock removeObject
			const removeObjectSpy = vi
				.spyOn(server.minio.client, "removeObject")
				.mockResolvedValue();

			const updatedNameWithoutAvatar = faker.person.fullName();
			const removeResult = await mercuriusClient.mutate(
				Mutation_updateCurrentUser,
				{
					headers: {
						authorization: `bearer ${userToken}`,
					},
					variables: {
						input: {
							avatar: null,
							name: updatedNameWithoutAvatar,
						},
					},
				},
			);

			expect(removeResult.errors).toBeUndefined();
			expect(removeResult.data.updateCurrentUser).toEqual(
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

			const userToken = createUserResult.data.createUser?.authenticationToken;
			assertToBeNonNullish(userToken);

			// Mock minio putObject
			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

			// First Upload
			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations1 = JSON.stringify({
				query: `
				mutation Mutation_updateCurrentUser($input: MutationUpdateCurrentUserInput!) {
					updateCurrentUser(input: $input) {
						id
						avatarMimeType
						avatarURL
					}
				}
				`,
				variables: {
					input: {
						avatar: null,
					},
				},
			});

			const map1 = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const body1 = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations1,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map1,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.jpg"',
				"Content-Type: image/jpeg",
				"",
				"first avatar content",
				`--${boundary}--`,
			].join("\r\n");

			const response1 = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${userToken}`,
				},
				payload: body1,
			});

			const result1 = JSON.parse(response1.body);
			expect(result1.errors).toBeUndefined();
			expect(result1.data.updateCurrentUser.avatarMimeType).toBe("image/jpeg");
			expect(result1.data.updateCurrentUser.avatarURL).toBeTruthy();

			// Second Upload (Replacement)
			const secondUpdatedName = faker.person.fullName();
			const boundary2 = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations2 = JSON.stringify({
				query: `
				mutation Mutation_updateCurrentUser($input: MutationUpdateCurrentUserInput!) {
					updateCurrentUser(input: $input) {
						id
						name
						avatarMimeType
						avatarURL
					}
				}
				`,
				variables: {
					input: {
						name: secondUpdatedName,
						avatar: null,
					},
				},
			});

			const map2 = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const body2 = [
				`--${boundary2}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations2,
				`--${boundary2}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map2,
				`--${boundary2}`,
				'Content-Disposition: form-data; name="0"; filename="test.jpg"',
				"Content-Type: image/png", // Different mime type
				"",
				"second avatar content",
				`--${boundary2}--`,
			].join("\r\n");

			const response2 = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary2}`,
					authorization: `bearer ${userToken}`,
				},
				payload: body2,
			});

			const result2 = JSON.parse(response2.body);

			expect(result2.errors).toBeUndefined();
			expect(result2.data.updateCurrentUser).toEqual(
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
						extensions: expect.objectContaining({
							code: "invalid_credentials",
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

			const userToken = createUserResult.data.createUser?.authenticationToken;
			assertToBeNonNullish(userToken);

			// Mock minio putObject
			const putObjectSpy = vi
				.spyOn(server.minio.client, "putObject")
				.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

			const comprehensiveTestData = {
				addressLine1: faker.location.streetAddress(),
				addressLine2: faker.location.secondaryAddress(),
				birthDate: faker.date.birthdate().toISOString().split("T")[0],
				city: faker.location.city().replace(/'/g, ""), // Remove apostrophes to avoid HTML encoding
				countryCode: "ca" as const,
				description: faker.lorem.paragraph(),
				educationGrade: "graduate" as const,
				emailAddress: `${faker.internet.username()}${faker.string.ulid()}@email.com`,
				employmentStatus: "part_time" as const,
				homePhoneNumber: "+15555555555",
				maritalStatus: "married" as const,
				mobilePhoneNumber: "+15555555555",
				name: faker.person.fullName(),
				natalSex: "female" as const,
				naturalLanguageCode: "fr" as const,
				password: faker.internet.password(),
				postalCode: faker.location.zipCode(),
				state: faker.location.state(),
				workPhoneNumber: "+15555555555",
			};

			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

			const operations = JSON.stringify({
				query: `
				mutation Mutation_updateCurrentUser($input: MutationUpdateCurrentUserInput!) {
					updateCurrentUser(input: $input) {
						id
						addressLine1
						addressLine2
						avatarMimeType
						avatarURL
						birthDate
						city
						countryCode
						description
						educationGrade
						emailAddress
						employmentStatus
						homePhoneNumber
						maritalStatus
						mobilePhoneNumber
						name
						natalSex
						naturalLanguageCode
						postalCode
						state
						workPhoneNumber
					}
				}
				`,
				variables: {
					input: {
						...comprehensiveTestData,
						avatar: null,
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const fileContent = "test content";

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.jpg"',
				"Content-Type: image/jpeg",
				"",
				fileContent,
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${userToken}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);

			expect(result.errors).toBeUndefined();
			expect(result.data.updateCurrentUser).toEqual(
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
			expect(result.data.updateCurrentUser?.naturalLanguageCode).toBe(
				comprehensiveTestData.naturalLanguageCode,
			);

			// Verify avatar fields are properly set and valid
			expect(result.data.updateCurrentUser?.avatarMimeType).toBe("image/jpeg");
			expect(result.data.updateCurrentUser?.avatarURL).toBeDefined();
			expect(result.data.updateCurrentUser?.avatarURL).toMatch(
				/\/objects\/[a-zA-Z0-9]+$/,
			);

			// Verify minio putObject was called for avatar upload
			expect(putObjectSpy).toHaveBeenCalled();
		});
	});
});
