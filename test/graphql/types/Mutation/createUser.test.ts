import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import type { ResultOf, VariablesOf } from "gql.tada";
import { expect, suite, test, vi } from "vitest";
import { usersTable } from "~/src/drizzle/tables/users";
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

	suite("rollback scenarios", () => {
		test("should rollback (delete user) when avatar upload fails", async () => {
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
			const adminToken =
				administratorUserSignInResult.data.signIn.authenticationToken;

			// Mock failure
			const minioClient = server.minio.client;
			const putObjectSpy = vi
				.spyOn(minioClient, "putObject")
				.mockRejectedValue(new Error("Simulated Upload Failure"));

			try {
				const email = `rollback${faker.string.ulid()}@email.com`;

				// Construct multipart request
				const boundary = "----Boundary";
				const operations = {
					query: `mutation CreateUser($input: MutationCreateUserInput!) {
                        createUser(input: $input) { user { id } }
                    }`,
					variables: {
						input: {
							emailAddress: email,
							isEmailAddressVerified: false,
							name: "Rollback User",
							password: "password",
							role: "regular",
							avatar: null, // Mapped
						},
					},
				};
				const map = { "0": ["variables.input.avatar"] };
				const fileContent = "fake-content";

				const body = [
					`--${boundary}`,
					'Content-Disposition: form-data; name="operations"',
					"",
					JSON.stringify(operations),
					`--${boundary}`,
					'Content-Disposition: form-data; name="map"',
					"",
					JSON.stringify(map),
					`--${boundary}`,
					'Content-Disposition: form-data; name="0"; filename="test.png"',
					"Content-Type: image/png",
					"",
					fileContent,
					`--${boundary}--`,
				].join("\r\n");

				const response = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${boundary}`,
						authorization: `bearer ${adminToken}`,
					},
					payload: body,
				});

				const result = response.json();
				expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");

				// Verify deletion
				const user = await server.drizzleClient.query.usersTable.findFirst({
					where: eq(usersTable.emailAddress, email),
				});

				expect(user).toBeUndefined();
			} finally {
				putObjectSpy.mockRestore();
			}
		});

		test("should return invalid_arguments when avatar mime type is not allowed", async () => {
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
			const adminToken =
				administratorUserSignInResult.data.signIn.authenticationToken;

			const boundary = "----BoundaryInvalidAvatar";
			const operations = {
				query: `mutation CreateUser($input: MutationCreateUserInput!) {
                        createUser(input: $input) { user { id } }
                    }`,
				variables: {
					input: {
						emailAddress: `invalidAvatar${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Invalid Avatar User",
						password: "password",
						role: "regular",
						avatar: null,
					},
				},
			};
			const map = { "0": ["variables.input.avatar"] };
			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				JSON.stringify(operations),
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				JSON.stringify(map),
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="test.txt"',
				"Content-Type: text/plain",
				"",
				"not-an-image",
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${adminToken}`,
				},
				payload: body,
			});

			const result = response.json();
			expect(result.data?.createUser).toBeNull();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
			expect(result.errors?.[0]?.extensions?.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: 'Mime type "text/plain" is not allowed.',
					}),
				]),
			);
		});

		test("should use default refresh token expiry when API_REFRESH_TOKEN_EXPIRES_IN is not configured", async () => {
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
			const adminToken =
				administratorUserSignInResult.data.signIn.authenticationToken;

			// Mock API_REFRESH_TOKEN_EXPIRES_IN to undefined to ensure default is used
			const originalExpiresIn = server.envConfig.API_REFRESH_TOKEN_EXPIRES_IN;
			(
				server.envConfig as { API_REFRESH_TOKEN_EXPIRES_IN?: number }
			).API_REFRESH_TOKEN_EXPIRES_IN = undefined;

			try {
				// Create user - should use default refresh token expiry
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								emailAddress: `defaultToken${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Default Token User",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				expect(createUserResult.errors).toBeUndefined();
				expect(createUserResult.data?.createUser?.refreshToken).toBeDefined();
				expect(
					createUserResult.data?.createUser?.authenticationToken,
				).toBeDefined();

				// Validate refresh token expiry by querying the database
				const refreshToken = createUserResult.data?.createUser?.refreshToken;
				assertToBeNonNullish(refreshToken);
				const { hashRefreshToken } = await import(
					"~/src/utilities/refreshTokenUtils"
				);
				const tokenHash = hashRefreshToken(refreshToken);

				const storedToken =
					await server.drizzleClient.query.refreshTokensTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.tokenHash, tokenHash),
						columns: {
							expiresAt: true,
						},
					});

				assertToBeNonNullish(storedToken);
				const { DEFAULT_REFRESH_TOKEN_EXPIRES_MS } = await import(
					"~/src/utilities/refreshTokenUtils"
				);
				const expectedExpiresAt = new Date(
					Date.now() + DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
				);

				// Allow 5 second tolerance for test execution time
				const tolerance = 5000;
				expect(
					Math.abs(
						storedToken.expiresAt.getTime() - expectedExpiresAt.getTime(),
					),
				).toBeLessThan(tolerance);

				// Cleanup
				if (createUserResult.data?.createUser?.user?.id) {
					await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
					});
				}
			} finally {
				// Restore original value
				server.envConfig.API_REFRESH_TOKEN_EXPIRES_IN = originalExpiresIn;
			}
		});

		test("should return unauthenticated error when currentUser query returns undefined", async () => {
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
			const adminToken =
				administratorUserSignInResult.data.signIn.authenticationToken;

			// Mock usersTable.findFirst to return undefined (user not found after authentication)
			const findFirstSpy = vi
				.spyOn(server.drizzleClient.query.usersTable, "findFirst")
				.mockResolvedValue(undefined);

			try {
				const result = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: `userNotFound${faker.string.ulid()}@email.com`,
							isEmailAddressVerified: false,
							name: "User Not Found",
							password: "password",
							role: "regular",
						},
					},
				});

				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
				expect(result.data?.createUser).toBeNull();
			} finally {
				findFirstSpy.mockRestore();
			}
		});

		test("should handle avatar set to null explicitly", async () => {
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
			const adminToken =
				administratorUserSignInResult.data.signIn.authenticationToken;

			// Use regular GraphQL mutation (not multipart) since avatar: null is a valid GraphQL value
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: `nullAvatar${faker.string.ulid()}@email.com`,
							isEmailAddressVerified: false,
							name: "Null Avatar User",
							password: "password",
							role: "regular",
							avatar: null, // Explicitly null - tests the else if (arg.avatar !== undefined) path
						},
					},
				},
			);

			expect(createUserResult.errors).toBeUndefined();
			expect(createUserResult.data?.createUser?.user?.id).toBeDefined();

			// Cleanup
			if (createUserResult.data?.createUser?.user?.id) {
				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
				});
			}
		});
	});
});
