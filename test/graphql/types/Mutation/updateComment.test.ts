import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { COMMENT_BODY_MAX_LENGTH } from "~/src/drizzle/tables/comments";
import type { InvalidArgumentsExtensions } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_deleteOrganization,
	Mutation_updateComment,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field updateComment", () => {
	let adminToken: string;
	let orgId: string;
	let postId: string;
	let commentId: string;

	beforeAll(async () => {
		// Sign in to get admin token
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		if (signInResult.errors?.length) {
			throw new Error(`signIn failed: ${JSON.stringify(signInResult.errors)}`);
		}
		const token = signInResult.data?.signIn?.authenticationToken ?? null;
		assertToBeNonNullish(token);
		adminToken = token;

		// Create a shared organization for tests
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Organization Alpha",
						description: "A test organization for update comment tests",
						countryCode: "jm",
						state: "St Andrew",
						city: "Kingston",
						postalCode: "12345",
						addressLine1: "123 Test Street",
					},
				},
			},
		);
		if (createOrgResult.errors?.length) {
			throw new Error(
				`createOrganization failed: ${JSON.stringify(createOrgResult.errors)}`,
			);
		}
		const createdOrgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(createdOrgId);
		orgId = createdOrgId;

		// Create a shared post for tests
		const postResult = await mercuriusClient.mutate(Mutation_createPost, {
			variables: {
				input: {
					caption: "Test post for update comment tests",
					organizationId: orgId,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		if (postResult.errors?.length) {
			throw new Error(
				`createPost failed: ${JSON.stringify(postResult.errors)}`,
			);
		}
		const createdPostId = postResult.data?.createPost?.id;
		assertToBeNonNullish(createdPostId);
		postId = createdPostId;

		// Create a shared comment for tests
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			variables: {
				input: {
					postId,
					body: "Original body for update tests",
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		if (commentResult.errors?.length) {
			throw new Error(
				`createComment failed: ${JSON.stringify(commentResult.errors)}`,
			);
		}
		const createdCommentId = commentResult.data?.createComment?.id;
		assertToBeNonNullish(createdCommentId);
		commentId = createdCommentId;
	});

	// Cleanup created resources in reverse order
	afterAll(async () => {
		// Deleting the organization cascades to delete posts and comments
		if (orgId && adminToken) {
			const deleteOrgResult = await mercuriusClient.mutate(
				Mutation_deleteOrganization,
				{
					headers: { Authorization: `Bearer ${adminToken}` },
					variables: {
						input: { id: orgId },
					},
				},
			);
			if (deleteOrgResult.errors?.length) {
				throw new Error(
					`deleteOrganization cleanup failed: ${JSON.stringify(deleteOrgResult.errors)}`,
				);
			}
		}
	});

	test("should update comment and return escaped body", async () => {
		// Update comment with HTML
		const htmlBody = "<script>alert('xss')</script>";
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: htmlBody,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		if (updateResult.errors) {
			throw new Error(
				`updateComment failed: ${JSON.stringify(updateResult.errors)}`,
			);
		}

		const updatedComment = updateResult.data?.updateComment;
		assertToBeNonNullish(updatedComment);

		// The API returns the body via the resolver, which calls escapeHTML.
		// Verify the content is properly escaped using flexible assertions.
		const body = updatedComment.body;

		// Check that angle brackets are escaped
		expect(body).toContain("&lt;script&gt;");
		expect(body).toContain("&lt;/script&gt;");

		// Check that raw HTML is not present
		expect(body).not.toContain("<script>");
		expect(body).not.toContain("</script>");

		// Check that quotes are escaped (accepts both &#39; and &apos;)
		expect(body).toMatch(/&#39;|&apos;/);
	});

	test("should return error if comment body exceeds length limit", async () => {
		// Update comment with long body (exceeds COMMENT_BODY_MAX_LENGTH)
		const longBody = "a".repeat(COMMENT_BODY_MAX_LENGTH + 1);
		const updateResult = await mercuriusClient.mutate(Mutation_updateComment, {
			variables: {
				input: {
					id: commentId,
					body: longBody,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});

		expect(updateResult.data?.updateComment).toBeNull();
		// Ensure errors is a non-empty array
		expect(updateResult.errors).toBeDefined();
		expect(Array.isArray(updateResult.errors)).toBe(true);
		expect(updateResult.errors?.length).toBeGreaterThan(0);

		// Find the error with the expected extension code (robust to error ordering)
		const validationError = updateResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"invalid_arguments",
		);
		assertToBeNonNullish(validationError);

		const issues = (
			validationError?.extensions as unknown as InvalidArgumentsExtensions
		)?.issues;
		// Ensure issues is a non-empty array
		expect(issues).toBeDefined();
		expect(Array.isArray(issues)).toBe(true);
		expect(issues?.length).toBeGreaterThan(0);

		// Use regex for flexible message matching (uses constant dynamically)
		const issueMessages = issues?.map((i) => i.message).join(" ");
		expect(issueMessages).toMatch(new RegExp(`at most ${COMMENT_BODY_MAX_LENGTH}`, "i"));
	});
});
