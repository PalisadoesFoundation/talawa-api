import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import {
	commentsTable,
	organizationMembershipsTable,
	organizationsTable,
	postsTable,
} from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Query_comment,
	Query_signIn,
} from "../documentNodes";

// Track created entities for cleanup
const createdOrganizationIds: string[] = [];
const createdPostIds: string[] = [];
const createdCommentIds: string[] = [];

// --- Helpers ---

async function getAdminAuthToken() {
	const email = server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;
	const password = server.envConfig.API_ADMINISTRATOR_USER_PASSWORD;

	if (!email || !password) throw new Error("Admin credentials missing");

	const result = await mercuriusClient.query(Query_signIn, {
		variables: { input: { emailAddress: email, password } },
	});

	const token = result.data?.signIn?.authenticationToken;
	const userId = result.data?.signIn?.user?.id;

	if (!token || !userId) throw new Error("Failed to get admin token");

	return { token, userId };
}

async function createTestComment(creatorId: string) {
	// 1. Create Organization
	const [org] = await server.drizzleClient
		.insert(organizationsTable)
		.values({
			name: `${faker.company.name()}-${randomUUID()}`,
			countryCode: "us",
			userRegistrationRequired: false,
		})
		.returning({ id: organizationsTable.id });

	if (!org) throw new Error("Failed to create org");
	createdOrganizationIds.push(org.id);

	// 2. Add User to Org
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

	// 4. Create Comment via GraphQL
	const { token } = await getAdminAuthToken();
	const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				body: faker.lorem.sentence(),
				postId: post.id,
			},
		},
	});

	const commentId = commentResult.data?.createComment?.id;
	if (!commentId) throw new Error("Failed to create comment");
	createdCommentIds.push(commentId);

	return { commentId, postId: post.id };
}

// --- Tests ---

suite("Comment: post field", () => {
	// IMPORTANT: Delete in reverse dependency order to avoid foreign key constraint violations
	// Dependencies: Comment → Post → OrganizationMembership → Organization
	afterEach(async () => {
		// 1. Delete comments first (depend on posts)
		for (const id of createdCommentIds.splice(0)) {
			await server.drizzleClient
				.delete(commentsTable)
				.where(eq(commentsTable.id, id));
		}

		// 2. Delete posts (depend on organizations and users)
		for (const id of createdPostIds.splice(0)) {
			await server.drizzleClient
				.delete(postsTable)
				.where(eq(postsTable.id, id));
		}

		// 3. Delete organization memberships (depend on organizations and users)
		for (const orgId of createdOrganizationIds) {
			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(eq(organizationMembershipsTable.organizationId, orgId));
		}

		// 4. Delete organizations
		for (const id of createdOrganizationIds.splice(0)) {
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, id));
		}

		// Note: Admin user is not deleted as it's a permanent test fixture

		vi.restoreAllMocks();
	});

	test("should successfully return the associated post", async () => {
		const { userId, token } = await getAdminAuthToken();
		const { commentId, postId } = await createTestComment(userId);

		const response = await mercuriusClient.query(Query_comment, {
			headers: { authorization: `bearer ${token}` },
			variables: { input: { id: commentId } },
		});

		expect(response.errors).toBeUndefined();
		assertToBeNonNullish(response.data?.comment?.post);

		// Verify the resolver returned the correct post
		expect(response.data.comment.post.id).toBe(postId);
	});

	test("should throw 'unexpected' error if post is missing (data corruption scenario)", async () => {
		const { userId, token } = await getAdminAuthToken();
		const { commentId } = await createTestComment(userId);

		// Mock the database query to simulate data corruption where the post doesn't exist
		const spy = vi
			.spyOn(server.drizzleClient.query.postsTable, "findFirst")
			.mockResolvedValue(undefined);

		const response = await mercuriusClient.query(Query_comment, {
			headers: { authorization: `bearer ${token}` },
			variables: { input: { id: commentId } },
		});

		// The resolver should return null for the post field due to the error
		expect(response.data?.comment?.post).toBeNull();

		// Verify the error has the expected 'unexpected' code
		expect(response.errors).toBeDefined();
		expect(response.errors?.[0]?.extensions?.code).toBe("unexpected");

		// Ensure the spy was actually invoked
		expect(spy).toHaveBeenCalled();
	});
});
