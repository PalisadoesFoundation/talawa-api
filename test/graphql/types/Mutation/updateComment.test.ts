import { faker } from "@faker-js/faker";
import { beforeAll, expect, suite, test } from "vitest";
import type { InvalidArgumentsExtensions } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createComment,
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_updateComment,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field updateComment", () => {
	let adminToken: string;
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
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create a shared post for tests
		const postResult = await mercuriusClient.mutate(Mutation_createPost, {
			variables: {
				input: {
					caption: faker.lorem.sentence(),
					organizationId: orgId,
				},
			},
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
		});
		if (postResult.errors) {
			throw new Error(
				`createPost failed: ${JSON.stringify(postResult.errors)}`,
			);
		}
		const postId = postResult.data?.createPost?.id;
		assertToBeNonNullish(postId);

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
		if (commentResult.errors) {
			throw new Error(
				`createComment failed: ${JSON.stringify(commentResult.errors)}`,
			);
		}
		const createdCommentId = commentResult.data?.createComment?.id;
		assertToBeNonNullish(createdCommentId);
		commentId = createdCommentId;
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
		// Update comment with long body
		const longBody = "a".repeat(2049);
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
		expect(updateResult.errors).toBeDefined();

		// Find the error with the expected extension code (robust to error ordering)
		const validationError = updateResult.errors?.find(
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
			"String must contain at most 2048 character(s)",
		);
	});
});
