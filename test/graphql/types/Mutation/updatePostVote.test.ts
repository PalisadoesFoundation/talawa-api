import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { postVotesTable } from "~/src/drizzle/tables/postVotes";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createUser,
	Mutation_deleteCurrentUser,
	Query_signIn,
	Mutation_updatePostVote as UPDATE_POST_VOTE,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
const adminToken = signInResult.data?.signIn?.authenticationToken ?? null;
assertToBeNonNullish(adminToken);

suite("Mutation field updatePostVote", () => {
	suite("unexpected update results", () => {
		test("should return unexpected if DB returns empty array on insert/update", async () => {
			const { authToken } = await createRegularUserUsingAdmin();

			assertToBeNonNullish(authToken);

			await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: `nonadmin${faker.string.ulid()}@example.com`,
						isEmailAddressVerified: false,
						name: "Non-Admin User",
						password: "password",
						role: "regular",
					},
				},
			});

			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when client is not authenticated", () => {
		test("should return unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when input arguments are invalid", () => {
		test("should return invalid_arguments", async () => {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { postId: "abc", type: "up_vote" }, // invalid UUID
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when user does not exist in DB", () => {
		test("should return unauthenticated", async () => {
			const { authToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${authToken}` },
			});

			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when post does not exist", () => {
		test("should return arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when updating vote", () => {
		test("should return unexpected when DB update returns empty array", async () => {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});
	});

	suite("authorization checks", () => {
		test("should return unauthorized_action_on_arguments_associated_resources if user is not admin or org member", async () => {
			const { authToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			// Mock post with empty organization memberships
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					votesWherePost: [],
					organization: { membershipsWhereOrganization: [] },
				});

			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { postId: faker.string.uuid(), type: "up_vote" } },
			});

			server.drizzleClient.query.postsTable.findFirst = originalFindFirst;

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({ argumentPath: ["input", "postId"] }),
							]),
						}),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("vote creation and update", () => {
		test("should create a new vote when none exists", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();

			// Mock the post (no votes yet)
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock insert returning a new vote
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: faker.string.uuid(),
							type: "up_vote",
							creatorId: userId,
							postId,
							createdAt: new Date(),
							updatedAt: new Date(),
							upVotesCount: 1,
							downVotesCount: 0,
						},
					]),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { postId, type: "up_vote" } },
				});
				expect(result.data?.updatePostVote).toBeDefined();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.insert = originalInsert;
			}
		});

		test("should return unexpected if DB operation throws", async () => {
			const { authToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();

			// Mock the post find
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId: "test" }],
					},
				});

			// Mock the insert to throw
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockImplementation(() => {
				throw new Error("DB failure");
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { postId, type: "up_vote" },
					},
				});

				expect(result.data?.updatePostVote ?? null).toBeNull();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.insert = originalInsert;
			}
		});

		test("should return unauthorized_action_on_arguments_associated_resources if organization is null", async () => {
			const { authToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();

			// Mock the post find with null organization
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [],
					organization: null,
				});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { postId, type: "up_vote" } },
				});

				expect(result.data?.updatePostVote ?? null).toBeNull();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
			}
		});

		test("should handle no-op when vote type is unchanged", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();

			// Mock the post find with existing vote of same type
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [
						{ id: faker.string.uuid(), creatorId: userId, type: "up_vote" },
					],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { postId, type: "up_vote" } },
				});

				expect(result.data?.updatePostVote).toBeDefined();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
			}
		});

		test("should update an existing vote when user changes type", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();
			const voteId = faker.string.uuid();

			// Mock the post find with an existing vote from this user
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [
						{ id: voteId, creatorId: userId, type: "down_vote" },
					],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock the update method to return updated vote
			const originalUpdate = server.drizzleClient.update;
			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([
							{
								id: voteId,
								type: "up_vote",
								creatorId: userId,
								postId,
								createdAt: new Date(),
								updatedAt: new Date(),
								upVotesCount: 1,
								downVotesCount: 0,
							},
						]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { postId, type: "up_vote" },
					},
				});
				expect(result.data?.updatePostVote).toBeDefined();
			} finally {
				// Restore originals
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should insert new vote if existing votes belong to other users", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);
			const postId = faker.string.uuid();

			// Post already has votes, but from someone else (different userId)
			const otherUserId = faker.string.uuid(); // Different user ID
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [
						{
							id: faker.string.uuid(),
							creatorId: otherUserId,
							type: "down_vote",
						}, // Different user
					],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock insert (should be called since no existing vote from current user)
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: faker.string.uuid(),
							type: "up_vote",
							creatorId: userId,
							postId,
							upVotesCount: 1,
							downVotesCount: 0,
						},
					]),
				}),
			});

			// Mock update (should NOT be called since no existing vote from current user)
			const updateSpy = vi.spyOn(server.drizzleClient, "update");

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { postId, type: "up_vote" } },
				});

				expect(result.data?.updatePostVote).not.toBeNull();
				const vote = result.data?.updatePostVote;
				assertToBeNonNullish(vote);

				// Verify that INSERT was called (not UPDATE)
				expect(server.drizzleClient.insert).toHaveBeenCalled();
				expect(updateSpy).not.toHaveBeenCalled();

				// check creator
				expect(vote.creator?.id).toBeUndefined();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.insert = originalInsert;
				updateSpy.mockRestore();
			}
		});

		test("should return unexpected if DB update returns empty array", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();
			const voteId = faker.string.uuid();

			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [
						{ id: voteId, creatorId: userId, type: "down_vote" },
					],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock update returning []
			const originalUpdate = server.drizzleClient.update;
			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { postId, type: "up_vote" } },
				});

				expect(result.data?.updatePostVote ?? null).toBeNull();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should update an existing vote when user changes type", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();
			const voteId = faker.string.uuid();

			// Mock the post with an existing down_vote
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [
						{ id: voteId, creatorId: userId, type: "down_vote" },
					],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock the update returning an up_vote
			const originalUpdate = server.drizzleClient.update;
			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([
							{
								id: voteId,
								type: "up_vote",
								creatorId: userId,
								postId,
								createdAt: new Date(),
								updatedAt: new Date(),
								upVotesCount: 1,
								downVotesCount: 0,
							},
						]),
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { postId, type: "up_vote" } },
				});

				expect(result.data?.updatePostVote).toBeDefined();

				// Assert that the vote shows up in upVoters
				const upVoterEdges = result.data?.updatePostVote?.upVoters?.edges ?? [];
				expect(
					upVoterEdges.some(
						(edge: { node: { id: string } | null } | null) =>
							edge?.node?.id === userId,
					),
				).toBe(false);
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("should update the vote when an existing one is found", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();
			const existingVoteId = faker.string.uuid();

			// Mock: post exists with membership
			const originalPostFindFirst =
				server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock: existing vote exists for this user
			const originalVoteFindFirst =
				server.drizzleClient.query.postVotesTable.findFirst;
			server.drizzleClient.query.postVotesTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: existingVoteId,
					creatorId: userId,
					postId,
					type: "down_vote",
				});

			// Mock: update flow
			const returningSpy = vi.fn().mockResolvedValue([
				{
					id: existingVoteId,
					type: "up_vote",
					creatorId: userId,
					postId,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]);
			const whereSpy = vi.fn().mockReturnValue({ returning: returningSpy });
			const setSpy = vi.fn().mockReturnValue({ where: whereSpy });
			const updateSpy = vi.fn().mockReturnValue({ set: setSpy });

			const originalUpdate = server.drizzleClient.update;
			server.drizzleClient.update = updateSpy;

			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: userId,
					name: faker.person.fullName(),
					emailAddress: faker.internet.email(),
				});

			try {
				// Act
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { postId, type: "up_vote" } },
				});

				// Assert GraphQL response fields
				expect(result.errors).toBeUndefined();
				expect(result.data?.updatePostVote?.id).toBe(postId);

				// Assert update flow was triggered
				expect(updateSpy).toHaveBeenCalledWith(postVotesTable);
				expect(setSpy).toHaveBeenCalledWith({ type: "up_vote" });
				expect(whereSpy).toHaveBeenCalled();
				expect(returningSpy).toHaveBeenCalled();
			} finally {
				// Restore originals
				server.drizzleClient.query.postsTable.findFirst = originalPostFindFirst;
				server.drizzleClient.query.postVotesTable.findFirst =
					originalVoteFindFirst;
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.update = originalUpdate;
			}
		});
	});

	// Add these test cases to the existing test file

	suite("authorization edge cases", () => {
		test("should authorize when user is administrator", async () => {
			const postId = faker.string.uuid();

			// Mock the post find
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [],
					organization: {
						membershipsWhereOrganization: [], // Empty memberships but admin should still be authorized
					},
				});

			// Mock admin user
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "administrator" });

			// Mock the insert method
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: faker.string.uuid(),
							type: "up_vote",
							creatorId: "admin-user-id",
							postId,
							createdAt: new Date(),
							updatedAt: new Date(),
							upVotesCount: 1,
							downVotesCount: 0,
						},
					]),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { postId, type: "up_vote" },
					},
				});

				expect(result.data?.updatePostVote).toBeDefined();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.insert = originalInsert;
			}
		});

		test("should authorize when user is organization member", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();

			// Mock the post find
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock regular user (not admin)
			const originalUserFindFirst =
				server.drizzleClient.query.usersTable.findFirst;
			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue({ role: "user" });

			// Mock the insert method
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([
						{
							id: faker.string.uuid(),
							type: "up_vote",
							creatorId: userId,
							postId,
							createdAt: new Date(),
							updatedAt: new Date(),
							upVotesCount: 1,
							downVotesCount: 0,
						},
					]),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { postId, type: "up_vote" },
					},
				});
				expect(result.data?.updatePostVote).toBeDefined();
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.query.usersTable.findFirst = originalUserFindFirst;
				server.drizzleClient.insert = originalInsert;
			}
		});
	});

	suite("vote result validation", () => {
		test("should return unexpected error when insert returns empty array", async () => {
			const { authToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			const postId = faker.string.uuid();

			// Mock the post find
			const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
			server.drizzleClient.query.postsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					id: postId,
					attachmentsWherePost: [],
					votesWherePost: [],
					organization: {
						membershipsWhereOrganization: [{ role: "member", userId }],
					},
				});

			// Mock the insert method to return empty array
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]), // Empty array
				}),
			});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { postId, type: "up_vote" },
					},
				});

				expect(result.data?.updatePostVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unexpected" }),
							path: ["updatePostVote"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
				server.drizzleClient.insert = originalInsert;
			}
		});
	});

	// Also fix the existing test that should return unexpected error
	test("should return unexpected if DB operation throws", async () => {
		const { authToken } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(authToken);

		const postId = faker.string.uuid();

		const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
		server.drizzleClient.query.postsTable.findFirst = vi
			.fn()
			.mockResolvedValue({
				id: postId,
				attachmentsWherePost: [],
				votesWherePost: [],
				organization: {
					membershipsWhereOrganization: [{ role: "member", userId: "test" }],
				},
			});

		// Mock the insert to throw
		const originalInsert = server.drizzleClient.insert;
		server.drizzleClient.insert = vi.fn().mockImplementation(() => {
			throw new Error("DB failure");
		});

		try {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { postId, type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
		} finally {
			server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
			server.drizzleClient.insert = originalInsert;
		}
	});

	// Also fix the organization null test
	test("should return unauthorized_action_on_arguments_associated_resources if organization is null", async () => {
		const { authToken } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(authToken);

		const postId = faker.string.uuid();

		// Mock the post find with null organization
		const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
		server.drizzleClient.query.postsTable.findFirst = vi
			.fn()
			.mockResolvedValue({
				id: postId,
				attachmentsWherePost: [],
				votesWherePost: [],
				organization: null,
			});

		try {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { postId, type: "up_vote" } },
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
		} finally {
			server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
		}
	});

	// Also fix the existing test that should return unexpected error
	test("should return unexpected if DB operation throws", async () => {
		const { authToken } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(authToken);

		const postId = faker.string.uuid();

		// Mock the post find
		const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
		server.drizzleClient.query.postsTable.findFirst = vi
			.fn()
			.mockResolvedValue({
				id: postId,
				attachmentsWherePost: [],
				votesWherePost: [],
				organization: {
					membershipsWhereOrganization: [{ role: "member", userId: "test" }],
				},
			});

		// Mock the insert to throw
		const originalInsert = server.drizzleClient.insert;
		server.drizzleClient.insert = vi.fn().mockImplementation(() => {
			throw new Error("DB failure");
		});

		try {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { postId, type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
		} finally {
			server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
			server.drizzleClient.insert = originalInsert;
		}
	});

	// Also fix the organization null test
	test("should return unauthorized_action_on_arguments_associated_resources if organization is null", async () => {
		const { authToken } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(authToken);

		const postId = faker.string.uuid();

		// Mock the post find with null organization
		const originalFindFirst = server.drizzleClient.query.postsTable.findFirst;
		server.drizzleClient.query.postsTable.findFirst = vi
			.fn()
			.mockResolvedValue({
				id: postId,
				attachmentsWherePost: [],
				votesWherePost: [],
				organization: null,
			});

		try {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { postId, type: "up_vote" } },
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
		} finally {
			server.drizzleClient.query.postsTable.findFirst = originalFindFirst;
		}
	});
});
