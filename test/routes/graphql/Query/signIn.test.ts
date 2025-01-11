import { faker } from "@faker-js/faker";
import type { VariablesOf } from "gql.tada";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn } from "../documentNodes";

suite("Query field signIn", () => {
	suite(
		`results in a graphql error with "forbidden_action" extensions code in the "errors" field and "null" as the value of "data.signIn" field if`,
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
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.signIn" field if`,
		() => {
			test(`value of the "input.emailAddress" does not correspond to an existing user.`, async () => {
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
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "emailAddress"],
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

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.signIn" field if`,
		() => {
			test(`value of the argument "input.password" is not equal to the password of the existing user corresponding to the value of the argument "input.emailAddress".`, async () => {
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
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "password"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["signIn"],
						}),
					]),
				);
			});
		},
	);

	test(`results in an empty "errors" field and the expected value for the "data.signIn" field.`, async () => {
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
});
