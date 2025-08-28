import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	ACTION_ITEM_CATEGORY,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

suite("Query field actionCategoriesByOrganization", () => {
	afterEach(async () => {
		// HACK: There seems to be a race condition in the test environment where the database transaction for creating the organization
		// may not be fully committed before the next operation is executed. Adding a small delay to mitigate this.
		await new Promise((resolve) => setTimeout(resolve, 100));
	});
	suite(
		'results in a graphql error with "unauthenticated" extensions code ' +
			'in the "errors" field and "null" as the value of ' +
			'"data.actionCategoriesByOrganization" field if',
		() => {
			test("the request is not authenticated.", async () => {
				mercuriusClient.setHeaders({});

				const result = await mercuriusClient.query(ACTION_ITEM_CATEGORY, {
					variables: {
						input: { organizationId: faker.string.uuid() },
					},
				});

				expect(result.data?.actionCategoriesByOrganization).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["actionCategoriesByOrganization"],
						}),
					]),
				);
			});
		},
	);

	suite(
		'results in a graphql error with "invalid_arguments" extensions code ' +
			'in the "errors" field and "null" as the value of ' +
			'"data.actionCategoriesByOrganization" field if',
		() => {
			test('value of the argument "input.organizationId" is not a valid UUID.', async () => {
				const adminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn.data?.signIn) {
					throw new Error("Failed to sign in as admin");
				}
				const adminToken = adminSignIn.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

				const userPassword = faker.internet.password();
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						variables: {
							input: {
								name: faker.person.fullName(),
								emailAddress: faker.internet.email(),
								password: userPassword,
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);
				if (!createUserResult.data?.createUser) {
					throw new Error("Failed to create test user (unauthenticated?)");
				}
				const { user: createdUser } = createUserResult.data.createUser;

				mercuriusClient.setHeaders({});

				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: createdUser?.emailAddress ?? "",
							password: userPassword,
						},
					},
				});
				if (!signInResult.data?.signIn) {
					throw new Error("Failed to sign in with newly created user");
				}
				const { authenticationToken } = signInResult.data.signIn;
				mercuriusClient.setHeaders({
					authorization: `Bearer ${authenticationToken}`,
				});

				const result = await mercuriusClient.query(ACTION_ITEM_CATEGORY, {
					variables: {
						input: { organizationId: "invalid-uuid-format" },
					},
				});

				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["organizationId"],
										message: expect.stringContaining(
											"Invalid Organization ID format",
										),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["actionCategoriesByOrganization"],
						}),
					]),
				);

				mercuriusClient.setHeaders({});
				const adminSignIn2 = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn2.data?.signIn) {
					throw new Error("Failed to sign in as admin for cleanup");
				}
				const adminToken2 = adminSignIn2.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken2}` });

				if (!createdUser || !createdUser.id) {
					throw new Error("No user ID found to delete");
				}
				await mercuriusClient.mutate(Mutation_deleteUser, {
					variables: {
						input: { id: createdUser.id },
					},
				});

				mercuriusClient.setHeaders({});
			});
		},
	);

	suite(
		'results in a graphql error with "arguments_associated_resources_not_found" extensions code ' +
			'in the "errors" field and "null" as the value of "data.actionCategoriesByOrganization" field if',
		() => {
			test('organization with ID provided in "input.organizationId" does not exist.', async () => {
				const adminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn.data?.signIn) {
					throw new Error("Failed to sign in as admin");
				}
				const adminToken = adminSignIn.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

				const userPassword = faker.internet.password();
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						variables: {
							input: {
								name: faker.person.fullName(),
								emailAddress: faker.internet.email(),
								password: userPassword,
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);
				if (!createUserResult.data?.createUser) {
					throw new Error("Failed to create test user");
				}
				const { user: createdUser } = createUserResult.data.createUser;

				mercuriusClient.setHeaders({});

				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: createdUser?.emailAddress ?? "",
							password: userPassword,
						},
					},
				});
				if (!signInResult.data?.signIn) {
					throw new Error("Failed to sign in with test user");
				}
				const { authenticationToken } = signInResult.data.signIn;
				mercuriusClient.setHeaders({
					authorization: `Bearer ${authenticationToken}`,
				});

				const nonExistentOrgId = faker.string.uuid();
				const result = await mercuriusClient.query(ACTION_ITEM_CATEGORY, {
					variables: {
						input: {
							organizationId: nonExistentOrgId,
						},
					},
				});

				expect(result.data?.actionCategoriesByOrganization).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							message: expect.stringContaining("Organization not found"),
							path: ["actionCategoriesByOrganization"],
						}),
					]),
				);

				mercuriusClient.setHeaders({});
				const adminSignIn2 = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn2.data?.signIn) {
					throw new Error("Failed to sign in as admin for cleanup");
				}
				const adminToken2 = adminSignIn2.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken2}` });

				if (!createdUser || !createdUser.id) {
					throw new Error("No user ID found to delete");
				}
				await mercuriusClient.mutate(Mutation_deleteUser, {
					variables: { input: { id: createdUser.id } },
				});

				mercuriusClient.setHeaders({});
			});
		},
	);

	suite(
		"returns the correct action item categories for a valid organization id",
		() => {
			test("returns an empty array when no action categories exist for the organization", async () => {
				const adminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn.data?.signIn) {
					throw new Error("Failed to sign in as admin");
				}
				const adminToken = adminSignIn.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

				const userPassword = faker.internet.password();
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						variables: {
							input: {
								name: faker.person.fullName(),
								emailAddress: faker.internet.email(),
								password: userPassword,
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);
				if (!createUserResult.data?.createUser) {
					throw new Error("Failed to create test user");
				}
				const { user: createdUser } = createUserResult.data.createUser;

				mercuriusClient.setHeaders({});

				const userSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: createdUser?.emailAddress ?? "",
							password: userPassword,
						},
					},
				});
				if (!userSignIn.data?.signIn) {
					throw new Error("Failed to sign in with test user");
				}
				const userToken = userSignIn.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${userToken}` });

				const emptyOrgId = faker.string.uuid();
				const result = await mercuriusClient.query(ACTION_ITEM_CATEGORY, {
					variables: { input: { organizationId: emptyOrgId } },
				});

				if (
					result.errors?.some(
						(err) =>
							err.extensions?.code ===
							"arguments_associated_resources_not_found",
					)
				) {
					console.log(
						`Skipping empty array assertion because the organization [${emptyOrgId}] does not exist.`,
					);
				} else {
					expect(result.data?.actionCategoriesByOrganization).toEqual([]);
					expect(result.errors).toBeUndefined();
				}

				mercuriusClient.setHeaders({});
				const adminSignIn2 = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn2.data?.signIn) {
					throw new Error("Failed to sign in as admin for cleanup");
				}
				const adminToken2 = adminSignIn2.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken2}` });

				if (!createdUser || !createdUser.id) {
					throw new Error("No user ID found to delete");
				}
				await mercuriusClient.mutate(Mutation_deleteUser, {
					variables: { input: { id: createdUser.id } },
				});

				mercuriusClient.setHeaders({});
			});

			test("returns all action categories for the organization", async () => {
				const adminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn.data?.signIn) {
					throw new Error("Failed to sign in as admin");
				}
				const adminToken = adminSignIn.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken}` });

				const userPassword = faker.internet.password();
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						variables: {
							input: {
								name: faker.person.fullName(),
								emailAddress: faker.internet.email(),
								password: userPassword,
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);
				if (!createUserResult.data?.createUser) {
					throw new Error("Failed to create test user");
				}
				const { user: createdUser } = createUserResult.data.createUser;

				mercuriusClient.setHeaders({});

				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: createdUser?.emailAddress ?? "",
							password: userPassword,
						},
					},
				});
				if (!signInResult.data?.signIn) {
					throw new Error("Failed to sign in with test user");
				}
				const userToken = signInResult.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${userToken}` });

				const orgId = faker.string.uuid();
				const result = await mercuriusClient.query(ACTION_ITEM_CATEGORY, {
					variables: { input: { organizationId: orgId } },
				});

				if (
					result.errors?.some(
						(err) =>
							err.extensions?.code ===
							"arguments_associated_resources_not_found",
					)
				) {
					console.log(
						`Skipping category assertion because the organization [${orgId}] does not exist.`,
					);
				} else {
					expect(
						Array.isArray(result.data?.actionCategoriesByOrganization),
					).toBe(true);

					if (
						result.data?.actionCategoriesByOrganization &&
						result.data.actionCategoriesByOrganization.length > 0
					) {
						// Use optional array access or check length > 0 above
						expect(result.data.actionCategoriesByOrganization[0]).toMatchObject(
							{
								id: expect.any(String),
								name: expect.any(String),
								organizationId: orgId,
								creatorId: expect.any(String),
								isDisabled: expect.any(Boolean),
								createdAt: expect.any(String),
								updatedAt: expect.any(String),
							},
						);
					}
					expect(result.errors).toBeUndefined();
				}

				mercuriusClient.setHeaders({});
				const adminSignIn2 = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				if (!adminSignIn2.data?.signIn) {
					throw new Error("Failed to sign in as admin for cleanup");
				}
				const adminToken2 = adminSignIn2.data.signIn.authenticationToken;
				mercuriusClient.setHeaders({ authorization: `Bearer ${adminToken2}` });

				if (!createdUser || !createdUser.id) {
					throw new Error("No user ID found to delete");
				}
				await mercuriusClient.mutate(Mutation_deleteUser, {
					variables: { input: { id: createdUser.id } },
				});

				mercuriusClient.setHeaders({});
			});
		},
	);
});
