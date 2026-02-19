import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionOnArgumentsAssociatedResourcesExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_createUser, Mutation_deleteUser } from "../documentNodes";

const SUITE_TIMEOUT = 40_000;

suite("Mutation field deleteUser", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.deleteUser" field if`,
		() => {
			test(
				"client triggering the graphql operation is not authenticated.",
				async () => {
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
									emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
									isEmailAddressVerified: false,
									name: "name",
									password: "password",
									role: "regular",
								},
							},
						},
					);

					assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

					const deleteUserResult = await mercuriusClient.mutate(
						Mutation_deleteUser,
						{
							variables: {
								input: {
									id: createUserResult.data.createUser.user.id,
								},
							},
						},
					);

					expect(deleteUserResult.data.deleteUser).toEqual(null);
					expect(deleteUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<UnauthenticatedExtensions>({
									code: "unauthenticated",
								}),
								message: expect.any(String),
								path: ["deleteUser"],
							}),
						]),
					);
				},
				SUITE_TIMEOUT,
			);

			test(
				"client triggering the graphql operation has no existing user associated to their authentication context.",
				async () => {
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

					const deleteUserResult = await mercuriusClient.mutate(
						Mutation_deleteUser,
						{
							headers: {
								authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
							},
							variables: {
								input: {
									id: createUserResult.data.createUser.user.id,
								},
							},
						},
					);

					expect(deleteUserResult.data.deleteUser).toEqual(null);
					expect(deleteUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<UnauthenticatedExtensions>({
									code: "unauthenticated",
								}),
								message: expect.any(String),
								path: ["deleteUser"],
							}),
						]),
					);
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.deleteUser" field if`,
		() => {
			test(
				`value of the argument "input.id" is not a valid user global id.`,
				async () => {
					const { accessToken: adminToken } = await getAdminAuthViaRest(server);
					assertToBeNonNullish(adminToken);

					const deleteUserResult = await mercuriusClient.mutate(
						Mutation_deleteUser,
						{
							headers: {
								authorization: `bearer ${adminToken}`,
							},
							variables: {
								input: {
									id: "an invalid user global id",
								},
							},
						},
					);

					expect(deleteUserResult.data.deleteUser).toEqual(null);
					expect(deleteUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<InvalidArgumentsExtensions>(
									{
										code: "invalid_arguments",
										issues: expect.arrayContaining<
											InvalidArgumentsExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "id"],
												message: expect.any(String),
											},
										]),
									},
								),
								message: expect.any(String),
								path: ["deleteUser"],
							}),
						]),
					);
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.deleteUser" field if`,
		() => {
			test(
				"client triggering the graphql operation is not associated to an administrator user.",
				async () => {
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

					assertToBeNonNullish(
						createUserResult.data.createUser?.authenticationToken,
					);
					assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

					const deleteUserResult = await mercuriusClient.mutate(
						Mutation_deleteUser,
						{
							headers: {
								authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
							},
							variables: {
								input: {
									id: createUserResult.data.createUser.user.id,
								},
							},
						},
					);

					expect(deleteUserResult.data.deleteUser).toEqual(null);
					expect(deleteUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions:
									expect.objectContaining<UnauthorizedActionExtensions>({
										code: "unauthorized_action",
									}),
								message: expect.any(String),
								path: ["deleteUser"],
							}),
						]),
					);
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.deleteUser" field if`,
		() => {
			test(
				`value of the argument "input.id" is equal to the id of the user associated to the client triggering the graphql operation.`,
				async () => {
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
									role: "administrator",
								},
							},
						},
					);

					assertToBeNonNullish(
						createUserResult.data.createUser?.authenticationToken,
					);

					assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

					const deleteUserResult = await mercuriusClient.mutate(
						Mutation_deleteUser,
						{
							headers: {
								authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
							},
							variables: {
								input: {
									id: createUserResult.data.createUser.user.id,
								},
							},
						},
					);

					expect(deleteUserResult.data.deleteUser).toEqual(null);
					expect(deleteUserResult.errors).toEqual(
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
													argumentPath: ["input", "id"],
													message: expect.any(String),
												},
											]),
										},
									),
								message: expect.any(String),
								path: ["deleteUser"],
							}),
						]),
					);
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.deleteUser" field if`,
		() => {
			test(
				`value of the argument "input.id" doesn't correspond to an existing user.`,
				async () => {
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

					const deleteUserResult = await mercuriusClient.mutate(
						Mutation_deleteUser,
						{
							headers: {
								authorization: `bearer ${adminToken}`,
							},
							variables: {
								input: {
									id: createUserResult.data.createUser.user.id,
								},
							},
						},
					);

					expect(deleteUserResult.data.deleteUser).toEqual(null);
					expect(deleteUserResult.errors).toEqual(
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
								path: ["deleteUser"],
							}),
						]),
					);
				},
				SUITE_TIMEOUT,
			);
		},
	);

	test(
		`results in an empty "errors" field and the expected value for the "data.deleteUser" field.`,
		async () => {
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

			const deleteUserResult = await mercuriusClient.mutate(
				Mutation_deleteUser,
				{
					headers: {
						authorization: `bearer ${adminToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				},
			);

			expect(deleteUserResult.errors).toBeUndefined();
			expect(deleteUserResult.data.deleteUser).toEqual(
				createUserResult.data.createUser.user,
			);
		},
		SUITE_TIMEOUT,
	);
});
