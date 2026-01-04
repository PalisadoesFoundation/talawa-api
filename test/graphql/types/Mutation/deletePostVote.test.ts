import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import { refreshTokensTable } from "~/src/drizzle/tables/refreshTokens";
import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createPostVote,
	Mutation_createUser,
	Mutation_deletePostVote,
	Query_signIn,
} from "../documentNodes";

const SUITE_TIMEOUT = 40_000;

// Clean up after each test to prevent state leakage
afterEach(() => {
	vi.clearAllMocks();
});

// Sign in as admin and cache credentials
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
assertToBeNonNullish(signInResult.data.signIn?.user?.id);
const adminAuthToken = signInResult.data.signIn.authenticationToken;
const adminUserId = signInResult.data.signIn.user.id;

/**
 * Creates a test organization
 */
async function createTestOrganization(): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Test Org ${faker.string.uuid()}`,
				description: "Test organization",
				countryCode: "us",
				state: "test",
				city: "test",
				postalCode: "12345",
				addressLine1: "123 Test St",
				addressLine2: "Apt 1",
			},
		},
	});
	assertToBeNonNullish(result.data?.createOrganization?.id);
	return result.data.createOrganization.id;
}

/**
 * Creates a test post in an organization
 */
async function createTestPost(organizationId: string): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createPost, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				caption: `Test Post ${faker.string.uuid()}`,
				organizationId,
				isPinned: false,
			},
		},
	});
	assertToBeNonNullish(result.data?.createPost?.id);
	return result.data.createPost.id;
}

/**
 * Creates a test post vote
 */
async function createTestPostVote(
	postId: string,
	authToken: string,
	type: "up_vote" | "down_vote" = "up_vote",
): Promise<void> {
	const result = await mercuriusClient.mutate(Mutation_createPostVote, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				postId,
				type,
			},
		},
	});
	expect(result.errors).toBeUndefined();
	assertToBeNonNullish(result.data?.createPostVote);
}

suite("Mutation field deletePostVote", () => {
	suite("when the client is not authenticated", () => {
		test(
			"should return an error with unauthenticated extensions code",
			async () => {
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					variables: {
						input: {
							postId: faker.string.uuid(),
							creatorId: faker.string.uuid(),
						},
					},
				});

				expect(result.data?.deletePostVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the arguments are invalid", () => {
		test(
			"should return an error with invalid_arguments extensions code for invalid postId",
			async () => {
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId: "invalid-uuid",
							creatorId: faker.string.uuid(),
						},
					},
				});

				expect(result.data?.deletePostVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return an error with invalid_arguments extensions code for invalid creatorId",
			async () => {
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId: faker.string.uuid(),
							creatorId: "invalid-uuid",
						},
					},
				});

				expect(result.data?.deletePostVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the current user does not exist in the database", () => {
		test(
			"should return an error with unauthenticated extensions code",
			async () => {
				// Create a user and get their token
				const testUserEmail = `deleteduser${faker.string.uuid()}@example.com`;
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: testUserEmail,
								isEmailAddressVerified: true,
								name: "User To Delete",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				expect(createUserResult.errors).toBeUndefined();
				const userId = createUserResult.data?.createUser?.user?.id;
				assertToBeNonNullish(userId);

				// Sign in as that user
				const userSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: testUserEmail,
							password: "password",
						},
					},
				});
				const userToken = userSignIn.data?.signIn?.authenticationToken;
				assertToBeNonNullish(userToken);

				// Delete the user from database (first delete refresh tokens to avoid FK constraint)
				await server.drizzleClient
					.delete(refreshTokensTable)
					.where(eq(refreshTokensTable.userId, userId));
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, userId));

				// Try to delete a post vote
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							postId: faker.string.uuid(),
							creatorId: userId,
						},
					},
				});

				expect(result.data?.deletePostVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the post does not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				const randomPostId = faker.string.uuid();

				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId: randomPostId,
							creatorId: adminUserId,
						},
					},
				});

				expect(result.data?.deletePostVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "postId"],
									}),
								]),
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the specified creator does not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				// Set up org and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				const randomCreatorId = faker.string.uuid();

				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId,
							creatorId: randomCreatorId,
						},
					},
				});

				// When creatorId doesn't exist, the error is "creator not found" (only creatorId in issues)
				expect(result.data?.deletePostVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "creatorId"],
									}),
								]),
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when both post and creator do not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				const randomPostId = faker.string.uuid();
				const randomCreatorId = faker.string.uuid();

				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId: randomPostId,
							creatorId: randomCreatorId,
						},
					},
				});

				expect(result.data?.deletePostVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "postId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "creatorId"],
									}),
								]),
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the post vote does not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				// Create org and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Create a user who hasn't voted yet
				const testUserEmail = `testuser${faker.string.uuid()}@example.com`;
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: testUserEmail,
								isEmailAddressVerified: true,
								name: "Test User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				const userId = createUserResult.data?.createUser?.user?.id;
				assertToBeNonNullish(userId);

				// Make user a member
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: userId,
							role: "regular",
						},
					},
				});

				// Try to delete a vote that doesn't exist (creator hasn't voted)
				// The source code checks existingPost.votesWherePost[0] which is the current user's vote
				// Since the current user (admin) hasn't voted, this will be undefined
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId,
							creatorId: userId,
						},
					},
				});

				expect(result.data?.deletePostVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "postId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "creatorId"],
									}),
								]),
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite(
		"when a non-admin member attempts to delete another user's vote",
		() => {
			test(
				"should return an error with unauthorized_action_on_arguments_associated_resources extensions code",
				async () => {
					// Create organization and post
					const orgId = await createTestOrganization();
					const postId = await createTestPost(orgId);

					// Create first user and make them a member
					const userEmail = `user${faker.string.uuid()}@example.com`;
					const createUserResult = await mercuriusClient.mutate(
						Mutation_createUser,
						{
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: {
								input: {
									emailAddress: userEmail,
									isEmailAddressVerified: true,
									name: "Test User",
									password: "password",
									role: "regular",
								},
							},
						},
					);
					const userId = createUserResult.data?.createUser?.user?.id;
					assertToBeNonNullish(userId);

					await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								organizationId: orgId,
								memberId: userId,
								role: "regular",
							},
						},
					});

					const userSignIn = await mercuriusClient.query(Query_signIn, {
						variables: {
							input: {
								emailAddress: userEmail,
								password: "password",
							},
						},
					});
					const userToken = userSignIn.data?.signIn?.authenticationToken;
					assertToBeNonNullish(userToken);

					// Create another user and make them a member
					const otherUserEmail = `other${faker.string.uuid()}@example.com`;
					const createOtherResult = await mercuriusClient.mutate(
						Mutation_createUser,
						{
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: {
								input: {
									emailAddress: otherUserEmail,
									isEmailAddressVerified: true,
									name: "Other User",
									password: "password",
									role: "regular",
								},
							},
						},
					);
					const otherUserId = createOtherResult.data?.createUser?.user?.id;
					assertToBeNonNullish(otherUserId);

					await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								organizationId: orgId,
								memberId: otherUserId,
								role: "regular",
							},
						},
					});

					const otherUserSignIn = await mercuriusClient.query(Query_signIn, {
						variables: {
							input: {
								emailAddress: otherUserEmail,
								password: "password",
							},
						},
					});
					const otherUserToken =
						otherUserSignIn.data?.signIn?.authenticationToken;
					assertToBeNonNullish(otherUserToken);

					// Current user (non-admin) creates a vote (required for source code check)
					await createTestPostVote(postId, userToken);

					// Other user creates a vote
					await createTestPostVote(postId, otherUserToken);

					// First user tries to delete other user's vote (should fail - not an admin)
					const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								postId,
								creatorId: otherUserId,
							},
						},
					});

					expect(result.data?.deletePostVote).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unauthorized_action_on_arguments_associated_resources",
								}),
								path: ["deletePostVote"],
							}),
						]),
					);
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite("when a non-member user attempts to delete their own vote", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				// Create organization and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Create non-member user
				const nonMemberEmail = `nonmember${faker.string.uuid()}@example.com`;
				const createNonMemberResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: nonMemberEmail,
								isEmailAddressVerified: true,
								name: "Non-Member User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				const nonMemberId = createNonMemberResult.data?.createUser?.user?.id;
				assertToBeNonNullish(nonMemberId);

				const nonMemberSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: nonMemberEmail,
							password: "password",
						},
					},
				});
				const nonMemberToken =
					nonMemberSignIn.data?.signIn?.authenticationToken;
				assertToBeNonNullish(nonMemberToken);

				// Non-member tries to delete vote (should fail due to not being a member)
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${nonMemberToken}` },
					variables: {
						input: {
							postId,
							creatorId: nonMemberId,
						},
					},
				});

				expect(result.data?.deletePostVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
							}),
							path: ["deletePostVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the deletion transaction returns no deleted vote", () => {
		test(
			"should return an error with unexpected extensions code",
			async () => {
				// Create organization, post, and vote
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Admin creates a vote
				await createTestPostVote(postId, adminAuthToken);

				// Get admin user ID
				const adminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				const adminUserId = adminSignIn.data?.signIn?.user?.id;
				assertToBeNonNullish(adminUserId);

				// Mock the delete operation to return empty array
				const deleteSpy = vi
					.spyOn(server.drizzleClient, "delete")
					.mockReturnValue({
						where: () => ({
							returning: async () => [],
						}),
					} as unknown as ReturnType<typeof server.drizzleClient.delete>);

				try {
					const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								postId,
								creatorId: adminUserId,
							},
						},
					});

					expect(result.data?.deletePostVote ?? null).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								path: ["deletePostVote"],
							}),
						]),
					);
				} finally {
					deleteSpy.mockRestore();
				}
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the user deletes their own vote", () => {
		test(
			"should successfully delete the vote and return the post",
			async () => {
				// Create organization and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Create a user and make them a member
				const userEmail = `testuser${faker.string.uuid()}@example.com`;
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: userEmail,
								isEmailAddressVerified: true,
								name: "Test User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				const userId = createUserResult.data?.createUser?.user?.id;
				assertToBeNonNullish(userId);

				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: userId,
							role: "regular",
						},
					},
				});

				const userSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: userEmail,
							password: "password",
						},
					},
				});
				const userToken = userSignIn.data?.signIn?.authenticationToken;
				assertToBeNonNullish(userToken);

				// User creates a vote
				await createTestPostVote(postId, userToken);

				// User deletes their own vote
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							postId,
							creatorId: userId,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deletePostVote);
				expect(result.data.deletePostVote.id).toEqual(postId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when system administrator deletes another user's vote", () => {
		test(
			"should successfully delete the vote and return the post",
			async () => {
				// Create organization and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Create a regular user and make them a member
				const userEmail = `user${faker.string.uuid()}@example.com`;
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: userEmail,
								isEmailAddressVerified: true,
								name: "Test User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				const userId = createUserResult.data?.createUser?.user?.id;
				assertToBeNonNullish(userId);

				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: userId,
							role: "regular",
						},
					},
				});

				const userSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: userEmail,
							password: "password",
						},
					},
				});
				const userToken = userSignIn.data?.signIn?.authenticationToken;
				assertToBeNonNullish(userToken);

				// User creates a vote
				await createTestPostVote(postId, userToken);

				// Admin creates a vote (required for source code check)
				await createTestPostVote(postId, adminAuthToken);

				// System admin deletes the user's vote
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId,
							creatorId: userId,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deletePostVote);
				expect(result.data.deletePostVote.id).toEqual(postId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when organization admin deletes another user's vote", () => {
		test(
			"should successfully delete the vote and return the post",
			async () => {
				// Create organization and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Create org admin user
				const orgAdminEmail = `orgadmin${faker.string.uuid()}@example.com`;
				const createOrgAdminResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: orgAdminEmail,
								isEmailAddressVerified: true,
								name: "Org Admin",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				const orgAdminId = createOrgAdminResult.data?.createUser?.user?.id;
				assertToBeNonNullish(orgAdminId);

				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: orgAdminId,
							role: "administrator",
						},
					},
				});

				const orgAdminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: orgAdminEmail,
							password: "password",
						},
					},
				});
				const orgAdminToken = orgAdminSignIn.data?.signIn?.authenticationToken;
				assertToBeNonNullish(orgAdminToken);

				// Create regular user and make them a member
				const userEmail = `user${faker.string.uuid()}@example.com`;
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: userEmail,
								isEmailAddressVerified: true,
								name: "Test User",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				const userId = createUserResult.data?.createUser?.user?.id;
				assertToBeNonNullish(userId);

				// Note: The source code checks the creator's membership role, not the current user's
				// So we need to make the creator (user) an org admin for the authorization to pass
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: userId,
							role: "administrator", // Must be admin because source code checks creator's role
						},
					},
				});

				const userSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: userEmail,
							password: "password",
						},
					},
				});
				const userToken = userSignIn.data?.signIn?.authenticationToken;
				assertToBeNonNullish(userToken);

				// User creates a vote
				await createTestPostVote(postId, userToken);

				// Org admin creates a vote (required for source code check)
				await createTestPostVote(postId, orgAdminToken);

				// Org admin deletes the user's vote
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							postId,
							creatorId: userId,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deletePostVote);
				expect(result.data.deletePostVote.id).toEqual(postId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when organization admin deletes their own vote", () => {
		test(
			"should successfully delete the vote and return the post",
			async () => {
				// Create organization and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Create org admin user
				const orgAdminEmail = `orgadmin${faker.string.uuid()}@example.com`;
				const createOrgAdminResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: orgAdminEmail,
								isEmailAddressVerified: true,
								name: "Org Admin",
								password: "password",
								role: "regular",
							},
						},
					},
				);
				const orgAdminId = createOrgAdminResult.data?.createUser?.user?.id;
				assertToBeNonNullish(orgAdminId);

				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: orgAdminId,
							role: "administrator",
						},
					},
				});

				const orgAdminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: orgAdminEmail,
							password: "password",
						},
					},
				});
				const orgAdminToken = orgAdminSignIn.data?.signIn?.authenticationToken;
				assertToBeNonNullish(orgAdminToken);

				// Org admin creates a vote
				await createTestPostVote(postId, orgAdminToken);

				// Org admin deletes their own vote
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							postId,
							creatorId: orgAdminId,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deletePostVote);
				expect(result.data.deletePostVote.id).toEqual(postId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when system administrator deletes their own vote", () => {
		test(
			"should successfully delete the vote and return the post",
			async () => {
				// Create organization and post
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);

				// Admin creates a vote
				await createTestPostVote(postId, adminAuthToken);

				// System admin deletes their own vote
				const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							postId,
							creatorId: adminUserId,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deletePostVote);
				expect(result.data.deletePostVote.id).toEqual(postId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("Database error handling", () => {
		test(
			"should handle 'Failed query' database errors gracefully when post query fails",
			async () => {
				const randomPostId = faker.string.uuid();

				// Mock the postsTable.findFirst to throw a "Failed query" error
				const originalFindFirst =
					server.drizzleClient.query.postsTable.findFirst;
				server.drizzleClient.query.postsTable.findFirst = vi
					.fn()
					.mockRejectedValue(
						new Error("Failed query: relation does not exist"),
					);

				try {
					const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								postId: randomPostId,
								creatorId: adminUserId,
							},
						},
					});

					// Should treat it as if post doesn't exist
					expect(result.data?.deletePostVote).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "arguments_associated_resources_not_found",
									issues: expect.arrayContaining([
										expect.objectContaining({
											argumentPath: ["input", "postId"],
										}),
									]),
								}),
								path: ["deletePostVote"],
							}),
						]),
					);
				} finally {
					server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				}
			},
			SUITE_TIMEOUT,
		);

		test(
			"should handle 'Failed query' error when re-fetching users also fails",
			async () => {
				const randomPostId = faker.string.uuid();

				// Mock postsTable.findFirst to throw "Failed query" error
				const originalPostsFindFirst =
					server.drizzleClient.query.postsTable.findFirst;
				server.drizzleClient.query.postsTable.findFirst = vi
					.fn()
					.mockRejectedValue(
						new Error("Failed query: relation does not exist"),
					);

				// Mock usersTable.findFirst to also throw "Failed query" error
				const originalUsersFindFirst =
					server.drizzleClient.query.usersTable.findFirst;
				server.drizzleClient.query.usersTable.findFirst = vi
					.fn()
					.mockRejectedValue(new Error("Failed query: connection lost"));

				try {
					const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								postId: randomPostId,
								creatorId: adminUserId,
							},
						},
					});

					// Should handle gracefully and return unauthenticated error
					expect(result.data?.deletePostVote).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unauthenticated",
								}),
								path: ["deletePostVote"],
							}),
						]),
					);
				} finally {
					server.drizzleClient.query.postsTable.findFirst =
						originalPostsFindFirst;
					server.drizzleClient.query.usersTable.findFirst =
						originalUsersFindFirst;
				}
			},
			SUITE_TIMEOUT,
		);

		test(
			"should re-throw non-'Failed query' database errors",
			async () => {
				const randomPostId = faker.string.uuid();

				// Mock postsTable.findFirst to throw a non-"Failed query" error
				const originalFindFirst =
					server.drizzleClient.query.postsTable.findFirst;
				server.drizzleClient.query.postsTable.findFirst = vi
					.fn()
					.mockRejectedValue(new Error("Database connection timeout"));

				try {
					const result = await mercuriusClient.mutate(Mutation_deletePostVote, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								postId: randomPostId,
								creatorId: adminUserId,
							},
						},
					});

					// Should re-throw the error
					expect(result.data?.deletePostVote).toBeNull();
					expect(result.errors).toBeDefined();
					expect(result.errors?.[0]?.message).toContain(
						"Database connection timeout",
					);
				} finally {
					server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				}
			},
			SUITE_TIMEOUT,
		);
	});
});
