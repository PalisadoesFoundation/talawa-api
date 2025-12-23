import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import {
	commentsTable,
	commentVotesTable,
	organizationMembershipsTable,
	organizationsTable,
	postsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn } from "../documentNodes";

// --- GraphQL Query Definition ---
const Query_comment_downVotesCount = `
  query Query_comment($input: QueryCommentInput!) {
    comment(input: $input) {
      id
      downVotesCount
    }
  }
`;

// --- Cleanup Tracking ---
const createdUserIds: string[] = [];
const createdOrganizationIds: string[] = [];
const createdPostIds: string[] = [];
const createdCommentIds: string[] = [];

// --- Helper Functions ---

async function getAdminAuthToken() {
	const email = server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	const password = server.envConfig.API_ADMINISTRATOR_USER_PASSWORD;

	if (!email || !password) {
		throw new Error("Admin credentials missing from environment config");
	}

	const result = await mercuriusClient.query(Query_signIn, {
		variables: { input: { emailAddress: email, password } },
	});

	const token = result.data?.signIn?.authenticationToken;
	const userId = result.data?.signIn?.user?.id;

	if (!token || !userId) {
		throw new Error("Failed to authenticate admin user");
	}

	return { token, userId };
}

/**
 * Creates a test user for voting scenarios
 */
async function createTestUser() {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();

	const [user] = await server.drizzleClient
		.insert(usersTable)
		.values({
			emailAddress: `${faker.string.uuid()}@example.com`,
			name: `${firstName} ${lastName}`,
			passwordHash: faker.internet.password(),
			isEmailAddressVerified: false,
			role: "regular",
		})
		.returning({ id: usersTable.id });

	if (!user) {
		throw new Error("Failed to create test user");
	}

	createdUserIds.push(user.id);
	return user.id;
}

/**
 * Creates a complete test comment with org, post, and comment
 */
async function createTestComment(creatorId: string) {
	// 1. Create Organization
	const [org] = await server.drizzleClient
		.insert(organizationsTable)
		.values({
			name: faker.company.name(),
			countryCode: "us",
			userRegistrationRequired: false,
		})
		.returning({ id: organizationsTable.id });

	if (!org) throw new Error("Failed to create organization");
	createdOrganizationIds.push(org.id);

	// 2. Add creator to organization
	await server.drizzleClient.insert(organizationMembershipsTable).values({
		organizationId: org.id,
		memberId: creatorId,
		role: "administrator",
	});

	// 3. Create Post
	const [post] = await server.drizzleClient
		.insert(postsTable)
		.values({
			caption: faker.lorem.sentence(),
			creatorId,
			organizationId: org.id,
		})
		.returning({ id: postsTable.id });

	if (!post) throw new Error("Failed to create post");
	createdPostIds.push(post.id);

	// 4. Create Comment
	const [comment] = await server.drizzleClient
		.insert(commentsTable)
		.values({
			body: faker.lorem.sentence(),
			postId: post.id,
			creatorId,
		})
		.returning({ id: commentsTable.id });

	if (!comment) throw new Error("Failed to create comment");
	createdCommentIds.push(comment.id);

	return { commentId: comment.id, postId: post.id, orgId: org.id };
}

async function addVoteToComment(
	commentId: string,
	userId: string,
	type: "up_vote" | "down_vote",
) {
	await server.drizzleClient.insert(commentVotesTable).values({
		commentId,
		creatorId: userId,
		type,
	});
}

// --- Test Suite ---

