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
	Query_signIn,
} from "../documentNodes";

suite("Mutation field createComment", () => {
	let adminToken: string;
	let orgId: string;
	let postId: string;

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
		// Verify token is a non-empty string (not just non-nullish)
		if (typeof token !== "string" || token.trim() === "") {
			throw new Error("signIn returned empty or invalid authenticationToken");
		}
		adminToken = token;

		// Create a shared organization for tests
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Organization Beta",
						description: "A test organization for create comment tests",
						countryCode: "jm",
						state: "St Andrew",
						city: "Kingston",
						postalCode: "12345",
						addressLine1: "456 Test Avenue",
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
					caption: "Test post for create comment tests",
					organizationId: orgId,
				},
			},
			headers: {
				authorization: `Bearer ${adminToken}`,
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
	});

	afterAll(async () => {
		// Cleanup: delete the organization (cascades to posts and comments)
		if (orgId) {
			const deleteOrgResult = await mercuriusClient.mutate(
				Mutation_deleteOrganization,
				{
					headers: { authorization: `Bearer ${adminToken}` },
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

	test("should create comment and return escaped body", async () => {
		// Create a comment with HTML
		const htmlBody = "<script>alert('xss')</script>";
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			variables: {
				input: {
					postId,
					body: htmlBody,
				},
			},
			headers: {
				authorization: `Bearer ${adminToken}`,
			},
		});
		if (
			Array.isArray(commentResult.errors) &&
			commentResult.errors.length > 0
		) {
			throw new Error(
				`createComment failed: ${JSON.stringify(commentResult.errors)}`,
			);
		}
		const createdComment = commentResult.data?.createComment;
		assertToBeNonNullish(createdComment);

		// The API returns the body via the resolver, which calls escapeHTML.
		// Verify the content is properly escaped using flexible assertions.
		const body = createdComment.body;

		// Check that angle brackets are escaped
		expect(body).toContain("&lt;script&gt;");
		expect(body).toContain("&lt;/script&gt;");

		// Check that raw HTML is not present
		expect(body).not.toContain("<script>");
		expect(body).not.toContain("</script>");

		// Check that quotes are escaped (accepts common HTML entity variants: &#39;, &apos;, &#x27;, case-insensitive)
		expect(body).toMatch(/&#39;|&apos;|&#x27;/i);
	});

	test("should return error if comment body exceeds length limit", async () => {
		// Create comment with body exceeding max length
		const longBody = "a".repeat(COMMENT_BODY_MAX_LENGTH + 1);
		const commentResult = await mercuriusClient.mutate(Mutation_createComment, {
			variables: {
				input: {
					postId,
					body: longBody,
				},
			},
			headers: {
				authorization: `Bearer ${adminToken}`,
			},
		});

		// Handle both { data: null, errors: [...] } and { data: { createComment: null }, errors: [...] }
		expect(
			commentResult.data === null || commentResult.data?.createComment === null,
		).toBe(true);
		expect(commentResult.errors).toBeDefined();

		// Find the error with the expected extension code (robust to error ordering)
		const validationError = commentResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"invalid_arguments",
		);
		expect(validationError).toBeDefined();

		// Safely access extensions with proper type narrowing
		const extensions = validationError?.extensions;
		const issues =
			typeof extensions === "object" &&
				extensions !== null &&
				"issues" in extensions
				? (extensions as InvalidArgumentsExtensions).issues
				: undefined;
		expect(issues).toBeDefined();

		// Ensure issues is a non-empty array
		expect(Array.isArray(issues)).toBe(true);
		expect(issues?.length).toBeGreaterThan(0);

		const issueMessages = issues?.map((i) => i.message).join(" ");
		// Use simple assertion for message matching
		expect(issueMessages).toContain(`at most ${COMMENT_BODY_MAX_LENGTH}`);
	});
});
