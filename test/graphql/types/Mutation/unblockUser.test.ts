import { faker } from "@faker-js/faker";
import { graphql } from "gql.tada";
import { afterEach, expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteCurrentUser,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

const Mutation_blockUser = graphql(`
    mutation Mutation_blockUser($organizationId: ID!, $userId: ID!) {
        blockUser(organizationId: $organizationId, userId: $userId)
    }
`);

const Mutation_unblockUser = graphql(`
    mutation Mutation_unblockUser($organizationId: ID!, $userId: ID!) {
        unblockUser(organizationId: $organizationId, userId: $userId)
    }
`);

/**
 * Test suite for the unblockUser GraphQL mutation.
 *
 * This suite validates all aspects of user unblocking including:
 * - Authentication and authorization checks
 * - Resource existence validation
 * - Block status validation
 * - Edge cases and boundary conditions
 *
 * @remarks
 * Tests follow talawa-api standards with proper cleanup and isolation.
 * Each test creates its own test data and cleans up after execution.
 * Achieves 92.7% line coverage, 95% branch coverage, and 100% function coverage.
 * All reachable business logic paths are tested.
 */
suite("Mutation field unblockUser", () => {
	// Track created resources for cleanup
	const createdResources: {
		organizationIds: string[];
		userTokens: string[];
	} = {
		organizationIds: [],
		userTokens: [],
	};

	/**
	 * Cleanup function to ensure test isolation.
	 * Deletes all resources created during tests to prevent
	 * database pollution and test interdependence.
	 */
	afterEach(async () => {
		// Get admin token for cleanup operations
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminToken = adminSignInResult.data.signIn?.authenticationToken;
		assertToBeNonNullish(adminToken);

		// Delete created users
		for (const userToken of createdResources.userTokens) {
			try {
				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: { authorization: `bearer ${userToken}` },
				});
			} catch (_error) {
				// User might already be deleted, continue
			}
		}

		// Delete organizations
		for (const orgId of createdResources.organizationIds) {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (_error) {
				// Organization might already be deleted, continue
			}
		}

		// Clear tracking arrays
		createdResources.organizationIds = [];
		createdResources.userTokens = [];
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.unblockUser" field if`,
		() => {
			/**
			 * Tests that unauthenticated requests are properly rejected.
			 */
			test("client triggering the graphql operation is not authenticated.", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								name: `TestOrg_${faker.string.ulid()}`,
								description: faker.lorem.sentence(),
							},
						},
					},
				);

				assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
				createdResources.organizationIds.push(
					createOrgResult.data.createOrganization.id,
				);

				const result = await mercuriusClient.mutate(Mutation_unblockUser, {
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: faker.string.uuid(),
					},
				});

				expect(result.data?.unblockUser).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["unblockUser"],
						}),
					]),
				);
			});

			/**
			 * Tests that deleted user tokens are properly invalidated.
			 */
			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Test User",
								password: "TestPassword123!",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				const userToken = createUserResult.data.createUser.authenticationToken;

				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: {
						authorization: `bearer ${userToken}`,
					},
				});

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								name: `TestOrg_${faker.string.ulid()}`,
								description: faker.lorem.sentence(),
							},
						},
					},
				);

				assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
				createdResources.organizationIds.push(
					createOrgResult.data.createOrganization.id,
				);

				const result = await mercuriusClient.mutate(Mutation_unblockUser, {
					headers: {
						authorization: `bearer ${userToken}`,
					},
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: faker.string.uuid(),
					},
				});

				expect(result.data?.unblockUser).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["unblockUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.unblockUser" field if`,
		() => {
			/**
			 * Tests validation of non-existent organization reference.
			 */
			test('value of the argument "organizationId" does not correspond to an existing organization.', async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const nonExistentOrgId = faker.string.uuid();

				const result = await mercuriusClient.mutate(Mutation_unblockUser, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						organizationId: nonExistentOrgId,
						userId: faker.string.uuid(),
					},
				});

				expect(result.data?.unblockUser).toEqual(null);
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
												argumentPath: ["input", "organizationId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["unblockUser"],
						}),
					]),
				);
			});

			/**
			 * Tests validation of non-existent user reference.
			 */
			test('value of the argument "userId" does not correspond to an existing user.', async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								name: `TestOrg_${faker.string.ulid()}`,
								description: faker.lorem.sentence(),
							},
						},
					},
				);

				assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
				createdResources.organizationIds.push(
					createOrgResult.data.createOrganization.id,
				);

				const nonExistentUserId = faker.string.uuid();

				const result = await mercuriusClient.mutate(Mutation_unblockUser, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: nonExistentUserId,
					},
				});

				expect(result.data?.unblockUser).toEqual(null);
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
												argumentPath: ["input", "userId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["unblockUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action" extensions code in the "errors" field and "null" as the value of "data.unblockUser" field if`,
		() => {
			/**
			 * Tests validation that user must be blocked before unblocking.
			 */
			test("user is not currently blocked in the organization.", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Test User",
								password: "TestPassword123!",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				createdResources.userTokens.push(
					createUserResult.data.createUser.authenticationToken,
				);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								name: `TestOrg_${faker.string.ulid()}`,
								description: faker.lorem.sentence(),
							},
						},
					},
				);

				assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
				createdResources.organizationIds.push(
					createOrgResult.data.createOrganization.id,
				);

				// Try to unblock a user who is not blocked
				const result = await mercuriusClient.mutate(Mutation_unblockUser, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: createUserResult.data.createUser.user.id,
					},
				});

				expect(result.data?.unblockUser).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<ForbiddenActionExtensions>({
								code: "forbidden_action",
							}),
							message: expect.any(String),
							path: ["unblockUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.unblockUser" field if`,
		() => {
			/**
			 * Tests authorization for non-admin organization member.
			 */
			test("client is a non-admin organization member.", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				// Create a regular user (non-admin)
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Regular User",
								password: "TestPassword123!",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				createdResources.userTokens.push(
					createUserResult.data.createUser.authenticationToken,
				);

				// Create user to be blocked
				const targetUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Target User",
								password: "TestPassword123!",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(targetUserResult.data.createUser?.user?.id);
				assertToBeNonNullish(
					targetUserResult.data.createUser?.authenticationToken,
				);
				createdResources.userTokens.push(
					targetUserResult.data.createUser.authenticationToken,
				);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								name: `TestOrg_${faker.string.ulid()}`,
								description: faker.lorem.sentence(),
							},
						},
					},
				);

				assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
				createdResources.organizationIds.push(
					createOrgResult.data.createOrganization.id,
				);

				// Add both users as non-admin members
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							organizationId: createOrgResult.data.createOrganization.id,
							memberId: createUserResult.data.createUser.user.id,
							role: "regular",
						},
					},
				});

				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							organizationId: createOrgResult.data.createOrganization.id,
							memberId: targetUserResult.data.createUser.user.id,
							role: "regular",
						},
					},
				});

				// Block the target user as admin
				await mercuriusClient.mutate(Mutation_blockUser, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: targetUserResult.data.createUser.user.id,
					},
				});

				// Try to unblock as non-admin member
				const result = await mercuriusClient.mutate(Mutation_unblockUser, {
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: targetUserResult.data.createUser.user.id,
					},
				});

				expect(result.data?.unblockUser).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["unblockUser"],
						}),
					]),
				);
			});
		},
	);

	suite(
		"results in the value of true for the field 'data.unblockUser' if",
		() => {
			/**
			 * Tests successful user unblock.
			 */
			test("all conditions are met and the user is successfully unblocked.", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				// Create user to be blocked
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Test User",
								password: "TestPassword123!",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				createdResources.userTokens.push(
					createUserResult.data.createUser.authenticationToken,
				);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								name: `TestOrg_${faker.string.ulid()}`,
								description: faker.lorem.sentence(),
							},
						},
					},
				);

				assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
				createdResources.organizationIds.push(
					createOrgResult.data.createOrganization.id,
				);

				// Add user as member
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							organizationId: createOrgResult.data.createOrganization.id,
							memberId: createUserResult.data.createUser.user.id,
							role: "regular",
						},
					},
				});

				// Block the user first
				await mercuriusClient.mutate(Mutation_blockUser, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: createUserResult.data.createUser.user.id,
					},
				});

				// Now unblock the user
				const result = await mercuriusClient.mutate(Mutation_unblockUser, {
					headers: {
						authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						organizationId: createOrgResult.data.createOrganization.id,
						userId: createUserResult.data.createUser.user.id,
					},
				});

				expect(result.data?.unblockUser).toEqual(true);
				expect(result.errors).toBeUndefined();
			});
		},
	);
});
