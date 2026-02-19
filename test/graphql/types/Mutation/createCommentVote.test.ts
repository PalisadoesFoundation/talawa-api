import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { expect, suite, test, vi } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createComment,
	Mutation_createCommentVote,
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_deleteCurrentUser,
	Mutation_joinPublicOrganization,
	Query_currentUser,
} from "../documentNodes";

const { accessToken: adminToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${adminToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id ?? null;
assertToBeNonNullish(adminToken);
assertToBeNonNullish(adminUserId);

/**
 * Helper function to create a test organization, post, and comment.
 */
async function createTestComment(authToken: string): Promise<{
	commentId: string;
	organizationId: string;
}> {
	// Create organization
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Org ${faker.string.uuid()}`,
					countryCode: "us",
				},
			},
		},
	);
	const organizationId = createOrgResult.data?.createOrganization?.id;
	assertToBeNonNullish(organizationId);

	// Create a post in the organization
	const createPostResult = await mercuriusClient.mutate(Mutation_createPost, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				caption: "Test post for comment vote",
				organizationId,
			},
		},
	});
	const postId = createPostResult.data?.createPost?.id;
	assertToBeNonNullish(postId);

	// Create a comment on the post
	const createCommentResult = await mercuriusClient.mutate(
		Mutation_createComment,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					body: "Test comment for voting",
					postId,
				},
			},
		},
	);
	const commentId = createCommentResult.data?.createComment?.id;
	assertToBeNonNullish(commentId);

	return { commentId, organizationId };
}

suite("Mutation field createCommentVote", () => {
	suite("Authentication errors", () => {
		test("should return unauthenticated error when client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				variables: {
					input: {
						commentId: faker.string.uuid(),
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createCommentVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createCommentVote"],
					}),
				]),
			);
		});

		test("should return unauthenticated error when current user does not exist in database", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			// Delete the user
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						commentId: faker.string.uuid(),
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createCommentVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createCommentVote"],
					}),
				]),
			);
		});
	});

	suite("Argument validation errors", () => {
		test("should return invalid_arguments error for invalid commentId", async () => {
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						commentId: "not-a-valid-uuid",
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createCommentVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "commentId"]),
								}),
							]),
						}),
						path: ["createCommentVote"],
					}),
				]),
			);
		});

		test("should return GraphQL validation error for invalid vote type", async () => {
			const result = await mercuriusClient.mutate(
				`mutation CreateCommentVote($input: MutationCreateCommentVoteInput!) {
					createCommentVote(input: $input) {
						id
					}
				}`,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							commentId: faker.string.uuid(),
							type: "invalid_vote_type",
						},
					},
				},
			);

			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
		});
	});

	suite("Comment lookup errors", () => {
		test("should return arguments_associated_resources_not_found when comment does not exist", async () => {
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						commentId: faker.string.uuid(),
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createCommentVote).toBeNull();
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
						path: ["createCommentVote"],
					}),
				]),
			);
		});
	});

	suite("Duplicate vote prevention", () => {
		test("should return forbidden_action_on_arguments_associated_resources when user has already voted", async () => {
			const { commentId } = await createTestComment(adminToken);

			// Create the first vote
			const firstVoteResult = await mercuriusClient.mutate(
				Mutation_createCommentVote,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							commentId,
							type: "up_vote",
						},
					},
				},
			);
			expect(firstVoteResult.errors).toBeUndefined();

			// Try to vote again with different vote type
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						commentId,
						type: "down_vote",
					},
				},
			});

			expect(result.data?.createCommentVote).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "commentId"],
									message: "You have already voted this comment.",
								}),
							]),
						}),
						path: ["createCommentVote"],
					}),
				]),
			);
		});

		test("should return forbidden_action when user tries to vote same type again", async () => {
			const { commentId } = await createTestComment(adminToken);

			// Create the first vote
			await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						commentId,
						type: "down_vote",
					},
				},
			});

			// Try to vote again with same type
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						commentId,
						type: "down_vote",
					},
				},
			});

			expect(result.data?.createCommentVote).toBeNull();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"forbidden_action_on_arguments_associated_resources",
			);
		});
	});

	suite("Authorization checks", () => {
		test("should return unauthorized_action when non-member regular user tries to vote", async () => {
			// Create a comment using admin in an organization
			const { commentId } = await createTestComment(adminToken);

			// Create a regular user who is not a member of the organization
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						commentId,
						type: "up_vote",
					},
				},
			});

			expect(result.data?.createCommentVote).toBeNull();
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
						path: ["createCommentVote"],
					}),
				]),
			);
		});

		test("should allow system administrator to vote without organization membership", async () => {
			// Create org and comment using admin
			const { commentId } = await createTestComment(adminToken);

			// Admin can vote even though they might not have explicit membership
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						commentId,
						type: "up_vote",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createCommentVote).toEqual(
				expect.objectContaining({
					id: commentId,
					body: "Test comment for voting",
				}),
			);
		});

		test("should allow organization member to vote on comment", async () => {
			// Create organization and comment using admin
			const { commentId, organizationId } = await createTestComment(adminToken);

			// Create a regular user and make them join the organization
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

			// Join the organization
			const joinResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							organizationId,
						},
					},
				},
			);
			expect(joinResult.errors).toBeUndefined();

			// Now the regular user should be able to vote
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						commentId,
						type: "up_vote",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createCommentVote).toEqual(
				expect.objectContaining({
					id: commentId,
					body: "Test comment for voting",
				}),
			);
		});

		test("should allow organization administrator to vote", async () => {
			// Create organization and comment using admin
			const { commentId, organizationId } = await createTestComment(adminToken);

			// Create a regular user
			const { authToken: regularUserToken, userId: regularUserId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(regularUserId);

			// First add user as a member of organization
			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			});

			// Then make them administrator of the organization
			await server.drizzleClient
				.update(organizationMembershipsTable)
				.set({ role: "administrator" })
				.where(
					and(
						eq(organizationMembershipsTable.organizationId, organizationId),
						eq(organizationMembershipsTable.memberId, regularUserId),
					),
				);

			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						commentId,
						type: "down_vote",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createCommentVote).toBeDefined();
		});
	});

	suite("Successful vote creation", () => {
		test("should successfully create an up_vote", async () => {
			// Create organization and comment using admin
			const { commentId, organizationId } = await createTestComment(adminToken);

			// Create a regular user and make them join the organization
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

			// Join the organization
			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			});

			// Vote with up_vote
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						commentId,
						type: "up_vote",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createCommentVote).toEqual(
				expect.objectContaining({
					id: commentId,
					body: "Test comment for voting",
				}),
			);
		});

		test("should successfully create a down_vote", async () => {
			// Create organization and comment using admin
			const { commentId, organizationId } = await createTestComment(adminToken);

			// Create a regular user and make them join the organization
			const { authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserToken);

			// Join the organization
			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						organizationId,
					},
				},
			});

			// Vote with down_vote
			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					input: {
						commentId,
						type: "down_vote",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createCommentVote).toEqual(
				expect.objectContaining({
					id: commentId,
					body: "Test comment for voting",
				}),
			);
		});

		test("should return the comment after successful vote creation", async () => {
			const { commentId, organizationId } = await createTestComment(adminToken);

			// Create and add a member
			const { authToken: memberToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(memberToken);

			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${memberToken}` },
				variables: { input: { organizationId } },
			});

			const result = await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: { authorization: `bearer ${memberToken}` },
				variables: {
					input: {
						commentId,
						type: "up_vote",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createCommentVote?.id).toBe(commentId);
			expect(result.data?.createCommentVote?.body).toBe(
				"Test comment for voting",
			);
		});
	});

	suite("Database error handling", () => {
		test("should handle database insert error gracefully", async () => {
			const { commentId, organizationId } = await createTestComment(adminToken);

			// Create and add a member
			const { authToken: memberToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(memberToken);

			await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
				headers: { authorization: `bearer ${memberToken}` },
				variables: { input: { organizationId } },
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
					Mutation_createCommentVote,
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

				expect(result.data?.createCommentVote).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unexpected" }),
							path: ["createCommentVote"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.insert = originalInsert;
			}
		});
	});
});
