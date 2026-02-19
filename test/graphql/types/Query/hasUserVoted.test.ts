import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";
import {
	organizationMembershipsTable,
	organizationsTable,
	postsTable,
	usersTable,
} from "~/src/drizzle/schema";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createPostVote,
	Mutation_createUser,
	Mutation_deletePostVote,
	Mutation_deleteUser,
	Query_currentUser,
	Query_hasUserVoted,
	Query_postWithHasUserVoted,
} from "../documentNodes";

// TypeScript interfaces for GraphQL responses
interface HasUserVotedResponse {
	hasVoted: boolean;
	voteType: string | null;
}

/**
 * Helper function to get admin auth token with proper error handling
 * @throws {Error} If admin credentials are invalid or missing
 * @returns {Promise<{
 * cachedAdminToken: string;
 * cachedAdminUserId: string;
 * }>} Admin authentication token and user ID
 */
let cachedAdminUserId: string | null = null;
let cachedAdminToken: string | null = null;
async function getAdminAuthToken(): Promise<{
	cachedAdminToken: string;
	cachedAdminUserId: string;
}> {
	if (cachedAdminToken && cachedAdminUserId) {
		return { cachedAdminToken, cachedAdminUserId };
	}

	try {
		const { accessToken: token } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(token);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${token}` },
		});
		const id = currentUserResult.data?.currentUser?.id;
		assertToBeNonNullish(id);
		cachedAdminToken = token;
		cachedAdminUserId = id;
		return {
			cachedAdminToken: token,
			cachedAdminUserId: id,
		};
	} catch (error) {
		// Wrap and rethrow with more context
		throw new Error(
			`Failed to get admin authentication token: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

interface TestUser {
	authToken: string;
	userId: string;
	cleanup: () => Promise<void>;
}

async function createRegularUser(): Promise<TestUser> {
	const { cachedAdminToken: adminAuthToken } = await getAdminAuthToken();

	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				emailAddress: `email${faker.string.uuid()}@test.com`,
				password: "password123",
				role: "regular",
				name: "Test User",
				isEmailAddressVerified: false,
			},
		},
	});

	// Assert data exists
	assertToBeNonNullish(userResult.data);
	// Assert createUser exists
	assertToBeNonNullish(userResult.data.createUser);
	// Assert user exists and has id
	assertToBeNonNullish(userResult.data.createUser.user);
	assertToBeNonNullish(userResult.data.createUser.user.id);
	// Assert authenticationToken exists
	assertToBeNonNullish(userResult.data.createUser.authenticationToken);

	const userId = userResult.data.createUser.user.id;
	const authToken = userResult.data.createUser.authenticationToken;

	return {
		authToken,
		userId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: userId } },
			});
		},
	};
}

/**
 * Helper function to safely extract hasUserVoted data from post response
 */
function getPostHasUserVotedData(response: {
	data?: {
		post?: {
			hasUserVoted?: unknown;
		} | null;
	} | null;
	errors?: Array<{ message: string }>;
}): HasUserVotedResponse {
	expect(response.errors).toBeUndefined();
	assertToBeNonNullish(response.data);
	assertToBeNonNullish(response.data.post);
	assertToBeNonNullish(response.data.post.hasUserVoted);
	return response.data.post.hasUserVoted as HasUserVotedResponse;
}

