import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test, vi } from "vitest";
import { usersTable } from "~/src/drizzle/tables/users";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createCommentVote,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createPost,
	Mutation_createUser,
	Mutation_deleteCommentVote,
	Query_currentUser,
} from "../documentNodes";

const SUITE_TIMEOUT = 40_000;

const { accessToken: adminAuthToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${adminAuthToken}` },
});
assertToBeNonNullish(currentUserResult.data?.currentUser?.id);
const adminUserId = currentUserResult.data.currentUser.id;

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
 * Creates a test comment on a post
 */
async function createTestComment(
	postId: string,
	authToken: string,
): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createComment, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				body: `Test Comment ${faker.string.uuid()}`,
				postId,
			},
		},
	});
	assertToBeNonNullish(result.data?.createComment?.id);
	return result.data.createComment.id;
}

/**
 * Creates a test comment vote
 */
async function createTestCommentVote(
	commentId: string,
	authToken: string,
	type: "up_vote" | "down_vote" = "up_vote",
): Promise<void> {
	const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				commentId,
				type,
			},
		},
	});
	expect(result.errors).toBeUndefined();
	assertToBeNonNullish(result.data?.createCommentVote);
}

suite("Mutation field deleteCommentVote", () => {
	suite("when the client is not authenticated", () => {
		test(
			"should return an error with unauthenticated extensions code",
			async () => {
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						variables: {
							input: {
								commentId: faker.string.uuid(),
								creatorId: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							path: ["deleteCommentVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the arguments are invalid", () => {
		test(
			"should return an error with invalid_arguments extensions code for invalid commentId",
			async () => {
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId: "invalid-uuid",
								creatorId: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteCommentVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
							path: ["deleteCommentVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return an error with invalid_arguments extensions code for invalid creatorId",
			async () => {
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId: faker.string.uuid(),
								creatorId: "invalid-uuid",
							},
						},
					},
				);

				expect(result.data?.deleteCommentVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
							path: ["deleteCommentVote"],
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
				const signInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: testUserEmail, password: "password" },
				});
				const userToken = signInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
				assertToBeNonNullish(userToken);

				// Delete the user from database
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, userId));

				// Try to delete a comment vote
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								commentId: faker.string.uuid(),
								creatorId: userId,
							},
						},
					},
				);

				expect(result.data?.deleteCommentVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							path: ["deleteCommentVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the comment does not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				const randomCommentId = faker.string.uuid();

				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId: randomCommentId,
								creatorId: adminUserId,
							},
						},
					},
				);

				expect(result.data?.deleteCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "commentId"],
									}),
								]),
							}),
							path: ["deleteCommentVote"],
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
				// Set up org, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				const randomCreatorId = faker.string.uuid();

				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId,
								creatorId: randomCreatorId,
							},
						},
					},
				);

				// When creatorId doesn't exist, no vote is found for that user,
				// so the error is "vote not found" (both commentId and creatorId in issues)
				expect(result.data?.deleteCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "commentId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "creatorId"],
									}),
								]),
							}),
							path: ["deleteCommentVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the comment vote does not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				// Create org, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

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

				// Try to delete a vote that doesn't exist
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId,
								creatorId: userId,
							},
						},
					},
				);

				expect(result.data?.deleteCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "commentId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "creatorId"],
									}),
								]),
							}),
							path: ["deleteCommentVote"],
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
					// Create organization, post, and comment
					const orgId = await createTestOrganization();
					const postId = await createTestPost(orgId);
					const commentId = await createTestComment(postId, adminAuthToken);

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

					const signInRes = await server.inject({
						method: "POST",
						url: "/auth/signin",
						payload: { email: userEmail, password: "password" },
					});
					const userToken = signInRes.cookies.find(
						(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
					)?.value;
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

					const otherSignInRes = await server.inject({
						method: "POST",
						url: "/auth/signin",
						payload: { email: otherUserEmail, password: "password" },
					});
					const otherUserToken = otherSignInRes.cookies.find(
						(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
					)?.value;
					assertToBeNonNullish(otherUserToken);

					// Other user creates a vote
					await createTestCommentVote(commentId, otherUserToken);

					// First user tries to delete other user's vote (should fail - not an admin)
					const result = await mercuriusClient.mutate(
						Mutation_deleteCommentVote,
						{
							headers: { authorization: `bearer ${userToken}` },
							variables: {
								input: {
									commentId,
									creatorId: otherUserId,
								},
							},
						},
					);

					expect(result.data?.deleteCommentVote).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unauthorized_action_on_arguments_associated_resources",
								}),
								path: ["deleteCommentVote"],
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
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

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

				const nonMemberSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: nonMemberEmail, password: "password" },
				});
				const nonMemberToken = nonMemberSignInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
				assertToBeNonNullish(nonMemberToken);

				// Non-member tries to create a vote (get error because they're not a member)
				// But we need to test delete, so we need to test non-member deleting their theoretical vote
				// Since the implementation checks membership in the authorization step,
				// a non-member will fail the authorization check before vote lookup

				// Non-member tries to delete vote (should fail due to not being a member)
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${nonMemberToken}` },
						variables: {
							input: {
								commentId,
								creatorId: nonMemberId,
							},
						},
					},
				);

				expect(result.data?.deleteCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
							}),
							path: ["deleteCommentVote"],
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
				// Create organization, post, comment, and vote
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Admin creates a vote
				await createTestCommentVote(commentId, adminAuthToken);

				// Get admin user ID
				// adminUserId from module-level Query_currentUser

				// Mock the delete operation to return empty array
				const deleteSpy = vi
					.spyOn(server.drizzleClient, "delete")
					.mockReturnValue({
						where: () => ({
							returning: async () => [],
						}),
					} as unknown as ReturnType<typeof server.drizzleClient.delete>);

				try {
					const result = await mercuriusClient.mutate(
						Mutation_deleteCommentVote,
						{
							headers: { authorization: `bearer ${adminAuthToken}` },
							variables: {
								input: {
									commentId,
									creatorId: adminUserId,
								},
							},
						},
					);

					expect(result.data?.deleteCommentVote ?? null).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								path: ["deleteCommentVote"],
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
			"should successfully delete the vote and return the comment",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

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

				const signInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: userEmail, password: "password" },
				});
				const userToken = signInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
				assertToBeNonNullish(userToken);

				// User creates a vote
				await createTestCommentVote(commentId, userToken);

				// User deletes their own vote
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								commentId,
								creatorId: userId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deleteCommentVote);
				expect(result.data.deleteCommentVote.id).toEqual(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when system administrator deletes another user's vote", () => {
		test(
			"should successfully delete the vote and return the comment",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

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

				const signInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: userEmail, password: "password" },
				});
				const userToken = signInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
				assertToBeNonNullish(userToken);

				// User creates a vote
				await createTestCommentVote(commentId, userToken);

				// System admin deletes the user's vote
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId,
								creatorId: userId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deleteCommentVote);
				expect(result.data.deleteCommentVote.id).toEqual(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when organization admin deletes another user's vote", () => {
		test(
			"should successfully delete the vote and return the comment",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

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

				const orgAdminSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: orgAdminEmail, password: "password" },
				});
				const orgAdminToken = orgAdminSignInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
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

				const userSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: userEmail, password: "password" },
				});
				const userToken = userSignInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
				assertToBeNonNullish(userToken);

				// User creates a vote
				await createTestCommentVote(commentId, userToken);

				// Org admin deletes the user's vote
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${orgAdminToken}` },
						variables: {
							input: {
								commentId,
								creatorId: userId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deleteCommentVote);
				expect(result.data.deleteCommentVote.id).toEqual(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when organization admin deletes their own vote", () => {
		test(
			"should successfully delete the vote and return the comment",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

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

				const orgAdminSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: orgAdminEmail, password: "password" },
				});
				const orgAdminToken = orgAdminSignInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				)?.value;
				assertToBeNonNullish(orgAdminToken);

				// Org admin creates a vote
				await createTestCommentVote(commentId, orgAdminToken);

				// Org admin deletes their own vote
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${orgAdminToken}` },
						variables: {
							input: {
								commentId,
								creatorId: orgAdminId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deleteCommentVote);
				expect(result.data.deleteCommentVote.id).toEqual(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when system administrator deletes their own vote", () => {
		test(
			"should successfully delete the vote and return the comment",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Admin creates a vote
				await createTestCommentVote(commentId, adminAuthToken);

				// System admin deletes their own vote
				const result = await mercuriusClient.mutate(
					Mutation_deleteCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId,
								creatorId: adminUserId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deleteCommentVote);
				expect(result.data.deleteCommentVote.id).toEqual(commentId);
			},
			SUITE_TIMEOUT,
		);
	});
});
