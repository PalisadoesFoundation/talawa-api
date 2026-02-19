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
	Mutation_updateCommentVote,
} from "../documentNodes";

const SUITE_TIMEOUT = 40_000;

const { accessToken: adminAuthToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(adminAuthToken);

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

/**
 * Creates a regular user and returns their credentials
 */
async function createRegularUser(): Promise<{
	userId: string;
	authToken: string;
}> {
	const email = `user${faker.string.uuid()}@example.com`;
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				emailAddress: email,
				isEmailAddressVerified: true,
				name: "Test User",
				password: "password",
				role: "regular",
			},
		},
	});
	const userId = createUserResult.data?.createUser?.user?.id;
	assertToBeNonNullish(userId);

	const res = await server.inject({
		method: "POST",
		url: "/auth/signin",
		payload: { email, password: "password" },
	});
	const cookie = res.cookies.find((c) => c.name === COOKIE_NAMES.ACCESS_TOKEN);
	const authToken = cookie?.value;
	assertToBeNonNullish(authToken);

	return { userId, authToken };
}

suite("Mutation field updateCommentVote", () => {
	suite("when the client is not authenticated", () => {
		test(
			"should return an error with unauthenticated extensions code",
			async () => {
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						variables: {
							input: {
								commentId: faker.string.uuid(),
								type: "up_vote",
							},
						},
					},
				);

				expect(result.data?.updateCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							path: ["updateCommentVote"],
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
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId: "invalid-uuid",
								type: "up_vote",
							},
						},
					},
				);

				expect(result.data?.updateCommentVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
							path: ["updateCommentVote"],
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

				const userSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: testUserEmail, password: "password" },
				});
				const userAccessCookie = userSignInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				);
				const userToken = userAccessCookie?.value;
				assertToBeNonNullish(userToken);

				// Delete the user from database
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, userId));

				// Try to update a comment vote
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								commentId: faker.string.uuid(),
								type: "up_vote",
							},
						},
					},
				);

				expect(result.data?.updateCommentVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							path: ["updateCommentVote"],
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
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId: randomCommentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.data?.updateCommentVote).toBeNull();
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
							path: ["updateCommentVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("authorization checks", () => {
		test(
			"should return unauthorized_action when non-admin non-member tries to vote",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a non-member user
				const { authToken: nonMemberToken } = await createRegularUser();

				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${nonMemberToken}` },
						variables: {
							input: {
								commentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.data?.updateCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "commentId"],
									}),
								]),
							}),
							path: ["updateCommentVote"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should allow system administrator to vote without explicit organization membership",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								commentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should allow organization member to vote on comment",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("vote creation (type not null, no existing vote)", () => {
		test(
			"should successfully create a new up_vote",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should successfully create a new down_vote",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: "down_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("vote update (type not null, existing vote)", () => {
		test(
			"should successfully update an existing vote from up_vote to down_vote",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Create initial vote using createCommentVote
				await createTestCommentVote(commentId, memberToken, "up_vote");

				// Update the vote to down_vote
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: "down_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should successfully update an existing vote from down_vote to up_vote",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Create initial vote with down_vote
				await createTestCommentVote(commentId, memberToken, "down_vote");

				// Update the vote to up_vote
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should handle no-op when vote type is unchanged",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Create initial vote with up_vote
				await createTestCommentVote(commentId, memberToken, "up_vote");

				// Update with same vote type (should still work)
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("vote deletion (type is null)", () => {
		test(
			"should successfully delete an existing vote when type is null",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Create initial vote
				await createTestCommentVote(commentId, memberToken, "up_vote");

				// Delete the vote by passing type=null
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: null,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should handle no-op when deleting non-existent vote (type is null, no existing vote)",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member (but don't create a vote)
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Try to delete when no vote exists (should be a no-op)
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								commentId,
								type: null,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
				expect(result.data?.updateCommentVote?.id).toBe(commentId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("database error handling", () => {
		test(
			"should return unexpected error when insert returns empty array",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Mock the insert to return empty array
				const originalInsert = server.drizzleClient.insert;
				server.drizzleClient.insert = vi.fn().mockReturnValue({
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]),
					}),
				});

				try {
					const result = await mercuriusClient.mutate(
						Mutation_updateCommentVote,
						{
							headers: { authorization: `bearer ${memberToken}` },
							variables: {
								input: {
									commentId,
									type: "up_vote",
								},
							},
						},
					);

					expect(result.data?.updateCommentVote ?? null).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								path: ["updateCommentVote"],
							}),
						]),
					);
				} finally {
					server.drizzleClient.insert = originalInsert;
				}
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return unexpected error when update returns empty array",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Create initial vote
				await createTestCommentVote(commentId, memberToken, "up_vote");

				// Mock the update to return empty array
				const originalUpdate = server.drizzleClient.update;
				server.drizzleClient.update = vi.fn().mockReturnValue({
					set: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([]),
						}),
					}),
				});

				try {
					const result = await mercuriusClient.mutate(
						Mutation_updateCommentVote,
						{
							headers: { authorization: `bearer ${memberToken}` },
							variables: {
								input: {
									commentId,
									type: "down_vote",
								},
							},
						},
					);

					expect(result.data?.updateCommentVote ?? null).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								path: ["updateCommentVote"],
							}),
						]),
					);
				} finally {
					server.drizzleClient.update = originalUpdate;
				}
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return unexpected error when delete returns empty array",
			async () => {
				// Create organization, post, and comment
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a user and make them a member
				const { userId, authToken: memberToken } = await createRegularUser();

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

				// Create initial vote
				await createTestCommentVote(commentId, memberToken, "up_vote");

				// Mock the delete to return empty array
				const originalDelete = server.drizzleClient.delete;
				server.drizzleClient.delete = vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]),
					}),
				});

				try {
					const result = await mercuriusClient.mutate(
						Mutation_updateCommentVote,
						{
							headers: { authorization: `bearer ${memberToken}` },
							variables: {
								input: {
									commentId,
									type: null,
								},
							},
						},
					);

					expect(result.data?.updateCommentVote ?? null).toBeNull();
					expect(result.errors).toEqual(
						expect.arrayContaining([
							expect.objectContaining({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								path: ["updateCommentVote"],
							}),
						]),
					);
				} finally {
					server.drizzleClient.delete = originalDelete;
				}
			},
			SUITE_TIMEOUT,
		);
	});

	suite("system administrator vote operations", () => {
		test(
			"should allow admin to create vote",
			async () => {
				// Create organization, post, and comment using admin
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a new admin for this test (to avoid conflicts with other tests)
				const adminEmail = `admin${faker.string.uuid()}@example.com`;
				const createAdminResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: adminEmail,
								isEmailAddressVerified: true,
								name: "Test Admin",
								password: "password",
								role: "administrator",
							},
						},
					},
				);
				assertToBeNonNullish(createAdminResult.data?.createUser?.user?.id);

				const newAdminSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: adminEmail, password: "password" },
				});
				const newAdminCookie = newAdminSignInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				);
				const newAdminToken = newAdminCookie?.value ?? "";
				assertToBeNonNullish(newAdminToken);

				// Admin creates vote
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${newAdminToken}` },
						variables: {
							input: {
								commentId,
								type: "up_vote",
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
			},
			SUITE_TIMEOUT,
		);

		test(
			"should allow admin to delete their vote",
			async () => {
				// Create organization, post, and comment using admin
				const orgId = await createTestOrganization();
				const postId = await createTestPost(orgId);
				const commentId = await createTestComment(postId, adminAuthToken);

				// Create a new admin for this test
				const adminEmail = `admin${faker.string.uuid()}@example.com`;
				const createAdminResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: adminEmail,
								isEmailAddressVerified: true,
								name: "Test Admin",
								password: "password",
								role: "administrator",
							},
						},
					},
				);
				assertToBeNonNullish(createAdminResult.data?.createUser?.user?.id);

				const newAdminSignInRes = await server.inject({
					method: "POST",
					url: "/auth/signin",
					payload: { email: adminEmail, password: "password" },
				});
				const newAdminCookie = newAdminSignInRes.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				);
				const newAdminToken = newAdminCookie?.value ?? "";
				assertToBeNonNullish(newAdminToken);

				// Admin creates vote first
				await createTestCommentVote(commentId, newAdminToken, "down_vote");

				// Admin deletes vote
				const result = await mercuriusClient.mutate(
					Mutation_updateCommentVote,
					{
						headers: { authorization: `bearer ${newAdminToken}` },
						variables: {
							input: {
								commentId,
								type: null,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommentVote).toBeDefined();
			},
			SUITE_TIMEOUT,
		);
	});
});