suite("Query: hasUserVoted", () => {
	suite("Authentication Tests", () => {
		test("returns error if client is not authenticated", async () => {
			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					variables: {
						input: {
							postId: faker.string.uuid(),
						},
					},
				},
			);
			expect(hasUserVotedResponse.data.hasUserVoted).toBeNull();
			expect(hasUserVotedResponse.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("returns error with invalid authentication token", async () => {
			const invalidToken = Buffer.from(faker.string.alphanumeric(32)).toString(
				"base64",
			);
			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${invalidToken}`,
					},
					variables: {
						input: {
							postId: faker.string.uuid(),
						},
					},
				},
			);

			expect(hasUserVotedResponse.data.hasUserVoted).toEqual(null);
			expect(hasUserVotedResponse.errors?.[0]?.extensions?.code).toBe(
				"unauthenticated",
			);
		});

		test("returns error if user exists in token but not in database", async () => {
			// First create a user and get their token
			const regularUserResult = await createRegularUser();

			// Delete the user from database while their token is still valid
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUserResult.userId));

			// Try to query using the token of deleted user
			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${regularUserResult.authToken}`,
					},
					variables: {
						input: {
							postId: faker.string.uuid(),
						},
					},
				},
			);

			expect(hasUserVotedResponse.data.hasUserVoted).toEqual(null);
			expect(hasUserVotedResponse.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
	});
	suite("Input Validation Tests", () => {
		test("returns error with 'invalid_argument' code if postId is not a valid UUID", async () => {
			const { cachedAdminToken: adminAuthToken } = await getAdminAuthToken();
			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							postId: "invalid-uuid-string",
						},
					},
				},
			);
			expect(hasUserVotedResponse.data.hasUserVoted).toEqual(null);
			expect(hasUserVotedResponse.errors?.[0]?.extensions?.code).toBe(
				"invalid_arguments",
			);
		});
	});
	suite("Resource Existence Tests", () => {
		test("returns error if post does not exist", async () => {
			const { cachedAdminToken: adminAuthToken } = await getAdminAuthToken();
			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							postId: faker.string.uuid(),
						},
					},
				},
			);
			expect(hasUserVotedResponse.data.hasUserVoted).toEqual(null);
			expect(hasUserVotedResponse.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});
	});
	suite("Authentication Tests", () => {
		test("returns error if user is not a member of the organization", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			// create a post
			const { postId, organizationId } =
				await createTestPost(cachedAdminUserId);

			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(
					and(
						eq(organizationMembershipsTable.memberId, cachedAdminUserId),
						eq(organizationMembershipsTable.organizationId, organizationId),
					),
				);

			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							postId,
						},
					},
				},
			);
			expect(hasUserVotedResponse.data.hasUserVoted).toEqual(null);
			expect(hasUserVotedResponse.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});
		test("hasVoted in hasUserVoted is false if user has not voted", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			// create a post
			const { postId } = await createTestPost(cachedAdminUserId);

			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							postId,
						},
					},
				},
			);
			expect(hasUserVotedResponse.data.hasUserVoted).not.toEqual(null);
			expect(hasUserVotedResponse.errors).toEqual(undefined);
			expect(hasUserVotedResponse.data.hasUserVoted?.voteType).toEqual(null);
			expect(hasUserVotedResponse.data.hasUserVoted?.hasVoted).toEqual(false);
		});
		test("allows access if user is a member of the organization", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			// create a post
			const { postId } = await createTestPost(cachedAdminUserId);
			// create a post vote
			await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: {
					authorization: `bearer ${cachedAdminToken}`,
				},
				variables: {
					input: {
						postId: postId,
						type: "down_vote",
					},
				},
			});

			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							postId,
						},
					},
				},
			);
			expect(hasUserVotedResponse.data.hasUserVoted).not.toEqual(null);
			expect(hasUserVotedResponse.errors).toEqual(undefined);
			expect(hasUserVotedResponse.data.hasUserVoted?.voteType).toEqual(
				"down_vote",
			);
			expect(hasUserVotedResponse.data.hasUserVoted?.hasVoted).toEqual(true);

			// Clean up: Delete the vote to prevent interference with other tests
			await mercuriusClient.mutate(Mutation_deletePostVote, {
				headers: {
					authorization: `bearer ${cachedAdminToken}`,
				},
				variables: {
					input: {
						postId: postId,
						creatorId: cachedAdminUserId,
					},
				},
			});
		});
	});
	suite("Post hasUserVoted Field Tests", () => {
		test("hasUserVoted field returns {voteType: null, hasVoted: false} when user has not voted on post", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			// create a post
			const { postId } = await createTestPost(cachedAdminUserId);

			const postWithHasUserVotedResponse = await mercuriusClient.query(
				Query_postWithHasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							id: postId,
						},
						userId: cachedAdminUserId,
					},
				},
			);

			expect(postWithHasUserVotedResponse.data.post).not.toEqual(null);
			expect(postWithHasUserVotedResponse.errors).toEqual(undefined);
			const hasUserVotedData = getPostHasUserVotedData(
				postWithHasUserVotedResponse,
			);
			expect(hasUserVotedData.voteType).toEqual(null);
			expect(hasUserVotedData.hasVoted).toEqual(false);
		});

		test("hasUserVoted field returns {voteType: vote.type, hasVoted: true} when user has voted on post", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			// create a post
			const { postId } = await createTestPost(cachedAdminUserId);
			// create a post vote
			await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: {
					authorization: `bearer ${cachedAdminToken}`,
				},
				variables: {
					input: {
						postId: postId,
						type: "up_vote",
					},
				},
			});

			const postWithHasUserVotedResponse = await mercuriusClient.query(
				Query_postWithHasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							id: postId,
						},
						userId: cachedAdminUserId,
					},
				},
			);

			expect(postWithHasUserVotedResponse.data.post).not.toEqual(null);
			expect(postWithHasUserVotedResponse.errors).toEqual(undefined);
			const hasUserVotedData = getPostHasUserVotedData(
				postWithHasUserVotedResponse,
			);
			expect(hasUserVotedData.voteType).toEqual("up_vote");
			expect(hasUserVotedData.hasVoted).toEqual(true);

			// Clean up: Delete the vote to prevent interference with other tests
			await mercuriusClient.mutate(Mutation_deletePostVote, {
				headers: {
					authorization: `bearer ${cachedAdminToken}`,
				},
				variables: {
					input: {
						postId: postId,
						creatorId: cachedAdminUserId,
					},
				},
			});
		});
	});
});

// function to create a post using the auth token

const createTestPost = async (creatorId: string) => {
	const [organizationRow] = await server.drizzleClient
		.insert(organizationsTable)
		.values({
			name: `${faker.company.name()} ${faker.string.uuid()}`,
			countryCode: "us",
			userRegistrationRequired: false,
		})
		.returning({ id: organizationsTable.id });
	const organizationId = organizationRow?.id;
	if (!organizationId) throw new Error("Failed to create organization.");
	await server.drizzleClient.insert(organizationMembershipsTable).values({
		organizationId,
		memberId: creatorId,
		role: "administrator",
	});
	const [postRow] = await server.drizzleClient
		.insert(postsTable)
		.values({
			caption: faker.lorem.paragraph(),
			creatorId,
			organizationId,
		})
		.returning({ id: postsTable.id });

	const postId = postRow?.id;
	if (!postId) throw new Error("Failed to create post.");

	return { postId, organizationId };
};
