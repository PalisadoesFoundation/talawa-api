import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import { expect, suite, test, vi } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
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
	Mutation_deleteUser,
	Mutation_updateUser,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field updateUser", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
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
				const userId = createUserResult.data.createUser.user.id;

				try {
					const updateUserResult = await mercuriusClient.mutate(
						Mutation_updateUser,
						{
							variables: {
								input: {
									id: userId,
								},
							},
						},
					);

					expect(updateUserResult.data.updateUser).toEqual(null);
					expect(updateUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<UnauthenticatedExtensions>({
									code: "unauthenticated",
								}),
								message: expect.any(String),
								path: ["updateUser"],
							}),
						]),
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: userId,
							},
						},
					});
				}
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

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
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
				const adminToken =
					administratorUserSignInResult.data.signIn.authenticationToken;

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
				const userId = createUserResult.data.createUser.user.id;

				try {
					const updateUserResult = await mercuriusClient.mutate(
						Mutation_updateUser,
						{
							headers: {
								authorization: `bearer ${adminToken}`,
							},
							variables: {
								input: {
									id: userId,
								},
							},
						},
					);

					expect(updateUserResult.data.updateUser).toEqual(null);
					expect(updateUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<InvalidArgumentsExtensions>(
									{
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
									},
								),
								message: expect.any(String),
								path: ["updateUser"],
							}),
						]),
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: userId,
							},
						},
					});
				}
			});

			test(`length of the value of the argument "input.addressLine1" is less than 1.
				length of the value of the argument "input.addressLine2" is less than 1.
	    		length of the value of the argument "input.city" is less than 1.
	    		length of the value of the argument "input.description" is less than 1.
	    		length of the value of the argument "input.name" is less than 1.
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
				const adminToken =
					administratorUserSignInResult.data.signIn.authenticationToken;

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
				const userId = createUserResult.data.createUser.user.id;

				try {
					const updateUserResult = await mercuriusClient.mutate(
						Mutation_updateUser,
						{
							headers: {
								authorization: `bearer ${adminToken}`,
							},
							variables: {
								input: {
									addressLine1: "",
									addressLine2: "",
									city: "",
									description: "",
									id: userId,
									name: "",
									postalCode: "",
									state: "",
								},
							},
						},
					);

					expect(updateUserResult.data.updateUser).toEqual(null);
					expect(updateUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<InvalidArgumentsExtensions>(
									{
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
												argumentPath: ["input", "postalCode"],
												message: expect.any(String),
											},
											{
												argumentPath: ["input", "state"],
												message: expect.any(String),
											},
										]),
									},
								),
								message: expect.any(String),
								path: ["updateUser"],
							}),
						]),
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: userId,
							},
						},
					});
				}
			});

			test(`length of the value of the argument "input.addressLine1" is more than 1025.
				length of the value of the argument "input.addressLine2" is more than 1025.
	    		length of the value of the argument "input.city" is more than 64.
	    		length of the value of the argument "input.description" is more than 2048.
	    		length of the value of the argument "input.name" is more than 256.
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
				const adminToken =
					administratorUserSignInResult.data.signIn.authenticationToken;

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
				const userId = createUserResult.data.createUser.user.id;

				try {
					const updateUserResult = await mercuriusClient.mutate(
						Mutation_updateUser,
						{
							headers: {
								authorization: `bearer ${adminToken}`,
							},
							variables: {
								input: {
									addressLine1: `addressLine1${faker.string.alpha(1025)}`,
									addressLine2: `addressLine2${faker.string.alpha(1025)}`,
									city: `city${faker.string.alpha(65)}`,
									description: `description${faker.string.alpha(2049)}`,
									id: userId,
									name: `name${faker.string.alpha(257)}`,
									postalCode: `postalCode${faker.string.alpha(33)}`,
									state: `state${faker.string.alpha(65)}`,
								},
							},
						},
					);

					expect(updateUserResult.data.updateUser).toEqual(null);
					expect(updateUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<InvalidArgumentsExtensions>(
									{
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
												argumentPath: ["input", "postalCode"],
												message: expect.any(String),
											},
											{
												argumentPath: ["input", "state"],
												message: expect.any(String),
											},
										]),
									},
								),
								message: expect.any(String),
								path: ["updateUser"],
							}),
						]),
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: userId,
							},
						},
					});
				}
			});

			test(`value of the argument "input.emailAddress" is "null".
				value of the argument "input.isEmailAddressVerified" is "null".
				value of the argument "input.name" is "null".
				value of the argument "input.role" is "null".`, async () => {
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
				const userId = createUserResult.data.createUser.user.id;

				try {
					const updateUserResult = await mercuriusClient.mutate(
						Mutation_updateUser,
						{
							headers: {
								authorization: `bearer ${adminToken}`,
							},
							variables: {
								input: {
									emailAddress: null,
									id: userId,
									isEmailAddressVerified: null,
									name: null,
									role: null,
								},
							},
						},
					);

					expect(updateUserResult.data.updateUser).toEqual(null);
					expect(updateUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<InvalidArgumentsExtensions>(
									{
										code: "invalid_arguments",
										issues: expect.arrayContaining<
											InvalidArgumentsExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "emailAddress"],
												message: expect.any(String),
											},
											{
												argumentPath: ["input", "isEmailAddressVerified"],
												message: expect.any(String),
											},
											{
												argumentPath: ["input", "name"],
												message: expect.any(String),
											},
											{
												argumentPath: ["input", "role"],
												message: expect.any(String),
											},
										]),
									},
								),
								message: expect.any(String),
								path: ["updateUser"],
							}),
						]),
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: userId,
							},
						},
					});
				}
			});

			test("should return invalid_arguments when avatar mime type is not allowed", async () => {
				const signIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
				const adminToken = signIn.data.signIn.authenticationToken;

				const createUser = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${adminToken}` },
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

				assertToBeNonNullish(createUser.data?.createUser?.user?.id);
				const userId = createUser.data.createUser.user.id;

				const fakeAvatarMetadata = {
					fileHash:
						"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
					mimeType: "VIDEO_MP4",
					name: "avatar.mp4",
					objectName: "avatar-object-name",
				};

				const statObjectSpy = vi
					.spyOn(server.minio.client, "statObject")
					.mockResolvedValue({
						metaData: { "content-type": "video/mp4" },
						size: 1000,
					} as unknown as Awaited<
						ReturnType<typeof server.minio.client.statObject>
					>);

				try {
					const result = await mercuriusClient.mutate(Mutation_updateUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: userId,
								avatar: fakeAvatarMetadata,
							},
						},
					});
					expect(result.data.updateUser).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "invalid_arguments",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["input", "avatar", "mimeType"],
											message: 'Mime type "video/mp4" is not allowed.',
										}),
									]),
								}),
								path: ["updateUser"],
							}),
						]),
					);
					// Note: statObjectSpy is NOT called because imageMimeTypeEnum.safeParse
					// rejects the mimeType BEFORE statObject is reached in the resolver.
				} finally {
					// cleanup
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: { input: { id: userId } },
					});
					statObjectSpy.mockRestore();
				}
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
		() => {
			test("client triggering the graphql operation is not associated to an administrator user.", async () => {
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
				const userId = createUserResult.data.createUser.user.id;

				try {
					const updateUserResult = await mercuriusClient.mutate(
						Mutation_updateUser,
						{
							headers: {
								authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
							},
							variables: {
								input: {
									addressLine1: null,
									id: userId,
								},
							},
						},
					);

					expect(updateUserResult.data.updateUser).toEqual(null);
					expect(updateUserResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions:
									expect.objectContaining<UnauthorizedActionExtensions>({
										code: "unauthorized_action",
									}),
								message: expect.any(String),
								path: ["updateUser"],
							}),
						]),
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: userId,
							},
						},
					});
				}
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
		() => {
			test(`value of the argument "input.id" is equal to the id of the user associated to the client triggering the graphql operation.`, async () => {
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

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn.user?.id,
				);

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
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
							path: ["updateUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.updateUser" field if`,
		() => {
			test(`value of the argument "input.id" doesn't correspond to an existing user.`, async () => {
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

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
								name: "name",
							},
						},
					},
				);

				expect(updateUserResult.data.updateUser).toEqual(null);
				expect(updateUserResult.errors).toEqual(
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
							path: ["updateUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in "undefined" as the value of "errors" field and the expected value for the "data.updateUser" field where`,
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
				const adminToken =
					administratorUserSignInResult.data.signIn.authenticationToken;

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
							authorization: `bearer ${adminToken}`,
						},
						variables: createUserVariables,
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);
				const userId = createUserResult.data.createUser.user.id;

				try {
					const updateUserVariables: VariablesOf<typeof Mutation_updateUser> = {
						input: {
							addressLine1: null,
							addressLine2: null,
							birthDate: null,
							city: null,
							countryCode: null,
							description: null,
							educationGrade: null,
							emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
							employmentStatus: null,
							homePhoneNumber: null,
							id: userId,
							isEmailAddressVerified: true,
							maritalStatus: null,
							mobilePhoneNumber: null,
							name: "new name",
							natalSex: null,
							postalCode: null,
							role: "administrator",
							state: null,
							workPhoneNumber: null,
						},
					};

					const updateUserResult = await mercuriusClient.mutate(
						Mutation_updateUser,
						{
							headers: {
								authorization: `bearer ${adminToken}`,
							},
							variables: updateUserVariables,
						},
					);

					expect(updateUserResult.errors).toBeUndefined();
					expect(updateUserResult.data.updateUser).toEqual(
						expect.objectContaining<
							Partial<ResultOf<typeof Mutation_updateUser>["updateUser"]>
						>({
							addressLine1: updateUserVariables.input.addressLine1,
							addressLine2: updateUserVariables.input.addressLine2,
							avatarURL: null,
							birthDate: updateUserVariables.input.birthDate,
							city: updateUserVariables.input.city,
							countryCode: updateUserVariables.input.countryCode,
							createdAt: expect.any(String),
							description: updateUserVariables.input.description,
							educationGrade: updateUserVariables.input.educationGrade,
							emailAddress: updateUserVariables.input.emailAddress,
							employmentStatus: updateUserVariables.input.employmentStatus,
							homePhoneNumber: updateUserVariables.input.homePhoneNumber,
							id: expect.any(String),
							isEmailAddressVerified:
								updateUserVariables.input.isEmailAddressVerified,
							maritalStatus: updateUserVariables.input.maritalStatus,
							mobilePhoneNumber: updateUserVariables.input.mobilePhoneNumber,
							name: updateUserVariables.input.name,
							natalSex: updateUserVariables.input.natalSex,
							postalCode: updateUserVariables.input.postalCode,
							role: updateUserVariables.input.role,
							state: updateUserVariables.input.state,
							workPhoneNumber: updateUserVariables.input.workPhoneNumber,
						}),
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								id: userId,
							},
						},
					});
				}
			});

			test("should update user successfully when optional fields are omitted", async () => {
				const signIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
				const adminToken = signIn.data.signIn.authenticationToken;

				const createUser = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${adminToken}` },
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
				assertToBeNonNullish(createUser.data?.createUser?.user?.id);
				const userId = createUser.data.createUser.user.id;

				try {
					const result = await mercuriusClient.mutate(Mutation_updateUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: userId,
								name: "updated name",
							},
						},
					});

					expect(result.errors).toBeUndefined();
					assertToBeNonNullish(result.data?.updateUser);
					expect(result.data.updateUser.name).toBe("updated name");
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: { input: { id: userId } },
					});
				}
			});

			test("should update user and avatar successfully when avatar is provided", async () => {
				const signIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
				const adminToken = signIn.data.signIn.authenticationToken;

				const createUser = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${adminToken}` },
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
				assertToBeNonNullish(createUser.data?.createUser?.user?.id);
				const userId = createUser.data.createUser.user.id;

				const statObjectSpy = vi.spyOn(server.minio.client, "statObject");

				try {
					statObjectSpy.mockResolvedValue(
						{} as Awaited<ReturnType<typeof server.minio.client.statObject>>,
					);

					const avatarInput = {
						fileHash:
							"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
						mimeType: "IMAGE_JPEG",
						name: "test.jpg",
						objectName: "minio-object-id",
					};

					const result = await mercuriusClient.mutate(Mutation_updateUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: userId,
								avatar: avatarInput,
							},
						},
					});

					expect(result.errors).toBeUndefined();
					assertToBeNonNullish(result.data?.updateUser);
					expect(result.data.updateUser.avatarURL).not.toBeNull();
					expect(result.data.updateUser.avatarMimeType).toBe("image/jpeg");

					expect(statObjectSpy).toHaveBeenCalledWith(
						server.minio.bucketName,
						avatarInput.objectName,
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: { input: { id: userId } },
					});

					statObjectSpy.mockRestore();
				}
			});

			test("should update user and remove avatar successfully when avatar is explicitly set to null", async () => {
				const signIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
				const adminToken = signIn.data.signIn.authenticationToken;

				const createUser = await mercuriusClient.mutate(Mutation_createUser, {
					headers: { authorization: `bearer ${adminToken}` },
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
				assertToBeNonNullish(createUser.data?.createUser?.user?.id);
				const userId = createUser.data.createUser.user.id;

				const statObjectSpy = vi.spyOn(server.minio.client, "statObject");
				const removeObjectSpy = vi.spyOn(server.minio.client, "removeObject");

				try {
					// 1. Give them an avatar first
					statObjectSpy.mockResolvedValue(
						{} as Awaited<ReturnType<typeof server.minio.client.statObject>>,
					);

					const avatarInput = {
						fileHash:
							"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
						mimeType: "IMAGE_JPEG",
						name: "test.jpg",
						objectName: "minio-object-id",
					};

					await mercuriusClient.mutate(Mutation_updateUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: userId,
								avatar: avatarInput,
							},
						},
					});

					removeObjectSpy.mockResolvedValue(
						undefined as Awaited<
							ReturnType<typeof server.minio.client.removeObject>
						>,
					);

					// 2. Remove the avatar explicitly
					const result = await mercuriusClient.mutate(Mutation_updateUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								id: userId,
								avatar: null,
							},
						},
					});

					expect(result.errors).toBeUndefined();
					assertToBeNonNullish(result.data?.updateUser);
					expect(result.data.updateUser.avatarURL).toBeNull();

					// Verify the old avatar was deleted
					expect(removeObjectSpy).toHaveBeenCalledWith(
						server.minio.bucketName,
						avatarInput.objectName,
					);
				} finally {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminToken}` },
						variables: { input: { id: userId } },
					});

					statObjectSpy.mockRestore();
					removeObjectSpy.mockRestore();
				}
			});
		},
	);

	suite("Avatar MinIO error handling", () => {
		test("returns invalid_arguments error when avatar file is not found in MinIO", async () => {
			const signIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
			const adminToken = signIn.data.signIn.authenticationToken;

			const createUser = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
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
			assertToBeNonNullish(createUser.data?.createUser?.user?.id);
			const userId = createUser.data.createUser.user.id;

			const notFoundError = new Error("Not Found");
			notFoundError.name = "NotFound";

			const statObjectSpy = vi
				.spyOn(server.minio.client, "statObject")
				.mockRejectedValue(notFoundError);

			try {
				const result = await mercuriusClient.mutate(Mutation_updateUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: userId,
							avatar: {
								objectName: "nonexistent-file.jpg",
								mimeType: "IMAGE_JPEG",
								fileHash:
									"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
								name: "test.jpg",
							},
						},
					},
				});

				expect(result.data.updateUser).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
				expect(
					(result.errors?.[0]?.extensions as InvalidArgumentsExtensions)
						?.issues,
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "avatar", "objectName"],
							message: expect.stringContaining("File not found"),
						}),
					]),
				);
			} finally {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: userId } },
				});
				statObjectSpy.mockRestore();
			}
		});

		test("returns unexpected error when MinIO throws a non-NotFound error", async () => {
			const signIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
			const adminToken = signIn.data.signIn.authenticationToken;

			const createUser = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
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
			assertToBeNonNullish(createUser.data?.createUser?.user?.id);
			const userId = createUser.data.createUser.user.id;

			const statObjectSpy = vi
				.spyOn(server.minio.client, "statObject")
				.mockRejectedValue(new Error("Connection refused"));

			try {
				const result = await mercuriusClient.mutate(Mutation_updateUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: userId,
							avatar: {
								objectName: "test-file.jpg",
								mimeType: "IMAGE_JPEG",
								fileHash:
									"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
								name: "test.jpg",
							},
						},
					},
				});

				expect(result.data.updateUser).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
			} finally {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: userId } },
				});
				statObjectSpy.mockRestore();
			}
		});

		test("returns arguments_associated_resources_not_found when updating a non-existent user", async () => {
			const signIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
			const adminToken = signIn.data.signIn.authenticationToken;

			// Create a real user so we have a valid ID format
			const createUser = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
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
			assertToBeNonNullish(createUser.data?.createUser?.user?.id);
			const userId = createUser.data.createUser.user.id;

			// Delete the user so they no longer exist
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});

			// Now try to update the deleted user — should get not-found
			const result = await mercuriusClient.mutate(Mutation_updateUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: userId,
						name: "new name",
					},
				},
			});

			expect(result.data.updateUser).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
			expect(
				(
					result.errors?.[0]
						?.extensions as ArgumentsAssociatedResourcesNotFoundExtensions
				)?.issues,
			).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						argumentPath: ["input", "id"],
					}),
				]),
			);
		});
		test("returns arguments_associated_resources_not_found when user is deleted during transaction (race condition)", async () => {
			const signIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(signIn.data?.signIn?.authenticationToken);
			const adminToken = signIn.data.signIn.authenticationToken;

			const createUser = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
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
			assertToBeNonNullish(createUser.data?.createUser?.user?.id);
			const userId = createUser.data.createUser.user.id;

			// Mock the transaction so `tx.update().set().where().returning()` returns [] (empty)
			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (fn) => {
					const fakeTx = {
						update: () => ({
							set: () => ({
								where: () => ({
									returning: async () => [],
								}),
							}),
						}),
					};
					return await fn(fakeTx);
				}) as unknown as typeof server.drizzleClient.transaction;

			try {
				const result = await mercuriusClient.mutate(Mutation_updateUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							id: userId,
							name: "updated name",
						},
					},
				});

				expect(result.data.updateUser).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe(
					"arguments_associated_resources_not_found",
				);
				expect(
					(
						result.errors?.[0]
							?.extensions as ArgumentsAssociatedResourcesNotFoundExtensions
					)?.issues,
				).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["input", "id"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.transaction = originalTransaction;

				// Clean up the created user
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: userId } },
				});
			}
		});
	});
});
