import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";
import { usersTable } from "~/src/drizzle/schema";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_createPostVote,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_hasUserVoted,
	Query_signIn,
} from "../documentNodes";

/**
 * Helper function to get admin auth token with proper error handling
 * @throws {Error} If admin credentials are invalid or missing
 * @returns {Promise<string>} Admin authentication token
 */
let cachedAdminToken: string | null = null;
async function getAdminAuthToken(): Promise<string> {
	if (cachedAdminToken) {
		return cachedAdminToken;
	}

	try {
		// Check if admin credentials exist
		if (
			!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
			!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
		) {
			throw new Error(
				"Admin credentials are missing in environment configuration",
			);
		}
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		// Check for GraphQL errors
		if (adminSignInResult.errors) {
			throw new Error(
				`Admin authentication failed: ${adminSignInResult.errors[0]?.message || "Unknown error"}`,
			);
		}
		// Check for missing data
		if (!adminSignInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Admin authentication succeeded but no token was returned",
			);
		}
		cachedAdminToken = adminSignInResult.data.signIn.authenticationToken;
		return cachedAdminToken;
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
	const adminAuthToken = await getAdminAuthToken();

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
	suite("Resource validation tests", () => {
		test("return error if post vote does not exist", async () => {
			const adminAuthToken = await getAdminAuthToken();
			// create a post
			const { postId } = await createPost(adminAuthToken);
			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
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
				"arguments_associated_resources_not_found",
			);
		});
	});
	suite("Input Validation Tests", () => {
		test("returns error with 'invalid_argument' code if postId is not a valid UUID", async () => {
			const adminAuthToken = await getAdminAuthToken();
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

	suite("Authentication Tests", () => {
		test("returns error if user is not a member of the organization", async () => {
			const adminAuthToken = await getAdminAuthToken();
			// create a post
			const { postId } = await createPost(adminAuthToken);
			// create a post vote
			const creatPostVoteResult = await mercuriusClient.mutate(
				Mutation_createPostVote,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							postId: postId,
							type: "down_vote",
						},
					},
				},
			);
			const { authToken } = await createRegularUser();
			const hasUserVotedResponse = await mercuriusClient.query(
				Query_hasUserVoted,
				{
					headers: {
						authorization: `bearer ${authToken}`,
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

		test("allows access if user is a member of the organization", async () => {
			const adminAuthToken = await getAdminAuthToken();
			// create a post
			const { postId } = await createPost(adminAuthToken);
			// create a post vote
			await mercuriusClient.mutate(Mutation_createPostVote, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
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
						authorization: `bearer ${adminAuthToken}`,
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
			expect(hasUserVotedResponse.data.hasUserVoted?.type).toEqual("down_vote");
		});
	});
});

// function to create a post using the auth token

async function createPost(authToken: string) {
	const createOrganizationResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					name: "Test Organization",
				},
			},
		},
	);
	assertToBeNonNullish(createOrganizationResult.data);
	assertToBeNonNullish(createOrganizationResult.data.createOrganization);
	expect(createOrganizationResult.data.createOrganization?.name).not.toBeNull();
	expect(createOrganizationResult.data.createOrganization?.id).not.toBeNull();
	const postResult = await mercuriusClient.mutate(Mutation_createPost, {
		headers: {
			authorization: `bearer ${authToken}`,
		},
		variables: {
			input: {
				organizationId: createOrganizationResult.data.createOrganization.id,
				caption: "Test Post",
				attachments: [],
			},
		},
	});

	assertToBeNonNullish(postResult.data);
	assertToBeNonNullish(postResult.data.createPost);
	expect(postResult.data.createPost?.id).not.toBeNull();
	expect(postResult.data.createPost?.caption).not.toBeNull();
	return {
		orgId: createOrganizationResult.data.createOrganization.id,
		postId: postResult.data.createPost.id,
	};
}
