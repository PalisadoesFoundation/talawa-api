import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";
import {
	commentsTable,
	organizationMembershipsTable,
	organizationsTable,
	postsTable,
	usersTable,
} from "~/src/drizzle/schema";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createCommentVote,
	Mutation_createUser,
	Mutation_deleteCommentVote,
	Query_commentWithHasUserVoted,
	Query_signIn,
} from "../documentNodes";

// TypeScript interfaces for GraphQL responses
interface HasUserVotedComment {
	hasVoted: boolean;
	voteType: string | null;
}

// Track created entities for cleanup
const createdUserIds: string[] = [];
const createdOrganizationIds: string[] = [];
const createdPostIds: string[] = [];
const createdCommentIds: string[] = [];

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
 * Helper function to create a regular user for testing
 */
async function createRegularUser(): Promise<{
	userId: string;
	authToken: string;
	emailAddress: string;
}> {
	const emailAddress = faker.internet.email().toLowerCase();
	const password = faker.internet.password({ length: 8 });

	const { cachedAdminToken } = await getAdminAuthToken();

	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${cachedAdminToken}`,
		},
		variables: {
			input: {
				emailAddress,
				name: `${faker.person.firstName()} ${faker.person.lastName()}`,
				password,
				isEmailAddressVerified: true,
				role: "regular",
			},
		},
	});

	if (createUserResult.errors) {
		throw new Error(
			`User creation failed: ${JSON.stringify(createUserResult.errors)}`,
		);
	}

	assertToBeNonNullish(createUserResult.data);
	assertToBeNonNullish(createUserResult.data.createUser);
	assertToBeNonNullish(createUserResult.data.createUser.user);

	const userId = createUserResult.data.createUser.user.id;
	createdUserIds.push(userId);

	// Sign in to get auth token
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress,
				password,
			},
		},
	});

	assertToBeNonNullish(signInResult.data);
	assertToBeNonNullish(signInResult.data.signIn);

	assertToBeNonNullish(signInResult.data.signIn.authenticationToken);
	const authToken = signInResult.data.signIn.authenticationToken;

	return { userId, authToken, emailAddress };
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
			name: `${faker.company.name()} ${faker.string.ulid()}`,
			countryCode: "us",
			userRegistrationRequired: false,
		})
		.returning({ id: organizationsTable.id });
	const organizationId = organizationRow?.id;
	if (!organizationId) throw new Error("Failed to create organization.");
	createdOrganizationIds.push(organizationId);

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
	createdPostIds.push(postId);

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
	createdCommentIds.push(commentId);

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
	afterEach(async () => {
		// Delete comments first (will cascade votes if FK is configured)
		for (const id of createdCommentIds.splice(0)) {
			await server.drizzleClient
				.delete(commentsTable)
				.where(eq(commentsTable.id, id));
		}
		// Delete posts
		for (const id of createdPostIds.splice(0)) {
			await server.drizzleClient
				.delete(postsTable)
				.where(eq(postsTable.id, id));
		}
		// Delete organizations
		for (const id of createdOrganizationIds.splice(0)) {
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, id));
		}
		// Delete users
		for (const id of createdUserIds.splice(0)) {
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, id));
		}
	});

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

		// Clean up: Delete the vote to prevent interference with other tests
		await mercuriusClient.mutate(Mutation_deleteCommentVote, {
			headers: {
				authorization: `bearer ${cachedAdminToken}`,
			},
			variables: {
				input: {
					commentId: commentId,
					creatorId: cachedAdminUserId,
				},
			},
		});
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

		// Clean up: Delete the vote to prevent interference with other tests
		await mercuriusClient.mutate(Mutation_deleteCommentVote, {
			headers: {
				authorization: `bearer ${cachedAdminToken}`,
			},
			variables: {
				input: {
					commentId: commentId,
					creatorId: cachedAdminUserId,
				},
			},
		});
	});

	test("voteType field returns 'up_vote' when user upvoted", async () => {
		const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
		const { commentId } = await createTestComment(cachedAdminUserId);

		await mercuriusClient.mutate(Mutation_createCommentVote, {
			headers: {
				authorization: `bearer ${cachedAdminToken}`,
			},
			variables: {
				input: {
					commentId: commentId,
					type: "up_vote",
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

		expect(getHasUserVotedData(response).voteType).toBe("up_vote");

		// Clean up: Delete the vote to prevent interference with other tests
		await mercuriusClient.mutate(Mutation_deleteCommentVote, {
			headers: {
				authorization: `bearer ${cachedAdminToken}`,
			},
			variables: {
				input: {
					commentId: commentId,
					creatorId: cachedAdminUserId,
				},
			},
		});
	});
	test("throws unauthenticated error when no auth token provided", async () => {
		const { cachedAdminUserId } = await getAdminAuthToken();
		const { commentId } = await createTestComment(cachedAdminUserId);

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				variables: {
					input: {
						id: commentId,
					},
					userId: cachedAdminUserId,
				},
			},
		);

		expect(response.data?.comment).toBeNull();
		expect(response.errors).toEqual(
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

	test("throws unauthenticated error when invalid auth token provided", async () => {
		const { cachedAdminUserId } = await getAdminAuthToken();
		const { commentId } = await createTestComment(cachedAdminUserId);
		const invalidToken = Buffer.from(faker.string.alphanumeric(32)).toString(
			"base64",
		);

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${invalidToken}`,
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: cachedAdminUserId,
				},
			},
		);

		expect(response.data?.comment).toBeNull();
		expect(response.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("allows user to check their own voting status", async () => {
		const regularUser = await createRegularUser();
		const { cachedAdminUserId } = await getAdminAuthToken();
		const { commentId, organizationId } =
			await createTestComment(cachedAdminUserId);

		// Make the regular user a member of the organization so they can access the comment
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			organizationId,
			memberId: regularUser.userId,
			role: "regular",
		});

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: regularUser.userId, // User checking their own vote
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

	test("throws unauthorized_action when user tries to check another user's voting status", async () => {
		const regularUser1 = await createRegularUser();
		const regularUser2 = await createRegularUser();
		const { cachedAdminUserId } = await getAdminAuthToken();
		const { commentId, organizationId } =
			await createTestComment(cachedAdminUserId);

		// Make regularUser1 a member of the organization so they can access the comment
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			organizationId,
			memberId: regularUser1.userId,
			role: "regular",
		});

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${regularUser1.authToken}`,
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: regularUser2.userId, // User1 trying to check User2's vote
				},
			},
		);

		// The comment should be accessible, but hasUserVoted should be null due to authorization error
		assertToBeNonNullish(response.data?.comment);
		expect(response.data?.comment.hasUserVoted).toBeNull();
		expect(response.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthorizedActionExtensions>({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("allows system administrator to check any user's voting status", async () => {
		const regularUser = await createRegularUser();
		const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
		const { commentId } = await createTestComment(cachedAdminUserId);

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${cachedAdminToken}`, // System admin token
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: regularUser.userId, // Admin checking regular user's vote
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

	test("allows organization administrator to check other user's voting status within their organization", async () => {
		const regularUser = await createRegularUser();
		const orgAdmin = await createRegularUser();

		// Create organization and make orgAdmin an administrator
		const [organizationRow] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `${faker.company.name()} ${faker.string.ulid()}`,
				countryCode: "us",
				userRegistrationRequired: false,
			})
			.returning({ id: organizationsTable.id });
		const organizationId = organizationRow?.id;
		assertToBeNonNullish(organizationId);
		createdOrganizationIds.push(organizationId);

		// Add orgAdmin as organization administrator
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			organizationId,
			memberId: orgAdmin.userId,
			role: "administrator",
		});

		// Add regularUser as regular member
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			organizationId,
			memberId: regularUser.userId,
			role: "regular",
		});

		// Create post and comment in this organization
		const [postRow] = await server.drizzleClient
			.insert(postsTable)
			.values({
				caption: faker.lorem.paragraph(),
				creatorId: orgAdmin.userId,
				organizationId,
			})
			.returning({ id: postsTable.id });
		const postId = postRow?.id;
		assertToBeNonNullish(postId);
		createdPostIds.push(postId);

		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			headers: {
				authorization: `bearer ${orgAdmin.authToken}`,
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
		const commentId = commentResult.data.createComment.id;
		createdCommentIds.push(commentId);

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`, // Org admin token
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: regularUser.userId, // Org admin checking regular user's vote
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

	test("throws unauthorized_action when regular org member tries to check another user's voting status", async () => {
		const regularUser1 = await createRegularUser();
		const regularUser2 = await createRegularUser();
		const { cachedAdminUserId } = await getAdminAuthToken();

		// Create organization and add both users as regular members
		const [organizationRow] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `${faker.company.name()} ${faker.string.ulid()}`,
				countryCode: "us",
				userRegistrationRequired: false,
			})
			.returning({ id: organizationsTable.id });
		const organizationId = organizationRow?.id;
		assertToBeNonNullish(organizationId);
		createdOrganizationIds.push(organizationId);

		await server.drizzleClient.insert(organizationMembershipsTable).values([
			{
				organizationId,
				memberId: regularUser1.userId,
				role: "regular", // Regular member
			},
			{
				organizationId,
				memberId: regularUser2.userId,
				role: "regular", // Regular member
			},
		]);

		// Create post and comment in this organization
		const [postRow] = await server.drizzleClient
			.insert(postsTable)
			.values({
				caption: faker.lorem.paragraph(),
				creatorId: cachedAdminUserId,
				organizationId,
			})
			.returning({ id: postsTable.id });
		const postId = postRow?.id;
		assertToBeNonNullish(postId);
		createdPostIds.push(postId);

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
		const commentId = commentResult.data.createComment.id;
		createdCommentIds.push(commentId);

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${regularUser1.authToken}`, // Regular member token
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: regularUser2.userId, // Member1 trying to check Member2's vote
				},
			},
		);

		// The comment should be accessible since both users are members, but hasUserVoted should be null due to authorization error
		assertToBeNonNullish(response.data?.comment);
		expect(response.data?.comment.hasUserVoted).toBeNull();
		expect(response.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthorizedActionExtensions>({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("throws arguments_associated_resources_not_found for non-existent comment", async () => {
		const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
		const fakeCommentId = faker.string.uuid();

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${cachedAdminToken}`,
				},
				variables: {
					input: {
						id: fakeCommentId,
					},
					userId: cachedAdminUserId,
				},
			},
		);

		expect(response.data?.comment).toBeNull();
		expect(response.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("throws unauthenticated error if user exists in token but not in database", async () => {
		const regularUser = await createRegularUser();
		const { cachedAdminUserId } = await getAdminAuthToken();
		const { commentId } = await createTestComment(cachedAdminUserId);

		// Delete the user from database while their token is still valid
		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, regularUser.userId));

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: regularUser.userId,
				},
			},
		);

		expect(response.data?.comment).toBeNull();
		expect(response.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("throws unauthorized_action when user is not member of post's organization", async () => {
		const regularUser = await createRegularUser();
		const { cachedAdminUserId } = await getAdminAuthToken();
		const { commentId, organizationId } =
			await createTestComment(cachedAdminUserId);

		// Ensure regularUser is not a member of the organization's post/comment
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, regularUser.userId),
					eq(organizationMembershipsTable.organizationId, organizationId),
				),
			);

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: cachedAdminUserId, // Trying to check admin's vote while not being org member
				},
			},
		);

		expect(response.data?.comment).toBeNull();
		expect(response.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("allows checking vote status for non-existent userId argument", async () => {
		const { cachedAdminToken, cachedAdminUserId } = await getAdminAuthToken();
		const { commentId } = await createTestComment(cachedAdminUserId);
		const nonExistentUserId = faker.string.uuid();

		const response = await mercuriusClient.query(
			Query_commentWithHasUserVoted,
			{
				headers: {
					authorization: `bearer ${cachedAdminToken}`, // Admin can check any userId
				},
				variables: {
					input: {
						id: commentId,
					},
					userId: nonExistentUserId, // Non-existent user ID
				},
			},
		);

		expect(response.errors).toBeUndefined();
		assertToBeNonNullish(response.data);
		assertToBeNonNullish(response.data.comment);
		assertToBeNonNullish(response.data.comment.hasUserVoted);
		const hasUserVotedData = getHasUserVotedData(response);
		// Should return false for non-existent user (no vote exists)
		expect(hasUserVotedData.hasVoted).toBe(false);
		expect(hasUserVotedData.voteType).toBeNull();
	});
});
