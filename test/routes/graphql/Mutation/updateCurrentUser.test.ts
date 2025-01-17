import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import { expect, suite, test } from "vitest";
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

suite("Mutation field updateCurrentUser", () => {
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
});
