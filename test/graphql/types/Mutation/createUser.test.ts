import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import { expect, suite, test } from "vitest";
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
});
