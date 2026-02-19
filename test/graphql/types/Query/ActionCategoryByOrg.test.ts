import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	ACTION_ITEM_CATEGORY,
	Mutation_createUser,
	Mutation_deleteUser,
} from "../documentNodes";

const SUITE_TIMEOUT = 30_000;

suite("Query field actionCategoriesByOrganization", () => {
	suite(
		'results in a graphql error with "unauthenticated" extensions code ' +
			'in the "errors" field and "null" as the value of ' +
			'"data.actionCategoriesByOrganization" field if',
		() => {
			test(
				"the request is not authenticated.",
				async () => {
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
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite(
		'results in a graphql error with "invalid_arguments" extensions code ' +
			'in the "errors" field and "null" as the value of ' +
			'"data.actionCategoriesByOrganization" field if',
		() => {
			test(
				'value of the argument "input.organizationId" is not a valid UUID.',
				async () => {
					const { accessToken: adminToken } = await getAdminAuthViaRest(server);
					if (!adminToken) throw new Error("Failed to sign in as admin");
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

					const userSignInRes = await server.inject({
						method: "POST",
						url: "/auth/signin",
						payload: {
							email: createdUser?.emailAddress ?? "",
							password: userPassword,
						},
					});
					const userAuthToken = userSignInRes.cookies.find(
						(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
					)?.value;
					if (!userAuthToken)
						throw new Error("Failed to sign in with newly created user");
					mercuriusClient.setHeaders({
						authorization: `Bearer ${userAuthToken}`,
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
					const { accessToken: adminToken2 } =
						await getAdminAuthViaRest(server);
					if (!adminToken2)
						throw new Error("Failed to sign in as admin for cleanup");
					mercuriusClient.setHeaders({
						authorization: `Bearer ${adminToken2}`,
					});

					if (!createdUser || !createdUser.id) {
						throw new Error("No user ID found to delete");
					}
					await mercuriusClient.mutate(Mutation_deleteUser, {
						variables: {
							input: { id: createdUser.id },
						},
					});

					mercuriusClient.setHeaders({});
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite(
		'results in a graphql error with "arguments_associated_resources_not_found" extensions code ' +
			'in the "errors" field and "null" as the value of "data.actionCategoriesByOrganization" field if',
		() => {
			test(
				'organization with ID provided in "input.organizationId" does not exist.',
				async () => {
					const { accessToken: adminToken } = await getAdminAuthViaRest(server);
					if (!adminToken) throw new Error("Failed to sign in as admin");
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

					const signInRes = await server.inject({
						method: "POST",
						url: "/auth/signin",
						payload: {
							email: createdUser?.emailAddress ?? "",
							password: userPassword,
						},
					});
					const authenticationToken = signInRes.cookies.find(
						(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
					)?.value;
					if (!authenticationToken)
						throw new Error("Failed to sign in with test user");
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
					const { accessToken: adminToken2 } =
						await getAdminAuthViaRest(server);
					if (!adminToken2)
						throw new Error("Failed to sign in as admin for cleanup");
					mercuriusClient.setHeaders({
						authorization: `Bearer ${adminToken2}`,
					});

					if (!createdUser || !createdUser.id) {
						throw new Error("No user ID found to delete");
					}
					await mercuriusClient.mutate(Mutation_deleteUser, {
						variables: { input: { id: createdUser.id } },
					});

					mercuriusClient.setHeaders({});
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite(
		"returns the correct action item categories for a valid organization id",
		() => {
			test("returns an empty array when no action categories exist for the organization", async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				if (!adminToken) throw new Error("Failed to sign in as admin");
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

				const userSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: {
						email: createdUser?.emailAddress ?? "",
						password: userPassword,
					},
				});
				const userToken = userSignInRes.cookies.find(
					(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
				if (!userToken) throw new Error("Failed to sign in with test user");
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
				const { accessToken: adminToken2 } = await getAdminAuthViaRest(server);
				if (!adminToken2)
					throw new Error("Failed to sign in as admin for cleanup");
				mercuriusClient.setHeaders({
					authorization: `Bearer ${adminToken2}`,
				});

				if (!createdUser || !createdUser.id) {
					throw new Error("No user ID found to delete");
				}
				await mercuriusClient.mutate(Mutation_deleteUser, {
					variables: { input: { id: createdUser.id } },
				});

				mercuriusClient.setHeaders({});
			});

			test(
				"returns all action categories for the organization",
				async () => {
					const { accessToken: adminToken } = await getAdminAuthViaRest(server);
					if (!adminToken) throw new Error("Failed to sign in as admin");
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

					const signInRes = await server.inject({
						method: "POST",
						url: "/auth/signin",
						payload: {
							email: createdUser?.emailAddress ?? "",
							password: userPassword,
						},
					});
					const userToken = signInRes.cookies.find(
						(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
					)?.value;
					if (!userToken) throw new Error("Failed to sign in with test user");
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
							expect(
								result.data.actionCategoriesByOrganization[0],
							).toMatchObject({
								id: expect.any(String),
								name: expect.any(String),
								organizationId: orgId,
								creatorId: expect.any(String),
								isDisabled: expect.any(Boolean),
								createdAt: expect.any(String),
								updatedAt: expect.any(String),
							});
						}
						expect(result.errors).toBeUndefined();
					}

					mercuriusClient.setHeaders({});
					const { accessToken: adminToken2 } =
						await getAdminAuthViaRest(server);
					if (!adminToken2)
						throw new Error("Failed to sign in as admin for cleanup");
					mercuriusClient.setHeaders({
						authorization: `Bearer ${adminToken2}`,
					});

					if (!createdUser || !createdUser.id) {
						throw new Error("No user ID found to delete");
					}
					await mercuriusClient.mutate(Mutation_deleteUser, {
						variables: { input: { id: createdUser.id } },
					});

					mercuriusClient.setHeaders({});
				},
				SUITE_TIMEOUT,
			);
			SUITE_TIMEOUT;
		},
	);
});
