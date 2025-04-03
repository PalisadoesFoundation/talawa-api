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
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createPostVote,
	Mutation_createUser,
	Mutation_deleteUser,
	Query_hasUserVoted,
	Query_signIn,
} from "../documentNodes";

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
		assertToBeNonNullish(adminSignInResult.data.signIn.user);
		cachedAdminToken = adminSignInResult.data.signIn.authenticationToken;
		cachedAdminUserId = adminSignInResult.data.signIn.user.id;
		return {
			cachedAdminToken,
			cachedAdminUserId,
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
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			// create a post
			console.log("second");
			const { postId } = await createTestPost(cachedAdminUserId);
			console.log("first");
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
				"arguments_associated_resources_not_found",
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

	suite("Authentication Tests", () => {
		test("returns error if user is not a member of the organization", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			// create a post
			const { postId, organizationId } =
				await createTestPost(cachedAdminUserId);

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
			console.log(JSON.stringify(hasUserVotedResponse, null, 2));
			expect(hasUserVotedResponse.data.hasUserVoted).toEqual(null);
			expect(hasUserVotedResponse.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
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
			expect(hasUserVotedResponse.data.hasUserVoted?.type).toEqual("down_vote");
		});
	});
});

// function to create a post using the auth token

const createTestPost = async (creatorId: string) => {
	console.log("flksjalkfja");
	const [organizationRow] = await server.drizzleClient
		.insert(organizationsTable)
		.values({
			name: faker.company.name(),
			countryCode: "us",
			userRegistrationRequired: false,
		})
		.returning({ id: organizationsTable.id });
	console.log("idhar tak chal rha");
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
