import { faker } from "@faker-js/faker";
import { beforeAll, expect, suite, test } from "vitest";
import { COMMENT_BODY_MAX_LENGTH } from "~/src/drizzle/tables/comments";
import type { InvalidArgumentsExtensions } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createPost,
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
		if (signInResult.errors) {
			throw new Error(`signIn failed: ${JSON.stringify(signInResult.errors)}`);
		}
		const token = signInResult.data?.signIn?.authenticationToken ?? null;
		assertToBeNonNullish(token);
		adminToken = token;

		// Create a shared organization for tests
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${adminToken}` },
				variables: {
					input: {
						name: faker.company.name(),
						description: faker.lorem.sentence(),
						countryCode: "jm",
						state: "St. Andrew",
						city: "Kingston",
						postalCode: "12345",
						addressLine1: faker.location.streetAddress(),
					},
				},
			},
		);
		if (createOrgResult.errors) {
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
					caption: faker.lorem.sentence(),
					organizationId: orgId,
				},
			},
			headers: {
				authorization: `Bearer ${adminToken}`,
			},
		});
		if (postResult.errors) {
			throw new Error(
				`createPost failed: ${JSON.stringify(postResult.errors)}`,
			);
		}
		const createdPostId = postResult.data?.createPost?.id;
		assertToBeNonNullish(createdPostId);
		postId = createdPostId;
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
		if (commentResult.errors) {
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

		// Check that quotes are escaped (accepts both &#39; and &apos;)
		expect(body).toMatch(/&#39;|&apos;/);
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

		expect(commentResult.data?.createComment).toBeNull();
		expect(commentResult.errors).toBeDefined();

		// Find the error with the expected extension code (robust to error ordering)
		const validationError = commentResult.errors?.find(
			(error) =>
				(error.extensions as { code?: string } | undefined)?.code ===
				"invalid_arguments",
		);
		expect(validationError).toBeDefined();

		const issues = (
			validationError?.extensions as unknown as InvalidArgumentsExtensions
		)?.issues;
		expect(issues).toBeDefined();

		const issueMessages = issues?.map((i) => i.message).join(" ");
		expect(issueMessages).toContain(
			`String must contain at most ${COMMENT_BODY_MAX_LENGTH} character(s)`,
		);
	});
});
