import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_currentUser,
	Query_user,
} from "../documentNodes";

suite("Query field user", () => {
	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.user" field if`,
		() => {
			test(`value of the argument "input.id" is not a valid user global id.`, async () => {
				const userResult = await mercuriusClient.query(Query_user, {
					variables: {
						input: {
							id: "an invalid user global id",
						},
					},
				});

				expect(userResult.data.user).toEqual(null);
				expect(userResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "id"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["user"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.user" field if`,
		() => {
			test(`value of the argument "input.id" doesn't correspond to an existing user.`, async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
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
						authorization: `bearer ${adminToken}`,
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

				const userResult = await mercuriusClient.query(Query_user, {
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				expect(userResult.data.user).toEqual(null);
				expect(userResult.errors).toEqual(
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
							path: ["user"],
						}),
					]),
				);
			});
		},
	);

	test(`results in an empty "errors" field and the expected value for the "data.user" field.`, async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		const adminUser = currentUserResult.data?.currentUser;
		assertToBeNonNullish(adminToken);
		assertToBeNonNullish(adminUser?.id);

		const userResult = await mercuriusClient.query(Query_user, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				input: {
					id: adminUser.id,
				},
			},
		});

		expect(userResult.errors).toBeUndefined();
		expect(userResult.data.user).toEqual(adminUser);
	});
});
