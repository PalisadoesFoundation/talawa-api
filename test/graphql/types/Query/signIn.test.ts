import { faker } from "@faker-js/faker";
import type { VariablesOf } from "gql.tada";
import { assertToBeNonNullish } from "test/helpers";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionExtensions,
	InvalidArgumentsExtensions,
	InvalidCredentialsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

suite("Query field signIn", () => {
	let user1Email = "";
	let adminAuth = "";
	let orgId = "";

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
		adminAuth = administratorUserSignInResult.data.signIn.authenticationToken;
		user1Email = `email${faker.string.ulid()}@email.com`;

		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					emailAddress: user1Email,
					isEmailAddressVerified: false,
					name: "name",
					password: "password",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

		// Create an organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						countryCode: "us",
						name: `Test Organization ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);
		assertToBeNonNullish(orgResult.data?.createOrganization);

		orgId = orgResult.data.createOrganization.id;

		const orgMembership = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						memberId: createUserResult.data.createUser?.user?.id,
						organizationId: orgResult.data.createOrganization.id,
						role: "administrator",
					},
				},
			},
		);

		assertToBeNonNullish(orgMembership.data?.createOrganizationMembership);
	});

	afterAll(async () => {
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: user1Email,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					organizationId: orgId,
					memberId: user1Email,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: orgId,
				},
			},
		});
	});

	suite(
		"results in a graphql error with forbidden_action extensions code in the errors field and null as the value of data.signIn field if",
		() => {
			test("client triggering the graphql operation is already signed in.", async () => {
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

				const signInResult = await mercuriusClient.query(Query_signIn, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn?.authenticationToken}`,
					},
					variables: {
						input: {
							emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
							password: "password",
						},
					},
				});

				expect(signInResult.data.signIn).toEqual(null);
				expect(signInResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<ForbiddenActionExtensions>({
								code: "forbidden_action",
							}),
							message: expect.any(String),
							path: ["signIn"],
						}),
					]),
				);
			});
		},
	);

	suite(
		"results in a graphql error with invalid_credentials extensions code in the errors field and null as the value of data.signIn field if",
		() => {
			test("value of the input.emailAddress does not correspond to an existing user.", async () => {
				const result = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: `email${faker.string.ulid()}@email.com`,
							password: `password${faker.string.ulid()}`,
						},
					},
				});

				expect(result.data.signIn).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidCredentialsExtensions>(
								{
									code: "invalid_credentials",
									issues: expect.arrayContaining<
										InvalidCredentialsExtensions["issues"][number]
									>([
										{
											argumentPath: ["input"],
											message: "Invalid email address or password.",
										},
									]),
								},
							),
							message: expect.any(String),
							path: ["signIn"],
						}),
					]),
				);
			});

			test("value of the argument input.password is not equal to the password of the existing user corresponding to the value of the argument input.emailAddress", async () => {
				const result = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: `password${faker.string.ulid()}`,
						},
					},
				});

				expect(result.data.signIn).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidCredentialsExtensions>(
								{
									code: "invalid_credentials",
									issues: expect.arrayContaining<
										InvalidCredentialsExtensions["issues"][number]
									>([
										{
											argumentPath: ["input"],
											message: "Invalid email address or password.",
										},
									]),
								},
							),
							message: expect.any(String),
							path: ["signIn"],
						}),
					]),
				);
			});
		},
	);

	test("results in an empty errors field and the expected value for the data.signIn field.", async () => {
		const variables: VariablesOf<typeof Query_signIn> = {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		};

		const result = await mercuriusClient.query(Query_signIn, {
			variables,
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.signIn).toEqual(
			expect.objectContaining({
				authenticationToken: expect.any(String),
				user: expect.objectContaining({
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				}),
			}),
		);
	});

	test("sign in", async () => {
		const result = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user1Email,
					password: "password",
				},
			},
		});

		assertToBeNonNullish(result.data.signIn?.authenticationToken);

		expect(result.errors).toBeUndefined();
		expect(result.data.signIn).toEqual(
			expect.objectContaining({
				authenticationToken: expect.any(String),
				user: expect.objectContaining({
					emailAddress: user1Email,
				}),
			}),
		);
	});

	test("sign in with invalid arguments", async () => {
		const result = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user1Email,
					password: "",
				},
			},
		});

		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<InvalidArgumentsExtensions>({
						code: "invalid_arguments",
						issues: expect.arrayContaining<
							ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
						>([
							expect.objectContaining({
								argumentPath: ["input", "password"],
								message: "String must contain at least 1 character(s)",
							}),
						]),
					}),
					message: "You have provided invalid arguments for this action.",
					path: ["signIn"],
				}),
			]),
		);
	});
});