suite("Comment: downVotesCount field", () => {
	let adminToken: string;
	let adminUserId: string;

	beforeAll(async () => {
		const auth = await getAdminAuthToken();
		adminToken = auth.token;
		adminUserId = auth.userId;
	});

	afterEach(async () => {
		// Clean up in reverse dependency order to avoid foreign key violations

		// 1. Delete all comment votes
		for (const commentId of createdCommentIds) {
			await server.drizzleClient
				.delete(commentVotesTable)
				.where(eq(commentVotesTable.commentId, commentId));
		}

		// 2. Delete all comments
		for (const id of createdCommentIds.splice(0)) {
			await server.drizzleClient
				.delete(commentsTable)
				.where(eq(commentsTable.id, id));
		}

		// 3. Delete all posts
		for (const id of createdPostIds.splice(0)) {
			await server.drizzleClient
				.delete(postsTable)
				.where(eq(postsTable.id, id));
		}

		// 4. Delete organization memberships
		for (const orgId of createdOrganizationIds) {
			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(eq(organizationMembershipsTable.organizationId, orgId));
		}

		// 5. Delete organizations
		for (const id of createdOrganizationIds.splice(0)) {
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, id));
		}

		// 6. Delete test users (not admin)
		for (const id of createdUserIds.splice(0)) {
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, id));
		}
	});

	test("should return 0 when comment has no votes", async () => {
		const { commentId } = await createTestComment(adminUserId);

		const response = await mercuriusClient.query(Query_comment_downVotesCount, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: commentId } },
		});

		expect(response.errors).toBeUndefined();
		expect(response.data?.comment?.downVotesCount).toBe(0);
	});

	test("should return 1 when comment has single downvote", async () => {
		const { commentId } = await createTestComment(adminUserId);

		await addVoteToComment(commentId, adminUserId, "down_vote");

		const response = await mercuriusClient.query(Query_comment_downVotesCount, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: commentId } },
		});

		expect(response.errors).toBeUndefined();
		expect(response.data?.comment?.downVotesCount).toBe(1);
	});

	test("should return correct count with multiple downvotes from different users", async () => {
		const { commentId } = await createTestComment(adminUserId);

		// Create additional test users and have them downvote
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		const user3 = await createTestUser();

		await addVoteToComment(commentId, adminUserId, "down_vote");
		await addVoteToComment(commentId, user1, "down_vote");
		await addVoteToComment(commentId, user2, "down_vote");
		await addVoteToComment(commentId, user3, "down_vote");

		const response = await mercuriusClient.query(Query_comment_downVotesCount, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: commentId } },
		});

		expect(response.errors).toBeUndefined();
		expect(response.data?.comment?.downVotesCount).toBe(4);
	});

	test("should return 0 when comment has only upvotes", async () => {
		const { commentId } = await createTestComment(adminUserId);

		const user1 = await createTestUser();
		const user2 = await createTestUser();

		await addVoteToComment(commentId, user1, "up_vote");
		await addVoteToComment(commentId, user2, "up_vote");

		const response = await mercuriusClient.query(Query_comment_downVotesCount, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: commentId } },
		});

		expect(response.errors).toBeUndefined();
		expect(response.data?.comment?.downVotesCount).toBe(0);
	});

	test("should count only downvotes when mixed vote types exist", async () => {
		const { commentId } = await createTestComment(adminUserId);

		// Create separate users to avoid unique constraint violation
		const downvoter1 = await createTestUser();
		const downvoter2 = await createTestUser();
		const upvoter1 = await createTestUser();
		const upvoter2 = await createTestUser();

		// Add 2 downvotes and 2 upvotes
		await addVoteToComment(commentId, downvoter1, "down_vote");
		await addVoteToComment(commentId, downvoter2, "down_vote");
		await addVoteToComment(commentId, upvoter1, "up_vote");
		await addVoteToComment(commentId, upvoter2, "up_vote");

		const response = await mercuriusClient.query(Query_comment_downVotesCount, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: commentId } },
		});

		expect(response.errors).toBeUndefined();
		expect(response.data?.comment?.downVotesCount).toBe(2);
	});

	test("should return 0 for comment with votes that were all deleted", async () => {
		const { commentId } = await createTestComment(adminUserId);

		const user1 = await createTestUser();

		// Add and then remove vote
		await addVoteToComment(commentId, user1, "down_vote");
		await server.drizzleClient
			.delete(commentVotesTable)
			.where(eq(commentVotesTable.commentId, commentId));

		const response = await mercuriusClient.query(Query_comment_downVotesCount, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: commentId } },
		});

		expect(response.errors).toBeUndefined();
		expect(response.data?.comment?.downVotesCount).toBe(0);
	});
});
