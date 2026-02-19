import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteCurrentUser,
	Mutation_deleteUser,
} from "../documentNodes";

suite("Mutation field deleteCurrentUser", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.deleteCurrentUser" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const deleteCurrentUserResult = await mercuriusClient.mutate(
					Mutation_deleteCurrentUser,
				);

				expect(deleteCurrentUserResult.data.deleteCurrentUser).toEqual(null);
				expect(deleteCurrentUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["deleteCurrentUser"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
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

				const deleteCurrentUserResult = await mercuriusClient.mutate(
					Mutation_deleteCurrentUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
					},
				);

				expect(deleteCurrentUserResult.data.deleteCurrentUser).toEqual(null);
				expect(deleteCurrentUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["deleteCurrentUser"],
						}),
					]),
				);
			});
		},
	);

	test(`results in an empty "errors" field and the expected value for the "data.deleteCurrentUser" field.`, async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(adminToken);

		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
		});

		assertToBeNonNullish(createUserResult.data.createUser?.authenticationToken);

		const deleteCurrentUserResult = await mercuriusClient.mutate(
			Mutation_deleteCurrentUser,
			{
				headers: {
					authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
				},
			},
		);

		assertToBeNonNullish(createUserResult.data.createUser.user);

		expect(deleteCurrentUserResult.errors).toBeUndefined();
		expect(deleteCurrentUserResult.data.deleteCurrentUser?.id).toEqual(
			createUserResult.data.createUser.user.id,
		);
	});
});
