import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import {
	organizationMembershipsTable,
	organizationsTable,
	postsTable,
} from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createCommentVote,
	Query_commentWithHasUserVoted,
	Query_signIn,
} from "../documentNodes";

// TypeScript interfaces for GraphQL responses
interface HasUserVotedComment {
	hasVoted: boolean;
	voteType: string | null;
}

/**
 * Helper function to get admin auth token with proper error handling
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
		if (adminSignInResult.errors) {
			throw new Error(
				`Admin authentication failed: ${adminSignInResult.errors[0]?.message || "Unknown error"}`,
			);
		}
		if (!adminSignInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Admin authentication succeeded but no token was returned",
			);
		}
		assertToBeNonNullish(adminSignInResult.data.signIn.user);
		const token = adminSignInResult.data.signIn.authenticationToken;
		const id = adminSignInResult.data.signIn.user.id;
		cachedAdminToken = token;
		cachedAdminUserId = id;
		return {
			cachedAdminToken: token,
			cachedAdminUserId: id,
		};
	} catch (error) {
		throw new Error(
			`Failed to get admin authentication token: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Helper function to create a test organization, post, and comment
 */
async function createTestComment(creatorId: string): Promise<{
	commentId: string;
	postId: string;
	organizationId: string;
}> {
	const [organizationRow] = await server.drizzleClient
		.insert(organizationsTable)
		.values({
			name: faker.company.name(),
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

	const { cachedAdminToken } = await getAdminAuthToken();
	const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
		headers: {
			authorization: `bearer ${cachedAdminToken}`,
		},
		variables: {
			input: {
				body: faker.lorem.sentence(),
				postId: postId,
			},
		},
	});

	assertToBeNonNullish(commentResult.data);
	assertToBeNonNullish(commentResult.data.createComment);
	assertToBeNonNullish(commentResult.data.createComment.id);

	const commentId = commentResult.data.createComment.id;

	return { commentId, postId, organizationId };
}

/**
 * Helper function to assert and extract hasUserVoted response
 */
function getHasUserVotedData(response: {
	data?: {
		comment?: {
			hasUserVoted?: unknown;
		} | null;
	} | null;
	errors?: Array<{ message: string }>;
}): HasUserVotedComment {
	expect(response.errors).toBeUndefined();
	assertToBeNonNullish(response.data);
	assertToBeNonNullish(response.data.comment);
	assertToBeNonNullish(response.data.comment.hasUserVoted);
	return response.data.comment.hasUserVoted as HasUserVotedComment;
}

suite("Comment: hasUserVoted field", () => {
	suite("HasUserVotedComment type fields", () => {
		test("hasVoted field returns false when user has not voted", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			const { commentId } = await createTestComment(cachedAdminUserId);

			const response = await mercuriusClient.query(
				Query_commentWithHasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							id: commentId,
						},
						userId: cachedAdminUserId,
					},
				},
			);

			expect(response.errors).toBeUndefined();
			assertToBeNonNullish(response.data);
			assertToBeNonNullish(response.data.comment);
			assertToBeNonNullish(response.data.comment.hasUserVoted);
			const hasUserVotedData = getHasUserVotedData(response);
			expect(hasUserVotedData.hasVoted).toBe(false);
			expect(hasUserVotedData.voteType).toBeNull();
		});

		test("voteType field returns null when user has not voted", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			const { commentId } = await createTestComment(cachedAdminUserId);

			const response = await mercuriusClient.query(
				Query_commentWithHasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							id: commentId,
						},
						userId: cachedAdminUserId,
					},
				},
			);

			expect(response.errors).toBeUndefined();
			assertToBeNonNullish(response.data);
			assertToBeNonNullish(response.data.comment);
			assertToBeNonNullish(response.data.comment.hasUserVoted);
			const hasUserVotedData = getHasUserVotedData(response);
			expect(hasUserVotedData.voteType).toBeNull();
		});

		test("hasVoted field returns true when user has voted", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			const { commentId } = await createTestComment(cachedAdminUserId);

			// Create a comment vote
			const voteResult = await mercuriusClient.mutate(
				Mutation_createCommentVote,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							commentId: commentId,
							type: "up_vote",
						},
					},
				},
			);

			// Ensure vote creation was successful
			expect(voteResult.errors).toBeUndefined();

			const response = await mercuriusClient.query(
				Query_commentWithHasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							id: commentId,
						},
						userId: cachedAdminUserId,
					},
				},
			);

			expect(response.errors).toBeUndefined();
			assertToBeNonNullish(response.data);
			assertToBeNonNullish(response.data.comment);
			assertToBeNonNullish(response.data.comment.hasUserVoted);
			const hasUserVotedData = getHasUserVotedData(response);
			expect(hasUserVotedData.hasVoted).toBe(true);
		});

		test("voteType field returns correct vote type when user has voted", async () => {
			const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
			const { commentId } = await createTestComment(cachedAdminUserId);

			// Create a down vote
			await mercuriusClient.mutate(Mutation_createCommentVote, {
				headers: {
					authorization: `bearer ${cachedAdminToken}`,
				},
				variables: {
					input: {
						commentId: commentId,
						type: "down_vote",
					},
				},
			});

			const response = await mercuriusClient.query(
				Query_commentWithHasUserVoted,
				{
					headers: {
						authorization: `bearer ${cachedAdminToken}`,
					},
					variables: {
						input: {
							id: commentId,
						},
						userId: cachedAdminUserId,
					},
				},
			);

			expect(response.errors).toBeUndefined();
			assertToBeNonNullish(response.data);
			assertToBeNonNullish(response.data.comment);
			assertToBeNonNullish(response.data.comment.hasUserVoted);
			expect(getHasUserVotedData(response).voteType).toBe("down_vote");
		});
	});
});
