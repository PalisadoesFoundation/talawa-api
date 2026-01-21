import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import { print } from "graphql";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import type {
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
	Mutation_deleteCurrentUser,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field createUser", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.createUser" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
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

				expect(createUserResult.data.createUser).toEqual(null);
				expect(createUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["createUser"],
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

				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
				});

				assertToBeNonNullish(
					createUserResult.data.createUser.authenticationToken,
				);

				const createUserResult2 = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
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

				expect(createUserResult2.data.createUser).toEqual(null);
				expect(createUserResult2.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["createUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.createUser" field if`,
		() => {
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
								addressLine1: "",
								addressLine2: "",
								city: "",
								description: "",
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "",
								password: "",
								postalCode: "",
								role: "regular",
								state: "",
							},
						},
					},
				);

				expect(createUserResult.data.createUser).toEqual(null);
				expect(createUserResult.errors).toEqual(
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
							path: ["createUser"],
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
								addressLine1: `addressLine1${faker.string.alpha(1025)}`,
								addressLine2: `addressLine2${faker.string.alpha(1025)}`,
								city: `city${faker.string.alpha(65)}`,
								description: `description${faker.string.alpha(2049)}`,
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: `name${faker.string.alpha(257)}`,
								password: `password${faker.string.alpha(65)}`,
								postalCode: `postalCode${faker.string.alpha(33)}`,
								role: "regular",
								state: `state${faker.string.alpha(65)}`,
							},
						},
					},
				);

				expect(createUserResult.data.createUser).toEqual(null);
				expect(createUserResult.errors).toEqual(
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
							path: ["createUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.createUser" field if`,
		() => {
			test("client triggering the graphql operation is not associated to an existing administrator user.", async () => {
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

				const createUserResult2 = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
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

				expect(createUserResult2.data.createUser).toEqual(null);
				expect(createUserResult2.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["createUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createUser" field if`,
		() => {
			test(`value of the argument "input.emailAddress" corresponds to an existing user.`, async () => {
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
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				expect(createUserResult.data.createUser).toEqual(null);
				expect(createUserResult.errors).toEqual(
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
							path: ["createUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in "undefined" as the value of "errors" field and the expected value for the "data.createUser" field where`,
		() => {
			test(`nullable user fields have the non-null values of the corresponding nullable arguments.
				non-nullable user fields with no corresponding arguments have the default values.
				non-nullable user fields have the non-null values of the corresponding non-nullable arguments.`, async () => {
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

				const variables: VariablesOf<typeof Mutation_createUser> = {
					input: {
						addressLine1: "addressLine1",
						addressLine2: "addressLine2",
						birthDate: "1901-01-01",
						city: "city",
						countryCode: "us",
						description: "description",
						educationGrade: "kg",
						emailAddress: `email${faker.string.ulid()}@email.com`,
						employmentStatus: "part_time",
						homePhoneNumber: "+11111111",
						isEmailAddressVerified: false,
						maritalStatus: "widowed",
						mobilePhoneNumber: "+11111111",
						name: "name",
						password: "password",
						role: "regular",
						natalSex: "female",
						postalCode: "postalCode",
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
						variables,
					},
				);

				expect(createUserResult.errors).toBeUndefined();
				expect(createUserResult.data.createUser).toEqual(
					expect.objectContaining<
						ResultOf<typeof Mutation_createUser>["createUser"]
					>({
						authenticationToken: expect.any(String),
						refreshToken: expect.any(String),
						user: expect.objectContaining<
							Partial<
								NonNullable<
									ResultOf<typeof Mutation_createUser>["createUser"]
								>["user"]
							>
						>({
							addressLine1: variables.input.addressLine1,
							addressLine2: variables.input.addressLine2,
							birthDate: variables.input.birthDate,
							city: variables.input.city,
							countryCode: variables.input.countryCode,
							createdAt: expect.any(String),
							description: variables.input.description,
							educationGrade: variables.input.educationGrade,
							emailAddress: variables.input.emailAddress,
							employmentStatus: variables.input.employmentStatus,
							homePhoneNumber: variables.input.homePhoneNumber,
							id: expect.any(String),
							isEmailAddressVerified: variables.input.isEmailAddressVerified,
							maritalStatus: variables.input.maritalStatus,
							mobilePhoneNumber: variables.input.mobilePhoneNumber,
							name: variables.input.name,
							natalSex: variables.input.natalSex,
							postalCode: variables.input.postalCode,
							role: variables.input.role,
							state: variables.input.state,
							workPhoneNumber: variables.input.workPhoneNumber,
						}),
					}),
				);
			});

			test(`nullable user fields have the "null" values of the corresponding nullable arguments.`, async () => {
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

				const variables: VariablesOf<typeof Mutation_createUser> = {
					input: {
						addressLine1: null,
						addressLine2: null,
						birthDate: null,
						city: null,
						countryCode: null,
						description: null,
						educationGrade: null,
						emailAddress: `email${faker.string.ulid()}@email.com`,
						employmentStatus: null,
						homePhoneNumber: null,
						isEmailAddressVerified: false,
						maritalStatus: null,
						mobilePhoneNumber: null,
						name: "name",
						password: "password",
						role: "regular",
						natalSex: null,
						postalCode: null,
						state: null,
						workPhoneNumber: null,
					},
				};

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables,
					},
				);

				expect(createUserResult.errors).toBeUndefined();
				expect(createUserResult.data.createUser).toEqual(
					expect.objectContaining<
						ResultOf<typeof Mutation_createUser>["createUser"]
					>({
						authenticationToken: expect.any(String),
						refreshToken: expect.any(String),
						user: expect.objectContaining<
							Partial<
								NonNullable<
									ResultOf<typeof Mutation_createUser>["createUser"]
								>["user"]
							>
						>({
							addressLine1: variables.input.addressLine1,
							addressLine2: variables.input.addressLine2,
							birthDate: variables.input.birthDate,
							city: variables.input.city,
							countryCode: variables.input.countryCode,
							description: variables.input.description,
							educationGrade: variables.input.educationGrade,
							employmentStatus: variables.input.employmentStatus,
							homePhoneNumber: variables.input.homePhoneNumber,
							maritalStatus: variables.input.maritalStatus,
							mobilePhoneNumber: variables.input.mobilePhoneNumber,
							natalSex: variables.input.natalSex,
							postalCode: variables.input.postalCode,
							state: variables.input.state,
							workPhoneNumber: variables.input.workPhoneNumber,
						}),
					}),
				);
			});

			test(`nullable user fields have the "null" values if the corresponding nullable arguments are not provided in the graphql operation.`, async () => {
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

				const variables: VariablesOf<typeof Mutation_createUser> = {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "name",
						password: "password",
						role: "regular",
					},
				};

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables,
					},
				);

				expect(createUserResult.errors).toBeUndefined();
				expect(createUserResult.data.createUser).toEqual(
					expect.objectContaining<
						ResultOf<typeof Mutation_createUser>["createUser"]
					>({
						authenticationToken: expect.any(String),
						refreshToken: expect.any(String),
						user: expect.objectContaining<
							Partial<
								NonNullable<
									ResultOf<typeof Mutation_createUser>["createUser"]
								>["user"]
							>
						>({
							addressLine1: null,
							addressLine2: null,
							birthDate: null,
							city: null,
							countryCode: null,
							description: null,
							educationGrade: null,
							employmentStatus: null,
							homePhoneNumber: null,
							maritalStatus: null,
							mobilePhoneNumber: null,
							natalSex: null,
							postalCode: null,
							state: null,
							workPhoneNumber: null,
						}),
					}),
				);
			});
		},
	);

	suite("Integration tests for createUser mutation branches", () => {
		let authToken: string;

		beforeEach(async () => {
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
			authToken = administratorUserSignInResult.data.signIn.authenticationToken;
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		test("should handle naturalLanguageCode in mutation variables", async () => {
			const result = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Test User",
						password: "password",
						role: "regular",
						naturalLanguageCode: "en",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createUser);
			assertToBeNonNullish(result.data.createUser.user);
			// Note: naturalLanguageCode is not in the Mutation_createUser query selection,
			// so we verify the mutation succeeded with the input instead
			expect(result.data.createUser.user.id).toBeDefined();
		});

		test("should upload avatar when provided and verify putObject is called", async () => {
			const putObjectSpy = vi.spyOn(server.minio.client, "putObject");

			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: print(Mutation_createUser),
				variables: {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Test User with Avatar",
						password: "password",
						role: "regular",
						avatar: null,
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const uploadBody = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.png"',
				"Content-Type: image/png",
				"",
				"mock file content",
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${authToken}`,
				},
				payload: uploadBody,
			});

			const result = JSON.parse(response.body);
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createUser);
			expect(putObjectSpy).toHaveBeenCalledTimes(1);
			expect(putObjectSpy).toHaveBeenCalledWith(
				server.minio.bucketName,
				expect.any(String), // avatarName (ulid)
				expect.any(Object), // stream
				undefined,
				expect.objectContaining({
					"content-type": "image/png",
				}),
			);
		});

		test("should surface error when putObject throws", async () => {
			const putObjectError = new Error("MinIO upload failed");
			vi.spyOn(server.minio.client, "putObject").mockRejectedValue(
				putObjectError,
			);

			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: print(Mutation_createUser),
				variables: {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Test User",
						password: "password",
						role: "regular",
						avatar: null,
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.avatar"],
			});

			const uploadBody = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.png"',
				"Content-Type: image/png",
				"",
				"mock file content",
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${authToken}`,
				},
				payload: uploadBody,
			});

			const result = JSON.parse(response.body);
			expect(result.errors).toBeDefined();
			expect(result.data?.createUser).toBeNull();
			expect(result.errors?.[0]?.message).toContain("MinIO upload failed");
		});

		test("should return unexpected error when tx.insert returns no createdUser", async () => {
			const fakeTransaction = async <T>(
				fn: (tx: unknown) => Promise<T>,
			): Promise<T> => {
				return await fn({
					insert: () => ({
						values: () => ({
							returning: async () => {
								return []; // Return empty array to simulate no user created
							},
						}),
					}),
					query: server.drizzleClient.query,
				});
			};

			const transactionSpy = vi
				.spyOn(server.drizzleClient, "transaction")
				.mockImplementationOnce(
					fakeTransaction as typeof server.drizzleClient.transaction,
				);

			try {
				const result = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: `email${faker.string.ulid()}@email.com`,
							isEmailAddressVerified: false,
							name: "Test User",
							password: "password",
							role: "regular",
						},
					},
				});

				expect(result.data?.createUser).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							message: expect.any(String),
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["createUser"],
						}),
					]),
				);
			} finally {
				transactionSpy.mockRestore();
			}
		});

		test("should surface error when storeRefreshToken throws", async () => {
			const refreshTokenUtils = await import(
				"~/src/utilities/refreshTokenUtils"
			);

			const storeRefreshTokenError = new Error("Failed to store refresh token");
			vi.spyOn(refreshTokenUtils, "storeRefreshToken").mockRejectedValue(
				storeRefreshTokenError,
			);

			const result = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Test User",
						password: "password",
						role: "regular",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.data?.createUser).toBeNull();
			expect(result.errors?.[0]?.message).toContain(
				"Failed to store refresh token",
			);
		});
	});
});
